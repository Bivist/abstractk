-- Admin-only account lookup for the controlled community console.
-- Email is returned only to an authenticated community admin and is never exposed
-- through community profile queries.
begin;

create or replace function public.community_admin_search_users(
  p_query text,
  p_limit integer default 20
)
returns table (
  user_id uuid,
  email text,
  display_name text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_query text := trim(coalesce(p_query, ''));
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 50);
begin
  if auth.uid() is null or not public.community_is_admin() then
    raise exception 'Bu işlem için topluluk yöneticisi olmalısınız.'
      using errcode = '42501';
  end if;

  if length(v_query) < 2 then
    return;
  end if;

  return query
  select
    u.id,
    u.email::text,
    coalesce(
      nullif(u.raw_user_meta_data ->> 'display_name', ''),
      nullif(u.raw_user_meta_data ->> 'full_name', ''),
      nullif(u.raw_user_meta_data ->> 'name', ''),
      ''
    ),
    u.created_at
  from auth.users u
  where
    u.email ilike '%' || v_query || '%'
    or u.id::text ilike v_query || '%'
    or coalesce(u.raw_user_meta_data ->> 'display_name', '') ilike '%' || v_query || '%'
    or coalesce(u.raw_user_meta_data ->> 'full_name', '') ilike '%' || v_query || '%'
    or coalesce(u.raw_user_meta_data ->> 'name', '') ilike '%' || v_query || '%'
  order by u.created_at desc
  limit v_limit;
end;
$$;

revoke all on function public.community_admin_search_users(text, integer) from public, anon;
grant execute on function public.community_admin_search_users(text, integer) to authenticated;

commit;
