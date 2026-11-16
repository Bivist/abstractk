-- Abstract private academic community: posts, interactions, profiles, messaging and explicit note snapshots.
-- Additive only. All content access is restricted to enabled community members by RLS.
begin;

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null default '',
  paper jsonb,
  visibility text not null default 'community' check (visibility = 'community'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_posts_body_or_paper check (length(trim(body)) > 0 or paper is not null),
  constraint community_posts_body_length check (char_length(body) <= 5000),
  constraint community_posts_paper_object check (paper is null or jsonb_typeof(paper) = 'object')
);
create index if not exists community_posts_created_idx on public.community_posts(created_at desc, id desc);
create index if not exists community_posts_author_idx on public.community_posts(author_id, created_at desc);

create table if not exists public.community_post_likes (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(post_id, user_id)
);
create table if not exists public.community_post_bookmarks (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(post_id, user_id)
);
create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.community_comments(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists community_comments_post_idx on public.community_comments(post_id, created_at asc);
create table if not exists public.community_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(follower_id, followed_id),
  constraint community_no_self_follow check (follower_id <> followed_id)
);
create index if not exists community_follows_followed_idx on public.community_follows(followed_id);

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('post','comment','profile','message')),
  target_id uuid not null,
  reason text not null check (char_length(trim(reason)) between 3 and 1000),
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists community_reports_status_idx on public.community_reports(status, created_at desc);

create table if not exists public.community_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(blocker_id, blocked_id),
  constraint community_no_self_block check (blocker_id <> blocked_id)
);

create table if not exists public.community_conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'direct' check (kind in ('direct','group')),
  title text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.community_conversation_members (
  conversation_id uuid not null references public.community_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key(conversation_id, user_id)
);
create index if not exists community_conversation_members_user_idx on public.community_conversation_members(user_id, conversation_id);
create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.community_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null default '',
  attachment_type text check (attachment_type in ('paper','note_snapshot','collection','citation','research_summary')),
  attachment jsonb,
  created_at timestamptz not null default now(),
  constraint community_message_body_length check (char_length(body) <= 5000),
  constraint community_message_content check (length(trim(body)) > 0 or attachment is not null),
  constraint community_message_attachment_object check (attachment is null or jsonb_typeof(attachment) = 'object')
);
create index if not exists community_messages_conversation_idx on public.community_messages(conversation_id, created_at desc);

-- Shared notebook notes are immutable snapshots; source notes remain private and unchanged.
create table if not exists public.community_shared_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_note_id text not null,
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  shared_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint community_shared_note_snapshot_size check (pg_column_size(snapshot) <= 32768)
);
create index if not exists community_shared_notes_owner_idx on public.community_shared_notes(owner_id, shared_at desc);

create table if not exists public.community_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('follow','like','comment','message','share')),
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists community_notifications_user_idx on public.community_notifications(user_id, created_at desc);

-- Membership and block helpers are SECURITY DEFINER to avoid recursive RLS evaluation.
create or replace function public.community_can_message(p_other uuid)
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select public.community_is_member()
    and p_other is not null
    and exists (select 1 from public.community_memberships m where m.user_id=p_other and m.role in ('admin','member'))
    and not exists (
      select 1 from public.community_blocks b
      where (b.blocker_id=auth.uid() and b.blocked_id=p_other)
         or (b.blocker_id=p_other and b.blocked_id=auth.uid())
    );
$$;

create or replace function public.community_is_conversation_member(p_conversation_id uuid)
returns boolean
language sql stable security definer
set search_path=public,pg_temp
as $community$
  select auth.uid() is not null and exists(
    select 1 from public.community_conversation_members cm
    where cm.conversation_id=p_conversation_id and cm.user_id=auth.uid()
  );
$community$;

create or replace function public.community_revoke_shared_note(p_shared_note_id uuid)
returns void
language plpgsql security definer
set search_path=public,pg_temp
as $community$
begin
  if auth.uid() is null or not public.community_is_member() then
    raise exception 'community_membership_required' using errcode='42501';
  end if;
  update public.community_shared_notes
  set revoked_at=coalesce(revoked_at,now())
  where id=p_shared_note_id and owner_id=auth.uid();
  if not found then raise exception 'shared_note_not_found' using errcode='P0002'; end if;
