-- Keep private accounts discoverable by username while masking private profile fields.
-- Avoid duplicate follow-request notifications for repeated submissions.
begin;
update public.community_profiles
set searchable=true, updated_at=now()
where profile_visibility='private' and searchable=false;

create or replace function public.community_request_follow(p_target_id uuid)
returns text
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_visibility text;
  v_inserted integer;
begin
  if auth.uid() is null or not public.community_is_member() then
    raise exception 'community_membership_required' using errcode='42501';
  end if;
  if p_target_id is null or p_target_id=auth.uid() then
    raise exception 'cannot_follow_self' using errcode='22023';
  end if;
  if exists (
    select 1 from public.community_blocks b
    where (b.blocker_id=auth.uid() and b.blocked_id=p_target_id)
       or (b.blocker_id=p_target_id and b.blocked_id=auth.uid())
  ) then raise exception 'follow_blocked' using errcode='42501'; end if;

  select p.profile_visibility into v_visibility
  from public.community_profiles p
  join public.community_memberships m on m.user_id=p.user_id
  where p.user_id=p_target_id and m.role in ('admin','member');
  if not found then raise exception 'follow_target_unavailable' using errcode='42501'; end if;

  if v_visibility='community' then
    insert into public.community_follows(follower_id,followed_id)
    values(auth.uid(),p_target_id)
    on conflict(follower_id,followed_id) do nothing;
    return 'followed';
  end if;

  insert into public.community_follow_requests(requester_id,target_id)
  values(auth.uid(),p_target_id)
  on conflict do nothing;
  get diagnostics v_inserted = row_count;

  if exists (
    select 1 from public.community_follows
    where follower_id=auth.uid() and followed_id=p_target_id
  ) then return 'followed'; end if;

  if v_inserted>0 then
    insert into public.community_notifications(user_id,actor_id,kind,payload)
    values(p_target_id,auth.uid(),'follow_request','{}'::jsonb);
  end if;
  return 'requested';
end;
$function$;

revoke all on function public.community_request_follow(uuid) from public,anon,authenticated;
grant execute on function public.community_request_follow(uuid) to authenticated;
commit;