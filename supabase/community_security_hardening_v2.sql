-- Abstract Community security hardening v2
-- Applied to Supabase as community_security_hardening_v2 on 2026-11-18.
-- Safe additive hardening: no user content or membership rows are deleted.

begin;

drop policy if exists community_conversation_members_read
  on public.community_conversation_members;

create policy community_conversation_members_read
  on public.community_conversation_members
  for select to authenticated
  using (
    public.community_is_member()
    and public.community_is_conversation_member(conversation_id)
  );

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

drop policy if exists community_posts_update on public.community_posts;
drop policy if exists community_notifications_update on public.community_notifications;

revoke update, delete on table public.community_reports from authenticated;

revoke all on function public.community_can_message(uuid)
  from public, anon, authenticated;

create or replace function public.community_admin_set_member(
  p_user_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_previous_role text;
begin
  if auth.uid() is null then
    raise exception 'admin_only' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(74123901, 18001);

  if not public.community_is_admin() then
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
$function$;

do $constraints$
begin
  if not exists (select 1 from pg_constraint where conrelid='public.community_profiles'::regclass and conname='community_profiles_display_name_length') then
    alter table public.community_profiles add constraint community_profiles_display_name_length check (char_length(display_name) <= 80);
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.community_profiles'::regclass and conname='community_profiles_bio_length') then
    alter table public.community_profiles add constraint community_profiles_bio_length check (char_length(bio) <= 500);
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.community_profiles'::regclass and conname='community_profiles_affiliation_length') then
    alter table public.community_profiles add constraint community_profiles_affiliation_length check (char_length(affiliation) <= 120);
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.community_profiles'::regclass and conname='community_profiles_avatar_url_length') then
    alter table public.community_profiles add constraint community_profiles_avatar_url_length check (avatar_url is null or char_length(avatar_url) <= 2048);
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.community_profiles'::regclass and conname='community_profiles_research_interests_size') then
    alter table public.community_profiles add constraint community_profiles_research_interests_size check (cardinality(research_interests) <= 12 and char_length(array_to_string(research_interests, ', ')) <= 1200);
  end if;
end;
$constraints$;

do $bounds$
begin
  if not exists (select 1 from pg_constraint where conrelid='public.community_interest_profiles'::regclass and conname='community_interest_profiles_liked_ids_bounds') then
    alter table public.community_interest_profiles add constraint community_interest_profiles_liked_ids_bounds check (cardinality(liked_paper_ids) <= 500 and pg_column_size(liked_paper_ids) <= 65536 and array_position(liked_paper_ids, null) is null);
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.community_interest_profiles'::regclass and conname='community_interest_profiles_viewed_ids_bounds') then
    alter table public.community_interest_profiles add constraint community_interest_profiles_viewed_ids_bounds check (cardinality(viewed_paper_ids) <= 500 and pg_column_size(viewed_paper_ids) <= 65536 and array_position(viewed_paper_ids, null) is null);
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.community_interest_profiles'::regclass and conname='community_interest_profiles_terms_bounds') then
    alter table public.community_interest_profiles add constraint community_interest_profiles_terms_bounds check (cardinality(interest_terms) <= 300 and pg_column_size(interest_terms) <= 65536 and array_position(interest_terms, null) is null);
  end if;
end;
$bounds$;

commit;