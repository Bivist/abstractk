-- Abstract Topluluk güvenlik sıkılaştırması
-- Bu dosya otomatik çalıştırılmaz. Önce Preview'da gözden geçirilmeli,
-- ardından yetkili proje yöneticisi tarafından Supabase SQL Editor'de uygulanmalıdır.
-- Veri silmez; mevcut topluluk içeriklerini değiştirmez.

begin;

-- 1) RLS recursion fix:
-- The previous policy queried community_conversation_members from itself.
-- Use the existing SECURITY DEFINER membership predicate instead.
drop policy if exists community_conversation_members_read
  on public.community_conversation_members;

create policy community_conversation_members_read
  on public.community_conversation_members
  for select to authenticated
  using (
    public.community_is_member()
    and public.community_is_conversation_member(conversation_id)
  );

-- 2) Least-privilege grants:
-- These features do not support direct row updates in the current UI/API.
-- Keep INSERT/SELECT/DELETE grants and the existing RLS policies where needed.
revoke update on table
  public.community_posts,
  public.community_comments,
  public.community_post_likes,
  public.community_post_bookmarks,
  public.community_follows,
  public.community_blocks,
  public.community_shared_notes,
  public.community_notifications
from authenticated;

-- Post editing is not implemented. Authors/admins can still delete via RLS.
drop policy if exists community_posts_update on public.community_posts;

-- Notifications are marked read only through the owner-scoped SECURITY DEFINER RPC.
drop policy if exists community_notifications_update on public.community_notifications;

-- Reports are submitted by members and reviewed only through the admin RPC.
revoke update, delete on table public.community_reports from authenticated;

-- 3) Server-side profile limits matching the current profile form.
-- The client already truncates display name, affiliation and bio.
-- These checks also protect direct Data API calls that bypass the UI.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.community_profiles'::regclass
      and conname = 'community_profiles_display_name_length'
  ) then
    alter table public.community_profiles
      add constraint community_profiles_display_name_length
      check (char_length(display_name) <= 80);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.community_profiles'::regclass
      and conname = 'community_profiles_bio_length'
  ) then
    alter table public.community_profiles
      add constraint community_profiles_bio_length
      check (char_length(bio) <= 500);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.community_profiles'::regclass
      and conname = 'community_profiles_affiliation_length'
  ) then
    alter table public.community_profiles
      add constraint community_profiles_affiliation_length
      check (char_length(affiliation) <= 120);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.community_profiles'::regclass
      and conname = 'community_profiles_avatar_url_length'
  ) then
    alter table public.community_profiles
      add constraint community_profiles_avatar_url_length
      check (avatar_url is null or char_length(avatar_url) <= 2048);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.community_profiles'::regclass
      and conname = 'community_profiles_research_interests_size'
  ) then
    alter table public.community_profiles
      add constraint community_profiles_research_interests_size
      check (
        cardinality(research_interests) <= 12
        and char_length(array_to_string(research_interests, ', ')) <= 1200
      );
  end if;
end;
$$;

-- 4) Bound collaborative-recommendation input and prevent duplicate-term score inflation.
-- The app intentionally uses collaborative recommendations for signed-in users.
-- Only aggregate paper IDs/relevance are returned; raw profiles and user IDs stay private.
do $
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.community_interest_profiles'::regclass
      and conname = 'community_interest_profiles_liked_ids_bounds'
  ) then
    alter table public.community_interest_profiles
      add constraint community_interest_profiles_liked_ids_bounds
      check (
        cardinality(liked_paper_ids) <= 500
        and pg_column_size(liked_paper_ids) <= 65536
        and array_position(liked_paper_ids, null) is null
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.community_interest_profiles'::regclass
      and conname = 'community_interest_profiles_viewed_ids_bounds'
  ) then
    alter table public.community_interest_profiles
      add constraint community_interest_profiles_viewed_ids_bounds
      check (
        cardinality(viewed_paper_ids) <= 500
        and pg_column_size(viewed_paper_ids) <= 65536
        and array_position(viewed_paper_ids, null) is null
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.community_interest_profiles'::regclass
      and conname = 'community_interest_profiles_terms_bounds'
  ) then
    alter table public.community_interest_profiles
      add constraint community_interest_profiles_terms_bounds
      check (
        cardinality(interest_terms) <= 300
        and pg_column_size(interest_terms) <= 65536
        and array_position(interest_terms, null) is null
      );
  end if;