end;
$community$;

create or replace function public.community_create_conversation(p_user_ids uuid[], p_kind text default 'direct', p_title text default null)
returns uuid
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare v_id uuid; v_count integer;
begin
  if auth.uid() is null or not public.community_is_member() then
    raise exception 'community_membership_required' using errcode='42501';
  end if;
  if p_user_ids is null or cardinality(p_user_ids) < 1 or cardinality(p_user_ids) > 19
     or p_kind is null or p_kind not in ('direct','group') then
    raise exception 'invalid_conversation' using errcode='22023';
  end if;
  if auth.uid() = any(p_user_ids) then
    raise exception 'do_not_include_self' using errcode='22023';
  end if;
  select count(distinct x) into v_count from unnest(p_user_ids) x;
  if v_count <> cardinality(p_user_ids) then raise exception 'duplicate_participants' using errcode='22023'; end if;
  if p_kind='direct' and cardinality(p_user_ids) <> 1 then raise exception 'direct_requires_one_recipient' using errcode='22023'; end if;
  if exists (
    select 1 from unnest(p_user_ids) x
    where not public.community_can_message(x)
  ) then raise exception 'recipient_unavailable' using errcode='42501'; end if;

  insert into public.community_conversations(kind,title,created_by)
  values (p_kind, nullif(left(trim(coalesce(p_title,'')),80),''), auth.uid())
  returning id into v_id;
  insert into public.community_conversation_members(conversation_id,user_id)
  values (v_id,auth.uid());
  insert into public.community_conversation_members(conversation_id,user_id)
  select v_id,x from unnest(p_user_ids) x;
  return v_id;
end;
$$;

create or replace function public.community_validate_comment_parent()
returns trigger
language plpgsql
set search_path=public,pg_temp
as $community$
begin
  if new.parent_id is not null and not exists(
    select 1 from public.community_comments parent
    where parent.id=new.parent_id and parent.post_id=new.post_id
  ) then
    raise exception 'comment_parent_must_belong_to_same_post' using errcode='23514';
  end if;
  return new;
end;
$community$;
drop trigger if exists community_comment_parent_guard on public.community_comments;
create trigger community_comment_parent_guard before insert or update of parent_id,post_id
on public.community_comments for each row execute function public.community_validate_comment_parent();

create or replace function public.community_send_message(
  p_conversation_id uuid, p_body text default '', p_attachment_type text default null, p_attachment jsonb default null
)
returns uuid
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare v_id uuid; v_recipient uuid;
begin
  if auth.uid() is null or not public.community_is_member() then raise exception 'community_membership_required' using errcode='42501'; end if;
  if not exists(select 1 from public.community_conversation_members cm where cm.conversation_id=p_conversation_id and cm.user_id=auth.uid()) then
    raise exception 'conversation_access_denied' using errcode='42501';
  end if;
  if exists(
    select 1 from public.community_conversation_members cm
    join public.community_blocks b on
      (b.blocker_id=auth.uid() and b.blocked_id=cm.user_id)
      or (b.blocker_id=cm.user_id and b.blocked_id=auth.uid())
    where cm.conversation_id=p_conversation_id and cm.user_id<>auth.uid()
  ) then
    raise exception 'messaging_blocked' using errcode='42501';
  end if;
  if char_length(coalesce(p_body,'')) > 5000 or
     (length(trim(coalesce(p_body,'')))=0 and p_attachment is null) then
    raise exception 'invalid_message' using errcode='22023';
  end if;
  if p_attachment_type is not null and p_attachment_type not in ('paper','note_snapshot','collection','citation','research_summary') then
    raise exception 'invalid_attachment_type' using errcode='22023';
  end if;
  if p_attachment is not null and (jsonb_typeof(p_attachment)<>'object' or pg_column_size(p_attachment)>32768) then
    raise exception 'invalid_attachment' using errcode='22023';
  end if;
  insert into public.community_messages(conversation_id,sender_id,body,attachment_type,attachment)
  values(p_conversation_id,auth.uid(),trim(coalesce(p_body,'')),p_attachment_type,p_attachment)
  returning id into v_id;
  update public.community_conversations set updated_at=now() where id=p_conversation_id;
  for v_recipient in
    select user_id from public.community_conversation_members
    where conversation_id=p_conversation_id and user_id<>auth.uid()
  loop
    insert into public.community_notifications(user_id,actor_id,kind,entity_id)
    values(v_recipient,auth.uid(),'message',v_id);
  end loop;
  return v_id;
