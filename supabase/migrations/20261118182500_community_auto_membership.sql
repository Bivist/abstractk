-- Automatically enroll every authenticated account in the private community.
-- Existing explicit admin/member/disabled decisions are preserved.
-- Existing accounts are backfilled once; new Auth users are enrolled by trigger.

begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.community_default_username(
  p_user_id uuid,
  p_email text
)
returns text
language sql
immutable
set search_path = ''
as $function$
  with normalized as (
    select regexp_replace(
      lower(coalesce(nullif(split_part(coalesce(p_email, ''), '@', 1), ''), 'uye')),
      '[^a-z0-9_.-]',
      '',
      'g'
    ) as base
  )
  select
    (case when char_length(base) < 3 then 'uye' else left(base, 17) end)
    || '-' || left(md5(p_user_id::text), 12)
  from normalized;
$function$;

revoke all on function private.community_default_username(uuid, text)
  from public, anon, authenticated;

create or replace function private.community_on_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_display_name text;
  v_avatar_url text;
begin
  -- A prior admin decision is never overwritten by automatic enrollment.
  insert into public.community_memberships (user_id, role, granted_by)
  values (new.id, 'member', null)
  on conflict (user_id) do nothing;

  v_display_name := left(
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(btrim(split_part(coalesce(new.email, ''), '@', 1)), ''),
      'Üye'
    ),
    80
  );

  v_avatar_url := coalesce(
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'picture'
  );

  -- Treat user metadata as untrusted input and keep only bounded HTTP(S) URLs.
  if v_avatar_url is not null
     and (v_avatar_url !~* '^https?://' or char_length(v_avatar_url) > 2048) then
    v_avatar_url := null;
  end if;

  insert into public.community_profiles (
    user_id,
    username,
    display_name,
    avatar_url
  )
  values (
    new.id,
    private.community_default_username(new.id, new.email),
    v_display_name,
    v_avatar_url
  )
  on conflict (user_id) do nothing;

  return new;
end;
$function$;

revoke all on function private.community_on_auth_user_created()
  from public, anon, authenticated;

drop trigger if exists community_auto_membership_on_auth_user_created on auth.users;

create trigger community_auto_membership_on_auth_user_created
after insert on auth.users
for each row
execute function private.community_on_auth_user_created();

-- Backfill users who already have an Auth account but no community role.
-- Existing admin/member/disabled rows are deliberately left untouched.
insert into public.community_memberships (user_id, role, granted_by)
select u.id, 'member', null
from auth.users u
on conflict (user_id) do nothing;

-- Create editable community profiles only for users who do not already have one.
-- Email addresses remain in Auth and are not copied into community_profiles.
insert into public.community_profiles (
  user_id,
  username,
  display_name,
  avatar_url
)
select
  u.id,
  private.community_default_username(u.id, u.email),
  left(
    coalesce(
      nullif(btrim(u.raw_user_meta_data ->> 'display_name'), ''),
      nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(u.raw_user_meta_data ->> 'name'), ''),
      nullif(btrim(split_part(coalesce(u.email, ''), '@', 1)), ''),
      'Üye'
    ),
    80
  ),
  case
    when coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture') ~* '^https?://'
     and char_length(coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')) <= 2048
    then coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
    else null
  end
from auth.users u
where not exists (
  select 1
  from public.community_profiles p
  where p.user_id = u.id
)
on conflict (user_id) do nothing;

commit;
