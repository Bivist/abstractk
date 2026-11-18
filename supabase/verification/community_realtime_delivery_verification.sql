-- Read-only verification for community realtime delivery.
select
  p.pubname,
  pt.schemaname,
  pt.tablename
from pg_publication p
left join pg_publication_tables pt
  on pt.pubname = p.pubname
 and pt.schemaname = 'public'
 and pt.tablename in ('community_messages', 'community_notifications')
where p.pubname = 'supabase_realtime'
order by pt.tablename;

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  coalesce(bool_or(pol.policyname = 'community_messages_read'), false) as has_message_member_policy,
  coalesce(bool_or(pol.policyname = 'community_notifications_read'), false) as has_notification_recipient_policy
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies pol
  on pol.schemaname = n.nspname
 and pol.tablename = c.relname
where n.nspname = 'public'
  and c.relname in ('community_messages', 'community_notifications')
group by c.relname, c.relrowsecurity
order by c.relname;
