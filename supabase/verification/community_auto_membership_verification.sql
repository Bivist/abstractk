-- Read-only verification for automatic community membership.
select
  (select count(*) from auth.users) as auth_users,
  (select count(*) from public.community_memberships) as membership_rows,
  (select count(*) from public.community_profiles) as profile_rows,
  (select count(*) from auth.users u left join public.community_memberships m on m.user_id=u.id where m.user_id is null) as missing_memberships,
  (select count(*) from auth.users u left join public.community_profiles p on p.user_id=u.id where p.user_id is null) as missing_profiles;

select role, count(*) as accounts
from public.community_memberships
group by role
order by role;

select
  t.tgname as trigger_name,
  t.tgenabled as trigger_enabled,
  p.proname as function_name,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute
from pg_trigger t
join pg_class c on c.oid=t.tgrelid
join pg_namespace n on n.oid=c.relnamespace
join pg_proc p on p.oid=t.tgfoid
where n.nspname='auth' and c.relname='users' and not t.tgisinternal
  and t.tgname='community_auto_membership_on_auth_user_created';

select is_enabled
from public.community_settings
where id=1;
