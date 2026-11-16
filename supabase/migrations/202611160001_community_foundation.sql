-- Abstract Controlled Community: foundation
-- Additive migration. Does not alter or delete existing user data.
-- Apply only after reviewing this file in Supabase SQL Editor.

begin;

-- 1) Tighten the existing user-owned tables.
-- RLS remains the row-level boundary for authenticated users.
revoke all privileges on table public.user_data from anon;
revoke all privileges on table public.community_interest_profiles from anon;

revoke truncate, references, trigger on table public.user_data from authenticated;
revoke truncate, references, trigger on table public.community_interest_profiles from authenticated;

grant select, insert, update, delete on table public.user_data to authenticated;
grant select, insert, update, delete on table public.community_interest_profiles to authenticated;

-- This recommendation RPC is for signed-in users only. Its implementation is unchanged.
revoke all on function public.get_community_recommendations() from public;
revoke all on function public.get_community_recommendations() from anon;
grant execute on function public.get_community_recommendations() to authenticated;

-- 2) Global feature switch. Disabled by default until explicitly enabled by the admin.
create table if not exists public.community_settings (
  id smallint primary key default 1 check (id = 1),
  is_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.community_settings (id, is_enabled)
values (1, false)
on conflict (id) do nothing;

alter table public.community_settings enable row level security;

-- 3) Closed-beta membership. No client-side writes are allowed.
create table if not exists public.community_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'member', 'disabled')),
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_memberships_role_idx
  on public.community_memberships(role);

alter table public.community_memberships enable row level security;

-- 4) Public-facing academic profile. Email and auth metadata are intentionally excluded.
create table if not exists public.community_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  display_name text not null default '',
  avatar_url text,
  bio text not null default '',
  affiliation text not null default '',
  research_interests text[] not null default '{}',
  profile_visibility text not null default 'community'
    check (profile_visibility in ('community', 'private')),
  searchable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_profiles_username_format
    check (username ~ '^[a-zA-Z0-9_.-]{3,30}$')
);

create unique index if not exists community_profiles_username_lower_uidx
  on public.community_profiles (lower(username));
create index if not exists community_profiles_searchable_idx
  on public.community_profiles (searchable, profile_visibility);

alter table public.community_profiles enable row level security;

-- 5) Append-only administrative audit trail.
create table if not exists public.community_admin_audit (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_user_id uuid references auth.users(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists community_admin_audit_created_idx
  on public.community_admin_audit(created_at desc);
create index if not exists community_admin_audit_target_idx
  on public.community_admin_audit(target_user_id, created_at desc);

alter table public.community_admin_audit enable row level security;

-- 6) Small security-definer helpers. Fixed search_path and no dynamic SQL.
create or replace function public.community_is_enabled()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select is_enabled from public.community_settings where id = 1), false);
$$;

create or replace function public.community_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.community_memberships m
    where m.user_id = auth.uid()
      and m.role = 'admin'
  );
$$;

create or replace function public.community_is_member()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.community_is_enabled()
    and exists (
      select 1
      from public.community_memberships m
      where m.user_id = auth.uid()
        and m.role in ('admin', 'member')
    );
$$;

revoke all on function public.community_is_enabled() from public, anon;
revoke all on function public.community_is_admin() from public, anon;
revoke all on function public.community_is_member() from public, anon;
grant execute on function public.community_is_enabled() to authenticated;
grant execute on function public.community_is_admin() to authenticated;
grant execute on function public.community_is_member() to authenticated;

-- 7) Admin operation: grant, change or revoke beta access with audit logging.
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
  if auth.uid() is null or not public.community_is_admin() then
    raise exception 'admin_only' using errcode = '42501';
  end if;

  if p_user_id is null or p_role not in ('admin', 'member', 'disabled') then
    raise exception 'invalid_membership_request' using errcode = '22023';
  end if;

  select role into v_previous_role
  from public.community_memberships
  where user_id = p_user_id
  for update;

  if v_previous_role = 'admin' and p_role <> 'admin' then
    if (select count(*) from public.community_memberships where role = 'admin') <= 1 then
      raise exception 'cannot_remove_last_admin' using errcode = '23514';
    end if;
  end if;

  insert into public.community_memberships (user_id, role, granted_by)
  values (p_user_id, p_role, auth.uid())
  on conflict (user_id) do update
    set role = excluded.role,
        granted_by = auth.uid(),
        updated_at = now();

  insert into public.community_admin_audit (actor_id, action, target_user_id, details)
  values (
    auth.uid(),
    'membership_role_changed',
    p_user_id,
    jsonb_build_object('previous_role', v_previous_role, 'new_role', p_role)
  );
end;
$$;

-- 8) Admin operation: global on/off switch. Turning it off preserves every row.
create or replace function public.community_admin_set_enabled(p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_previous boolean;
begin
  if auth.uid() is null or not public.community_is_admin() then
    raise exception 'admin_only' using errcode = '42501';
  end if;

  select is_enabled into v_previous
  from public.community_settings
  where id = 1
  for update;

  update public.community_settings
  set is_enabled = p_enabled,
      updated_at = now(),
      updated_by = auth.uid()
  where id = 1;

  insert into public.community_admin_audit (actor_id, action, details)
  values (
    auth.uid(),
    'community_feature_switch_changed',
    jsonb_build_object('previous_enabled', v_previous, 'new_enabled', p_enabled)
  );
end;
$$;

revoke all on function public.community_admin_set_member(uuid, text) from public, anon;
revoke all on function public.community_admin_set_enabled(boolean) from public, anon;
grant execute on function public.community_admin_set_member(uuid, text) to authenticated;
grant execute on function public.community_admin_set_enabled(boolean) to authenticated;

-- 9) RLS policies. Membership and settings are read-only from clients.
drop policy if exists community_settings_read_member on public.community_settings;
create policy community_settings_read_member
  on public.community_settings for select to authenticated
  using (public.community_is_member() or public.community_is_admin());

drop policy if exists community_memberships_read_self_or_admin on public.community_memberships;
create policy community_memberships_read_self_or_admin
  on public.community_memberships for select to authenticated
  using (user_id = auth.uid() or public.community_is_admin());

drop policy if exists community_profiles_read_members on public.community_profiles;
create policy community_profiles_read_members
  on public.community_profiles for select to authenticated
  using (
    public.community_is_member()
    and (
      user_id = auth.uid()
      or (profile_visibility = 'community' and searchable = true)
      or public.community_is_admin()
    )
  );

drop policy if exists community_profiles_insert_self on public.community_profiles;
create policy community_profiles_insert_self
  on public.community_profiles for insert to authenticated
  with check (user_id = auth.uid() and public.community_is_member());

drop policy if exists community_profiles_update_self on public.community_profiles;
create policy community_profiles_update_self
  on public.community_profiles for update to authenticated
  using (user_id = auth.uid() and public.community_is_member())
  with check (user_id = auth.uid() and public.community_is_member());

drop policy if exists community_profiles_delete_self on public.community_profiles;
create policy community_profiles_delete_self
  on public.community_profiles for delete to authenticated
  using (user_id = auth.uid());

drop policy if exists community_admin_audit_read_admin on public.community_admin_audit;
create policy community_admin_audit_read_admin
  on public.community_admin_audit for select to authenticated
  using (public.community_is_admin());

-- No direct INSERT/UPDATE/DELETE policies for memberships, settings or audit.
-- Admin changes must go through the audited RPC functions above.

commit;
