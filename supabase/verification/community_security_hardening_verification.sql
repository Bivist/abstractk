-- Read-only verification after community_security_hardening.sql.
-- Run in Supabase SQL Editor. These statements do not modify data.

-- 1) Conversation-member RLS must use the non-recursive helper.
select tablename, policyname, cmd, roles, qual
from pg_policies
where schemaname='public'
  and tablename='community_conversation_members'
  and policyname='community_conversation_members_read';

-- 2) Community tables remain protected by RLS.
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relkind in ('r','p')
  and c.relname like 'community_%'
order by c.relname;

-- 3) Anonymous access to SECURITY DEFINER community functions must remain denied.
select p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute,
       p.proconfig as function_config
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.prosecdef
  and p.proname like 'community_%'
order by p.proname;

-- 4) Direct UPDATE/DELETE access should be absent where the app uses RPC or insert/delete.
select
  has_table_privilege('authenticated','public.community_posts','UPDATE') as posts_update,
  has_table_privilege('authenticated','public.community_comments','UPDATE') as comments_update,
  has_table_privilege('authenticated','public.community_post_likes','UPDATE') as likes_update,
  has_table_privilege('authenticated','public.community_post_bookmarks','UPDATE') as bookmarks_update,
  has_table_privilege('authenticated','public.community_follows','UPDATE') as follows_update,
  has_table_privilege('authenticated','public.community_blocks','UPDATE') as blocks_update,
  has_table_privilege('authenticated','public.community_shared_notes','UPDATE') as shared_notes_update,
  has_table_privilege('authenticated','public.community_notifications','UPDATE') as notifications_update,
  has_table_privilege('authenticated','public.community_reports','UPDATE') as reports_update,
  has_table_privilege('authenticated','public.community_reports','DELETE') as reports_delete;

-- 5) Profile constraints and the serialized admin-role guard must exist.
select conname
from pg_constraint
where conrelid='public.community_profiles'::regclass
  and conname in (
    'community_profiles_display_name_length',
    'community_profiles_bio_length',
    'community_profiles_affiliation_length',
    'community_profiles_avatar_url_length',
    'community_profiles_research_interests_size'
  )
order by conname;

select
  position('pg_advisory_xact_lock' in pg_get_functiondef(
    'public.community_admin_set_member(uuid,text)'::regprocedure
  )) > 0 as admin_role_changes_are_serialized;

-- 6) Authenticated and anonymous roles must not create objects in public.
select
  has_schema_privilege('anon','public','CREATE') as anon_can_create_public,
  has_schema_privilege('authenticated','public','CREATE') as authenticated_can_create_public;


-- 7) Verify the collaborative recommendation input bounds and scoring guard.
select conname
from pg_constraint
where conrelid='public.community_interest_profiles'::regclass
  and conname in (
    'community_interest_profiles_liked_ids_bounds',
    'community_interest_profiles_viewed_ids_bounds',
    'community_interest_profiles_terms_bounds'
  )
order by conname;

select
  position('count(DISTINCT term)' in pg_get_functiondef(
    'public.get_community_recommendations()'::regprocedure
  )) > 0 as duplicate_terms_do_not_inflate_scores,
  has_function_privilege('anon','public.get_community_recommendations()','EXECUTE') as anon_can_execute;

-- 8) Verify the admin-role race guard and that no direct-update policies remain.
select
  position('pg_advisory_xact_lock' in pg_get_functiondef(
    'public.community_admin_set_member(uuid,text)'::regprocedure
  )) > 0 as admin_role_changes_are_serialized;

select tablename, policyname, cmd
from pg_policies
where schemaname='public'
  and tablename in ('community_posts','community_notifications')
  and cmd='UPDATE';
