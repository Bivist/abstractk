begin;
drop policy if exists community_bookmarks_insert on public.community_post_bookmarks;
create policy community_bookmarks_insert
on public.community_post_bookmarks for insert to authenticated
with check (
  public.community_is_member()
  and user_id=(select auth.uid())
  and exists (
    select 1 from public.community_posts p
    where p.id=community_post_bookmarks.post_id
  )
);
commit;