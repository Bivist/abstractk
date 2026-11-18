-- Instagram-style message requests and approved member connections.
-- Existing conversations remain intact; only creation of new direct chats is gated.
-- Admins may message any eligible member and may establish a connection between two members.

begin;

create table if not exists public.community_connections (
  user_low uuid not null references auth.users(id) on delete cascade,
  user_high uuid not null references auth.users(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint community_connections_pkey primary key (user_low, user_high),
  constraint community_connections_ordered check (user_low < user_high)
);

alter table public.community_connections enable row level security;
revoke all on public.community_connections from public, anon, authenticated;
grant select on public.community_connections to authenticated;

drop policy if exists community_connections_read_participants on public.community_connections;
create policy community_connections_read_participants
on public.community_connections
for select to authenticated
using (
  public.community_is_member()
  and (
    user_low = (select auth.uid())
    or user_high = (select auth.uid())
    or public.community_is_admin()
  )
);

create table if not exists public.community_message_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null default '',
  attachment_type text,
  attachment jsonb,
  status text not null default 'pending',
  conversation_id uuid references public.community_conversations(id) on delete set null,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  constraint community_message_requests_not_self check (sender_id <> recipient_id),
  constraint community_message_requests_status check (status in ('pending','accepted','declined')),
  constraint community_message_requests_body_length check (char_length(body) <= 5000),
  constraint community_message_requests_attachment_type check (
    attachment_type is null or attachment_type in ('paper','note_snapshot','collection','citation','research_summary')
  ),
  constraint community_message_requests_attachment_object check (
    attachment is null or jsonb_typeof(attachment) = 'object'
  ),
  constraint community_message_requests_content check (
    length(trim(body)) > 0 or attachment is not null
  ),
  constraint community_message_requests_attachment_size check (
    attachment is null or pg_column_size(attachment) <= 32768
  )
);

create unique index if not exists community_message_requests_one_pending_pair
on public.community_message_requests(sender_id, recipient_id)
where status = 'pending';

create index if not exists community_message_requests_recipient_pending
on public.community_message_requests(recipient_id, created_at desc)
where status = 'pending';

alter table public.community_message_requests enable row level security;
revoke all on public.community_message_requests from public, anon, authenticated;
grant select on public.community_message_requests to authenticated;

drop policy if exists community_message_requests_read_participants on public.community_message_requests;
create policy community_message_requests_read_participants
on public.community_message_requests
for select to authenticated
using (
  public.community_is_member()
  and ((sender_id = (select auth.uid())) or (recipient_id = (select auth.uid())))
);

create or replace function public.community_can_message(p_other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select
    public.community_is_member()
    and p_other is not null
    and p_other <> auth.uid()
    and exists (
      select 1 from public.community_memberships m
      where m.user_id = p_other and m.role in ('admin','member')
    )
    and not exists (
      select 1 from public.community_blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p_other)
         or (b.blocker_id = p_other and b.blocked_id = auth.uid())
    )
    and (
      public.community_is_admin()
      or exists (
        select 1
        from public.community_connections c
        where c.user_low = least(auth.uid(), p_other)
          and c.user_high = greatest(auth.uid(), p_other)
      )
    );
$function$;

