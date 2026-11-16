-- Safe member directory and conversation participant visibility.
begin;
create or replace function public.community_search_members(p_query text,p_limit integer default 20)
returns table(user_id uuid,username text,display_name text,avatar_url text,affiliation text,research_interests text[])
language plpgsql stable security definer
set search_path=public,pg_temp
as $$
begin
  if auth.uid() is null or not public.community_is_member() then
    raise exception 'community_membership_required' using errcode='42501';
  end if;
  if p_query is null or char_length(trim(p_query)) < 2 or char_length(p_query)>80 then
    raise exception 'search_query_too_short' using errcode='22023';
  end if;
  return query
    select p.user_id,p.username,p.display_name,p.avatar_url,p.affiliation,p.research_interests
    from public.community_profiles p
    join public.community_memberships m on m.user_id=p.user_id and m.role in ('admin','member')
    where p.searchable=true and p.profile_visibility='community'
      and p.user_id<>auth.uid()
      and (p.username ilike '%'||trim(p_query)||'%' or p.display_name ilike '%'||trim(p_query)||'%' or p.affiliation ilike '%'||trim(p_query)||'%')
      and not exists(select 1 from public.community_blocks b where (b.blocker_id=auth.uid() and b.blocked_id=p.user_id) or (b.blocker_id=p.user_id and b.blocked_id=auth.uid()))
    order by p.display_name,p.username
    limit greatest(1,least(coalesce(p_limit,20),30));
end;
$$;
drop policy if exists community_conversation_members_read on public.community_conversation_members;
create policy community_conversation_members_read on public.community_conversation_members
for select to authenticated using (
  public.community_is_member()
  and exists(select 1 from public.community_conversation_members own
    where own.conversation_id=community_conversation_members.conversation_id and own.user_id=auth.uid())
);
revoke all on function public.community_search_members(text,integer) from public,anon;
grant execute on function public.community_search_members(text,integer) to authenticated;
commit;
