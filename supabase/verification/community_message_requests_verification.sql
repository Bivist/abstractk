-- Read-only verification for message requests and approved connections.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  has_table_privilege('anon', format('public.%I',c.relname), 'SELECT') as anon_can_select,
  has_table_privilege('authenticated', format('public.%I',c.relname), 'SELECT') as authenticated_can_select
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relname in ('community_connections','community_message_requests')
order by c.relname;

select
  p.proname,
  has_function_privilege('anon',p.oid,'EXECUTE') as anon_can_execute,
  has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_can_execute
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.proname in (
    'community_create_message_request',
    'community_respond_message_request',
    'community_admin_connect_users',
    'community_create_conversation',
    'community_can_message'
  )
order by p.proname;

select
  (select count(*) from public.community_message_requests where status='pending') as pending_requests,
  (select count(*) from public.community_connections) as approved_connections;

select pubname,tablename
from pg_publication_tables
where pubname='supabase_realtime'
  and schemaname='public'
  and tablename='community_message_requests';
