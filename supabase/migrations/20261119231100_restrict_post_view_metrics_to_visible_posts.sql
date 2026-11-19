create or replace function public.community_record_post_view(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_author_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if not public.community_is_member() then
    raise exception 'Kamara membership required';
  end if;

  select p.author_id into v_author_id
  from public.community_posts p
  where p.id = p_post_id
    and p.moderation_status = 'visible'
    and (
      p.author_id = v_user_id
      or p.is_featured = true
      or public.community_is_admin()
      or exists (
        select 1 from public.community_follows f
        where f.follower_id = v_user_id and f.followed_id = p.author_id
      )
      or exists (
        select 1 from public.community_profiles profile
        where profile.user_id = p.author_id
          and profile.profile_visibility = 'community'
          and profile.searchable = true
      )
    );

  if v_author_id is null then
    raise exception 'Post not found or not visible';
  end if;

  if v_author_id <> v_user_id then
    insert into public.community_post_views(post_id, viewer_id)
    values (p_post_id, v_user_id)
    on conflict (post_id, viewer_id) do nothing;
  end if;
end;
$$;

create or replace function public.community_post_view_counts(p_post_ids uuid[])
returns table(post_id uuid, view_count bigint)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if not public.community_is_member() then
    raise exception 'Kamara membership required';
  end if;

  return query
  select requested.id, count(views.viewer_id)::bigint
  from unnest(coalesce(p_post_ids, array[]::uuid[])) as requested(id)
  join public.community_posts post on post.id = requested.id
  left join public.community_post_views views on views.post_id = requested.id
  where post.moderation_status = 'visible'
    and (
      post.author_id = auth.uid()
      or post.is_featured = true
      or public.community_is_admin()
      or exists (
        select 1 from public.community_follows f
        where f.follower_id = auth.uid() and f.followed_id = post.author_id
      )
      or exists (
        select 1 from public.community_profiles profile
        where profile.user_id = post.author_id
          and profile.profile_visibility = 'community'
          and profile.searchable = true
      )
    )
  group by requested.id;
end;
$$;

revoke all on function public.community_record_post_view(uuid) from public, anon;
revoke all on function public.community_post_view_counts(uuid[]) from public, anon;
grant execute on function public.community_record_post_view(uuid) to authenticated;
grant execute on function public.community_post_view_counts(uuid[]) to authenticated;