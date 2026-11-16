-- Abstract Controlled Community: explicit table grants and RPC input validation.
-- Safe to re-run; does not modify existing user content.

begin;

revoke all privileges on table public.community_settings from anon, authenticated;
revoke all privileges on table public.community_memberships from anon, authenticated;
revoke all privileges on table public.community_profiles from anon, authenticated;
revoke all privileges on table public.community_admin_audit from anon, authenticated;

grant select on table public.community_settings to authenticated;
grant select on table public.community_memberships to authenticated;
grant select, insert, update, delete on table public.community_profiles to authenticated;
grant select on table public.community_admin_audit to authenticated;

create or replace function public.community_admin_set_member(
  p_user_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_previous_role text;
begin
  if auth.uid() is null or not public.community_is_admin() then
    raise exception 'admin_only' using errcode = '42501';
  end if;

  if p_user_id is null or p_role is null
     or p_role not in ('admin', 'member', 'disabled') then
    raise exception 'invalid_membership_request' using errcode = '22023';
  end if;

  select role into v_previous_role
  from public.community_memberships
  where user_id = p_user_id
  for update;

  if v_previous_role = 'admin' and p_role <> 'admin' then
    if (select count(*) from public.community_memberships where role = 'admin') <= 1 then
      raise exception 'cannot_remove_last_admin' using errcode = '23514';
    end if;
  end if;

  insert into public.community_memberships (user_id, role, granted_by)
  values (p_user_id, p_role, auth.uid())
  on conflict (user_id) do update
    set role = excluded.role,
        granted_by = auth.uid(),
        updated_at = now();

  insert into public.community_admin_audit (actor_id, action, target_user_id, details)
  values (
    auth.uid(),
    'membership_role_changed',
    p_user_id,
    jsonb_build_object('previous_role', v_previous_role, 'new_role', p_role)
  );
end;
$$;

revoke all on function public.community_admin_set_member(uuid, text) from public, anon;
grant execute on function public.community_admin_set_member(uuid, text) to authenticated;

commit;