create or replace function public.community_create_conversation(
  p_user_ids uuid[],
  p_kind text default 'direct',
  p_title text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_id uuid;
  v_count integer;
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
  if v_count <> cardinality(p_user_ids) then
    raise exception 'duplicate_participants' using errcode='22023';
  end if;
  if p_kind='direct' and cardinality(p_user_ids) <> 1 then
    raise exception 'direct_requires_one_recipient' using errcode='22023';
  end if;
  if exists (
    select 1 from unnest(p_user_ids) x
    where not public.community_can_message(x)
  ) then
    raise exception 'message_request_required' using errcode='42501';
  end if;

  insert into public.community_conversations(kind,title,created_by)
  values (p_kind, nullif(left(trim(coalesce(p_title,'')),80),''), auth.uid())
  returning id into v_id;

  insert into public.community_conversation_members(conversation_id,user_id)
  values (v_id,auth.uid());

  insert into public.community_conversation_members(conversation_id,user_id)
  select v_id,x from unnest(p_user_ids) x;

  return v_id;
end;
$function$;

create or replace function public.community_create_message_request(
  p_recipient uuid,
  p_body text default '',
  p_attachment_type text default null,
  p_attachment jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_id uuid;
begin
  if auth.uid() is null or not public.community_is_member() then
    raise exception 'community_membership_required' using errcode='42501';
  end if;
  if public.community_is_admin() then
    raise exception 'admin_can_message_directly' using errcode='22023';
  end if;
  if p_recipient is null or p_recipient = auth.uid() then
    raise exception 'invalid_recipient' using errcode='22023';
  end if;
  if not exists (
    select 1 from public.community_memberships m
    join public.community_profiles p on p.user_id=m.user_id
    where m.user_id=p_recipient
      and m.role in ('admin','member')
      and p.profile_visibility='community'
      and p.searchable=true
  ) then
    raise exception 'recipient_unavailable' using errcode='42501';
  end if;
  if exists (
    select 1 from public.community_blocks b
    where (b.blocker_id=auth.uid() and b.blocked_id=p_recipient)
       or (b.blocker_id=p_recipient and b.blocked_id=auth.uid())
  ) then
    raise exception 'messaging_blocked' using errcode='42501';
  end if;
  if public.community_can_message(p_recipient) then
    raise exception 'connection_already_approved' using errcode='22023';
  end if;
  if char_length(coalesce(p_body,'')) > 5000
     or (length(trim(coalesce(p_body,'')))=0 and p_attachment is null) then
    raise exception 'invalid_message' using errcode='22023';
  end if;
  if p_attachment_type is not null
     and p_attachment_type not in ('paper','note_snapshot','collection','citation','research_summary') then
    raise exception 'invalid_attachment_type' using errcode='22023';
  end if;
  if p_attachment is not null
     and (jsonb_typeof(p_attachment)<>'object' or pg_column_size(p_attachment)>32768) then
    raise exception 'invalid_attachment' using errcode='22023';
  end if;
  if (
    select count(*) from public.community_message_requests r
    where r.sender_id=auth.uid() and r.status='pending'
  ) >= 20 then
    raise exception 'too_many_pending_requests' using errcode='54000';
  end if;

  insert into public.community_message_requests(sender_id,recipient_id,body,attachment_type,attachment)
  values(auth.uid(),p_recipient,trim(coalesce(p_body,'')),p_attachment_type,p_attachment)
  returning id into v_id;

  insert into public.community_notifications(user_id,actor_id,kind,entity_id,payload)
  values(p_recipient,auth.uid(),'message_request',v_id,jsonb_build_object('request_id',v_id));

  return v_id;
exception
  when unique_violation then
    raise exception 'message_request_already_pending' using errcode='23505';
end;
$function$;

create or replace function public.community_respond_message_request(
  p_request_id uuid,
  p_accept boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_request public.community_message_requests%rowtype;
  v_conversation uuid;
  v_message uuid;
begin
  if auth.uid() is null or not public.community_is_member() then
    raise exception 'community_membership_required' using errcode='42501';
  end if;

  select * into v_request
  from public.community_message_requests
  where id=p_request_id
  for update;

  if not found or v_request.recipient_id <> auth.uid() then
    raise exception 'message_request_not_found' using errcode='42501';
  end if;
  if v_request.status <> 'pending' then
    raise exception 'message_request_already_decided' using errcode='22023';
  end if;

  if not p_accept then
    update public.community_message_requests
    set status='declined', decided_at=now()
    where id=p_request_id;

    insert into public.community_notifications(user_id,actor_id,kind,entity_id,payload)
    values(v_request.sender_id,auth.uid(),'message_request_declined',p_request_id,'{}'::jsonb);

    return null;
  end if;

  if not exists (
    select 1 from public.community_memberships m
    where m.user_id=v_request.sender_id and m.role in ('admin','member')
  ) then
    raise exception 'sender_unavailable' using errcode='42501';
  end if;
  if exists (
    select 1 from public.community_blocks b
    where (b.blocker_id=auth.uid() and b.blocked_id=v_request.sender_id)
       or (b.blocker_id=v_request.sender_id and b.blocked_id=auth.uid())
  ) then
    raise exception 'messaging_blocked' using errcode='42501';
  end if;

  insert into public.community_connections(user_low,user_high,created_by)
  values(least(auth.uid(),v_request.sender_id),greatest(auth.uid(),v_request.sender_id),auth.uid())
  on conflict (user_low,user_high) do nothing;

  insert into public.community_conversations(kind,title,created_by)
  values('direct',null,v_request.sender_id)
  returning id into v_conversation;

  insert into public.community_conversation_members(conversation_id,user_id)
  values(v_conversation,v_request.sender_id),(v_conversation,auth.uid());

  insert into public.community_messages(conversation_id,sender_id,body,attachment_type,attachment)
  values(v_conversation,v_request.sender_id,v_request.body,v_request.attachment_type,v_request.attachment)
  returning id into v_message;

  update public.community_conversations set updated_at=now() where id=v_conversation;

  update public.community_message_requests
  set status='accepted', decided_at=now(), conversation_id=v_conversation
  where id=p_request_id;

  insert into public.community_notifications(user_id,actor_id,kind,entity_id,payload)
  values(v_request.sender_id,auth.uid(),'message_request_accepted',p_request_id,
         jsonb_build_object('conversation_id',v_conversation));

  insert into public.community_notifications(user_id,actor_id,kind,entity_id,payload)
  values(auth.uid(),v_request.sender_id,'message',v_message,'{}'::jsonb);

  return v_conversation;
end;
$function$;

create or replace function public.community_admin_connect_users(
  p_user_a uuid,
  p_user_b uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null or not public.community_is_admin() then
    raise exception 'admin_required' using errcode='42501';
  end if;
  if p_user_a is null or p_user_b is null or p_user_a=p_user_b then
    raise exception 'invalid_connection_pair' using errcode='22023';
  end if;
  if not exists (
    select 1 from public.community_memberships m
    where m.user_id=p_user_a and m.role in ('admin','member')
  ) or not exists (
    select 1 from public.community_memberships m
    where m.user_id=p_user_b and m.role in ('admin','member')
  ) then
    raise exception 'connection_user_unavailable' using errcode='42501';
  end if;
  if exists (
    select 1 from public.community_blocks b
    where (b.blocker_id=p_user_a and b.blocked_id=p_user_b)
       or (b.blocker_id=p_user_b and b.blocked_id=p_user_a)
  ) then
    raise exception 'connection_blocked' using errcode='42501';
  end if;

  insert into public.community_connections(user_low,user_high,created_by)
  values(least(p_user_a,p_user_b),greatest(p_user_a,p_user_b),auth.uid())
  on conflict (user_low,user_high) do nothing;

  insert into public.community_admin_audit(actor_id,action,target_user_id,details)
  values(auth.uid(),'admin_connection_created',p_user_a,
         jsonb_build_object('other_user_id',p_user_b));

  insert into public.community_notifications(user_id,actor_id,kind,entity_id,payload)
  values
    (p_user_a,auth.uid(),'connection_admin_created',null,jsonb_build_object('other_user_id',p_user_b)),
    (p_user_b,auth.uid(),'connection_admin_created',null,jsonb_build_object('other_user_id',p_user_a));
end;
$function$;

revoke all on function public.community_can_message(uuid) from public, anon;
grant execute on function public.community_can_message(uuid) to authenticated;

revoke all on function public.community_create_conversation(uuid[],text,text) from public, anon;
grant execute on function public.community_create_conversation(uuid[],text,text) to authenticated;

revoke all on function public.community_create_message_request(uuid,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.community_create_message_request(uuid,text,text,jsonb) to authenticated;

revoke all on function public.community_respond_message_request(uuid,boolean) from public, anon, authenticated;
grant execute on function public.community_respond_message_request(uuid,boolean) to authenticated;

revoke all on function public.community_admin_connect_users(uuid,uuid) from public, anon, authenticated;
grant execute on function public.community_admin_connect_users(uuid,uuid) to authenticated;

do $publication$
begin
  if exists (select 1 from pg_publication where pubname='supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname='supabase_realtime'
         and schemaname='public'
         and tablename='community_message_requests'
     ) then
    alter publication supabase_realtime add table public.community_message_requests;
  end if;
end;
$publication$;

commit;
