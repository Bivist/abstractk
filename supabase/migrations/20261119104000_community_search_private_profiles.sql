-- Allow private profiles to be found without exposing their private profile fields.
begin;
create or replace function public.community_search_members_v2(p_query text,p_limit integer default 20)
returns table(user_id uuid,username text,display_name text,avatar_url text,affiliation text,research_interests text[],profile_visibility text)
language plpgsql stable security definer set search_path=''
as $function$
begin
  if auth.uid() is null or not public.community_is_member() then
    raise exception 'community_membership_required' using errcode='42501';
  end if;
  if p_query is null or char_length(trim(p_query))<2 or char_length(p_query)>80 then
    raise exception 'search_query_too_short' using errcode='22023';
  end if;
  return query
    select p.user_id,p.username,p.display_name,
      case when p.profile_visibility='community' then p.avatar_url else null::text end,
      case when p.profile_visibility='community' then p.affiliation else ''::text end,
      case when p.profile_visibility='community' then p.research_interests else array[]::text[] end,
      p.profile_visibility
    from public.community_profiles p
    join public.community_memberships m on m.user_id=p.user_id and m.role in ('admin','member')
    where p.searchable=true and p.user_id<>auth.uid()
      and (p.username ilike '%'||trim(p_query)||'%' or p.display_name ilike '%'||trim(p_query)||'%' or (p.profile_visibility='community' and p.affiliation ilike '%'||trim(p_query)||'%'))
      and not exists(select 1 from public.community_blocks b where (b.blocker_id=auth.uid() and b.blocked_id=p.user_id) or (b.blocker_id=p.user_id and b.blocked_id=auth.uid()))
    order by p.display_name,p.username
    limit greatest(1,least(coalesce(p_limit,20),30));
end;
$function$;
revoke all on function public.community_search_members_v2(text,integer) from public,anon,authenticated;
grant execute on function public.community_search_members_v2(text,integer) to authenticated;
commit;