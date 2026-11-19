drop policy if exists community_posts_read on public.community_posts;
create policy community_posts_read
on public.community_posts
for select
to authenticated
using (
  public.community_is_member()
  and moderation_status = 'visible'
  and (
    author_id = (select auth.uid())
    or is_featured = true
    or public.community_is_admin()
    or exists (
      select 1 from public.community_follows f
      where f.follower_id = (select auth.uid())
        and f.followed_id = community_posts.author_id
    )
    or exists (
      select 1 from public.community_profiles profile
      where profile.user_id = community_posts.author_id
        and profile.profile_visibility = 'community'
        and profile.searchable = true
    )
  )
);