end;
$$;

create or replace function public.community_mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql security definer
set search_path=public,pg_temp
as $community$
begin
  if auth.uid() is null or not public.community_is_member() then
    raise exception 'community_membership_required' using errcode='42501';
  end if;
  update public.community_conversation_members
  set last_read_at=now()
  where conversation_id=p_conversation_id and user_id=auth.uid();
  if not found then raise exception 'conversation_access_denied' using errcode='42501'; end if;
end;
$community$;

create or replace function public.community_share_note_snapshot(p_source_note_id text,p_snapshot jsonb)
returns uuid
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare v_id uuid;
begin
  if auth.uid() is null or not public.community_is_member() then raise exception 'community_membership_required' using errcode='42501'; end if;
  if p_source_note_id is null or length(trim(p_source_note_id)) not between 1 and 160
     or p_snapshot is null or jsonb_typeof(p_snapshot)<>'object' or pg_column_size(p_snapshot)>32768 then
    raise exception 'invalid_note_snapshot' using errcode='22023';
  end if;
  insert into public.community_shared_notes(owner_id,source_note_id,snapshot)
  values(auth.uid(),p_source_note_id,p_snapshot) returning id into v_id;
  return v_id;
end;
$$;

alter table public.community_posts enable row level security;
alter table public.community_post_likes enable row level security;
alter table public.community_post_bookmarks enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_follows enable row level security;
alter table public.community_reports enable row level security;
alter table public.community_blocks enable row level security;
alter table public.community_conversations enable row level security;
alter table public.community_conversation_members enable row level security;
alter table public.community_messages enable row level security;
alter table public.community_shared_notes enable row level security;
alter table public.community_notifications enable row level security;

-- Profiles and content are visible only to enabled members. Admin audit access remains separately protected.
create policy community_posts_read on public.community_posts for select to authenticated using (public.community_is_member());
create policy community_posts_insert on public.community_posts for insert to authenticated with check (public.community_is_member() and author_id=auth.uid());
create policy community_posts_update on public.community_posts for update to authenticated using (public.community_is_member() and author_id=auth.uid()) with check (public.community_is_member() and author_id=auth.uid());
create policy community_posts_delete on public.community_posts for delete to authenticated using (public.community_is_member() and (author_id=auth.uid() or public.community_is_admin()));

create policy community_likes_read on public.community_post_likes for select to authenticated using (public.community_is_member());
create policy community_likes_insert on public.community_post_likes for insert to authenticated with check (public.community_is_member() and user_id=auth.uid());
create policy community_likes_delete on public.community_post_likes for delete to authenticated using (public.community_is_member() and user_id=auth.uid());
create policy community_bookmarks_read on public.community_post_bookmarks for select to authenticated using (public.community_is_member() and user_id=auth.uid());
create policy community_bookmarks_insert on public.community_post_bookmarks for insert to authenticated with check (public.community_is_member() and user_id=auth.uid());
create policy community_bookmarks_delete on public.community_post_bookmarks for delete to authenticated using (public.community_is_member() and user_id=auth.uid());

create policy community_comments_read on public.community_comments for select to authenticated using (public.community_is_member());
create policy community_comments_insert on public.community_comments for insert to authenticated with check (
  public.community_is_member() and author_id=auth.uid() and exists(select 1 from public.community_posts p where p.id=post_id)
);
create policy community_comments_delete on public.community_comments for delete to authenticated using (public.community_is_member() and (author_id=auth.uid() or public.community_is_admin()));

