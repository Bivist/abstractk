create table if not exists public.community_post_views (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  viewer_id uuid not null references auth.users(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (post_id, viewer_id)
);

alter table public.community_post_views enable row level security;
revoke all on table public.community_post_views from anon, authenticated;

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
    and coalesce(p.moderation_status, 'visible') <> 'removed';

  if v_author_id is null then
    raise exception 'Post not found';
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
  left join public.community_post_views views on views.post_id = requested.id
  group by requested.id;
end;
$$;

revoke all on function public.community_record_post_view(uuid) from public, anon;
revoke all on function public.community_post_view_counts(uuid[]) from public, anon;
grant execute on function public.community_record_post_view(uuid) to authenticated;
grant execute on function public.community_post_view_counts(uuid[]) to authenticated;