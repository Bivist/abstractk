-- Read-only verification for community_security_hardening_v2.
select tablename, policyname, cmd, qual
from pg_policies
where schemaname='public'
  and tablename='community_conversation_members'
  and policyname='community_conversation_members_read';

select c.relname, c.relrowsecurity
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind in ('r','p')
  and c.relname like 'community_%'
order by c.relname;

select
  has_function_privilege('anon','public.community_can_message(uuid)','EXECUTE') anon_can_call_internal_helper,
  has_function_privilege('authenticated','public.community_can_message(uuid)','EXECUTE') authenticated_can_call_internal_helper,
  has_table_privilege('authenticated','public.community_posts','UPDATE') posts_update,
  has_table_privilege('authenticated','public.community_notifications','UPDATE') notifications_update,
  has_table_privilege('authenticated','public.community_reports','UPDATE') reports_update,
  has_table_privilege('authenticated','public.community_reports','DELETE') reports_delete;

select position('pg_advisory_xact_lock' in pg_get_functiondef(
  'public.community_admin_set_member(uuid,text)'::regprocedure
)) > 0 as membership_changes_serialized;

select conname
from pg_constraint
where conrelid in ('public.community_profiles'::regclass,'public.community_interest_profiles'::regclass)
  and conname in (
    'community_profiles_display_name_length',
    'community_profiles_bio_length',
    'community_profiles_affiliation_length',
    'community_profiles_avatar_url_length',
    'community_profiles_research_interests_size',
    'community_interest_profiles_liked_ids_bounds',
    'community_interest_profiles_viewed_ids_bounds',
    'community_interest_profiles_terms_bounds'
  )
order by conname;
