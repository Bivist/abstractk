-- Ensure related feed data follows the same visibility boundary as posts.
begin;

drop policy if exists community_shared_notes_read on public.community_shared_notes;
create policy community_shared_notes_read
on public.community_shared_notes for select to authenticated
using (
  public.community_is_member()
  and revoked_at is null
  and (
    owner_id=(select auth.uid())
    or public.community_is_admin()
    or exists (
      select 1 from public.community_follows f
      where f.follower_id=(select auth.uid())
        and f.followed_id=community_shared_notes.owner_id
    )
  )
);

drop policy if exists community_comments_read on public.community_comments;
create policy community_comments_read
on public.community_comments for select to authenticated
using (
  public.community_is_member()
  and exists (
    select 1 from public.community_posts p
    where p.id=community_comments.post_id
  )
);

drop policy if exists community_comments_insert on public.community_comments;
create policy community_comments_insert
on public.community_comments for insert to authenticated
with check (
  public.community_is_member()
  and author_id=(select auth.uid())
  and exists (
    select 1 from public.community_posts p
    where p.id=community_comments.post_id
  )
  and (
    parent_id is null
    or exists (
      select 1 from public.community_comments parent
      where parent.id=community_comments.parent_id
        and parent.post_id=community_comments.post_id
    )
  )
);

drop policy if exists community_likes_read on public.community_post_likes;
create policy community_likes_read
on public.community_post_likes for select to authenticated
using (
  public.community_is_member()
  and exists (
    select 1 from public.community_posts p
    where p.id=community_post_likes.post_id
  )
);

drop policy if exists community_likes_insert on public.community_post_likes;
create policy community_likes_insert
on public.community_post_likes for insert to authenticated
with check (
  public.community_is_member()
  and user_id=(select auth.uid())
  and exists (
    select 1 from public.community_posts p
    where p.id=community_post_likes.post_id
  )
);

commit;
