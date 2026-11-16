-- Read-only verification for the private community migrations.
-- Run only after 202611170001, 202611170002 and 202611170003 have completed.

-- 1) Confirm that all expected community tables exist and have RLS enabled.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relkind='r'
  and c.relname in (
    'community_settings','community_memberships','community_profiles','community_admin_audit',
    'community_posts','community_post_likes','community_post_bookmarks','community_comments',
    'community_follows','community_reports','community_blocks','community_conversations',
    'community_conversation_members','community_messages','community_shared_notes',
    'community_notifications'
  )
order by c.relname;

-- 2) Inspect policies for the newly added content tables.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname='public'
  and tablename like 'community_%'
order by tablename, policyname;

-- 3) Confirm the global switch is still OFF before the first live test.
select id, is_enabled, updated_at
from public.community_settings
where id=1;

-- 4) Confirm required RPCs exist and only authenticated users can execute them.
select
  p.proname as function_name,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.proname in (
    'community_is_enabled','community_is_admin','community_is_member',
    'community_admin_set_member','community_admin_set_enabled','community_admin_search_users',
    'community_search_members','community_create_conversation','community_send_message',
    'community_mark_conversation_read','community_share_note_snapshot','community_revoke_shared_note',
    'community_admin_review_report','community_mark_notifications_read'
  )
order by p.proname;

-- 5) Confirm that anon has no direct table privileges on private content.
select
  table_name,
  has_table_privilege('anon', format('public.%I', table_name), 'SELECT') as anon_can_select,
  has_table_privilege('authenticated', format('public.%I', table_name), 'SELECT') as authenticated_has_select
from (values
  ('community_posts'),('community_post_likes'),('community_post_bookmarks'),
  ('community_comments'),('community_follows'),('community_reports'),
  ('community_blocks'),('community_conversations'),('community_conversation_members'),
  ('community_messages'),('community_shared_notes'),('community_notifications')
) as t(table_name)
order by table_name;
