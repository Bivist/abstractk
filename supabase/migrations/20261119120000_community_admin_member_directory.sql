-- Admin-only member directory for the community console.
-- Exposes membership join dates and public community names, never email addresses.

begin;

create or replace function public.community_admin_list_members()
returns table (
  user_id uuid,
  role text,
  joined_at timestamptz,
  display_name text,
  username text
)
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if auth.uid() is null or not public.community_is_admin() then
    raise exception 'Bu işlem için topluluk yöneticisi olmalısınız.'
      using errcode = '42501';
  end if;

  return query
  select
    m.user_id,
    m.role,
    m.created_at,
    coalesce(p.display_name, ''),
    coalesce(p.username, '')
  from public.community_memberships m
  left join public.community_profiles p on p.user_id = m.user_id
  where m.role = 'member'
  order by m.created_at desc, m.user_id;
end;
$$;

revoke all on function public.community_admin_list_members() from public, anon;
grant execute on function public.community_admin_list_members() to authenticated;

commit;