end;
$;

-- A user may only read/write their own raw interest profile (existing RLS).
-- This RPC deliberately computes recommendations across profiles without
-- returning another user's identity or raw interest terms. DISTINCT prevents
-- duplicate array entries from artificially inflating a profile's score.
create or replace function public.get_community_recommendations()
returns table (paper_id text, relevance bigint)
language sql
security definer
set search_path = public, pg_temp
as $
  with mine as (
    select liked_paper_ids, viewed_paper_ids, interest_terms
    from public.community_interest_profiles
    where user_id = auth.uid()
      and auth.uid() is not null
  ),
  similar_users as (
    select
      other.user_id,
      other.liked_paper_ids,
      (
        select count(distinct term)::bigint
        from unnest(other.interest_terms) as terms(term)
        where term = any(mine.interest_terms)
      ) as overlap
    from public.community_interest_profiles other
    cross join mine
    where other.user_id <> auth.uid()
      and other.interest_terms && mine.interest_terms
  ),
  candidates as (
    select distinct liked.paper_id as candidate_id, s.overlap
    from similar_users s
    cross join lateral unnest(s.liked_paper_ids) as liked(paper_id)
    where s.overlap > 0
      and liked.paper_id is not null
      and length(trim(liked.paper_id)) > 0
  )
  select c.candidate_id as paper_id, sum(c.overlap)::bigint as relevance
  from candidates c
  cross join mine
  where not (c.candidate_id = any(mine.liked_paper_ids || mine.viewed_paper_ids))
  group by c.candidate_id
  order by relevance desc
  limit 100;
$;

-- 5) Serialize admin-role changes to prevent concurrent removal of the last admin.
-- Re-check the caller's admin role after acquiring the transaction-scoped lock.
create or replace function public.community_admin_set_member(
  p_user_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_previous_role text;
begin
  if auth.uid() is null then
    raise exception 'admin_only' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(74123901, 18001);

  if not exists (
    select 1
    from public.community_memberships m
    where m.user_id = auth.uid()
      and m.role = 'admin'
  ) then
    raise exception 'admin_only' using errcode = '42501';
  end if;

  if p_user_id is null or p_role is null
     or p_role not in ('admin', 'member', 'disabled') then
    raise exception 'invalid_membership_request' using errcode = '22023';
  end if;

  select role into v_previous_role
  from public.community_memberships
  where user_id = p_user_id
  for update;

  if v_previous_role = 'admin' and p_role <> 'admin' then
    if (
      select count(*)
      from public.community_memberships
      where role = 'admin'
    ) <= 1 then
      raise exception 'cannot_remove_last_admin' using errcode = '23514';
    end if;
  end if;

  insert into public.community_memberships (user_id, role, granted_by)
  values (p_user_id, p_role, auth.uid())
  on conflict (user_id) do update
    set role = excluded.role,
        granted_by = auth.uid(),
        updated_at = now();

  insert into public.community_admin_audit (
    actor_id, action, target_user_id, details
  )
  values (
    auth.uid(),
    'membership_role_changed',
    p_user_id,
    jsonb_build_object(
      'previous_role', v_previous_role,
      'new_role', p_role
    )
  );
end;
$$;

-- CREATE OR REPLACE preserves the function's existing EXECUTE ACL.
-- Keep its existing authenticated-only RPC access; no PUBLIC/anon access is added.

commit;