create policy community_follows_read on public.community_follows for select to authenticated using (public.community_is_member() and (follower_id=auth.uid() or followed_id=auth.uid()));
create policy community_follows_insert on public.community_follows for insert to authenticated with check (
  public.community_is_member() and follower_id=auth.uid()
  and exists(select 1 from public.community_memberships m join public.community_profiles p on p.user_id=m.user_id where m.user_id=followed_id and m.role in ('admin','member') and p.profile_visibility='community' and p.searchable=true)
  and not exists(select 1 from public.community_blocks b where (b.blocker_id=auth.uid() and b.blocked_id=followed_id) or (b.blocker_id=followed_id and b.blocked_id=auth.uid()))
);
create policy community_follows_delete on public.community_follows for delete to authenticated using (public.community_is_member() and follower_id=auth.uid());

create policy community_reports_insert on public.community_reports for insert to authenticated with check (public.community_is_member() and reporter_id=auth.uid());
create policy community_reports_read on public.community_reports for select to authenticated using (public.community_is_admin());

create policy community_blocks_read on public.community_blocks for select to authenticated using (public.community_is_member() and blocker_id=auth.uid());
create policy community_blocks_insert on public.community_blocks for insert to authenticated with check (public.community_is_member() and blocker_id=auth.uid());
create policy community_blocks_delete on public.community_blocks for delete to authenticated using (public.community_is_member() and blocker_id=auth.uid());

create policy community_conversations_read on public.community_conversations for select to authenticated using (
  public.community_is_member() and public.community_is_conversation_member(id)
);
create policy community_conversation_members_read on public.community_conversation_members for select to authenticated using (
  public.community_is_member() and public.community_is_conversation_member(conversation_id)
);
create policy community_messages_read on public.community_messages for select to authenticated using (
  public.community_is_member() and public.community_is_conversation_member(conversation_id)
);

create policy community_shared_notes_read on public.community_shared_notes for select to authenticated using (
  public.community_is_member() and revoked_at is null
);
create policy community_shared_notes_insert on public.community_shared_notes for insert to authenticated with check (public.community_is_member() and owner_id=auth.uid());
-- Revocation is performed through a SECURITY DEFINER RPC so snapshots remain immutable.
create policy community_shared_notes_delete on public.community_shared_notes for delete to authenticated using (public.community_is_member() and owner_id=auth.uid());

create policy community_notifications_read on public.community_notifications for select to authenticated using (public.community_is_member() and user_id=auth.uid());
create policy community_notifications_update on public.community_notifications for update to authenticated using (public.community_is_member() and user_id=auth.uid()) with check (public.community_is_member() and user_id=auth.uid());

-- Explicit minimum privileges; RLS remains the actual row-level boundary.
revoke all on public.community_posts, public.community_post_likes, public.community_post_bookmarks,
  public.community_comments, public.community_follows, public.community_reports, public.community_blocks,
  public.community_conversations, public.community_conversation_members, public.community_messages,
  public.community_shared_notes, public.community_notifications from anon, authenticated;
grant select, insert, update, delete on public.community_posts, public.community_post_likes,
  public.community_post_bookmarks, public.community_comments, public.community_follows,
  public.community_reports, public.community_blocks, public.community_shared_notes to authenticated;
grant select on public.community_notifications to authenticated;
grant select on public.community_conversations, public.community_conversation_members, public.community_messages to authenticated;
-- UUID-backed community tables require no direct sequence privileges.

revoke all on function public.community_validate_comment_parent() from public, anon, authenticated;
revoke all on function public.community_is_conversation_member(uuid) from public, anon;
revoke all on function public.community_revoke_shared_note(uuid) from public, anon;
revoke all on function public.community_can_message(uuid) from public, anon;
revoke all on function public.community_create_conversation(uuid[],text,text) from public, anon;
revoke all on function public.community_send_message(uuid,text,text,jsonb) from public, anon;
revoke all on function public.community_mark_conversation_read(uuid) from public, anon;
revoke all on function public.community_share_note_snapshot(text,jsonb) from public, anon;
grant execute on function public.community_is_conversation_member(uuid) to authenticated;
grant execute on function public.community_revoke_shared_note(uuid) to authenticated;
grant execute on function public.community_can_message(uuid) to authenticated;
grant execute on function public.community_create_conversation(uuid[],text,text) to authenticated;
grant execute on function public.community_send_message(uuid,text,text,jsonb) to authenticated;
grant execute on function public.community_mark_conversation_read(uuid) to authenticated;
grant execute on function public.community_share_note_snapshot(text,jsonb) to authenticated;

commit;
