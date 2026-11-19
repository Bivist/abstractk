-- Private account follow requests. The request is accepted only by the profile owner.
begin;
create table if not exists public.community_follow_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  constraint community_follow_requests_not_self check (requester_id <> target_id)
);
create unique index if not exists community_follow_requests_one_pending_idx on public.community_follow_requests(requester_id,target_id) where status='pending';
create index if not exists community_follow_requests_inbox_idx on public.community_follow_requests(target_id,created_at desc) where status='pending';
alter table public.community_follow_requests enable row level security;
revoke all on table public.community_follow_requests from anon, public;
grant select on table public.community_follow_requests to authenticated;
drop policy if exists community_follow_requests_participant_read on public.community_follow_requests;
create policy community_follow_requests_participant_read on public.community_follow_requests for select to authenticated using ((select auth.uid())=requester_id or (select auth.uid())=target_id);
alter table public.community_notifications drop constraint if exists community_notifications_kind_check;
alter table public.community_notifications add constraint community_notifications_kind_check check (kind in ('follow','follow_request','follow_request_accepted','like','comment','message','share','message_request','message_request_accepted','message_request_declined','connection_admin_created','post_removed'));
create or replace function public.community_request_follow(p_target_id uuid) returns text language plpgsql security definer set search_path='' as $function$
declare v_visibility text;
begin
  if auth.uid() is null or not public.community_is_member() then raise exception 'community_membership_required' using errcode='42501'; end if;
  if p_target_id is null or p_target_id=auth.uid() then raise exception 'cannot_follow_self' using errcode='22023'; end if;
  if exists(select 1 from public.community_blocks b where (b.blocker_id=auth.uid() and b.blocked_id=p_target_id) or (b.blocker_id=p_target_id and b.blocked_id=auth.uid())) then raise exception 'follow_blocked' using errcode='42501'; end if;
  select p.profile_visibility into v_visibility from public.community_profiles p join public.community_memberships m on m.user_id=p.user_id where p.user_id=p_target_id and m.role in ('admin','member');
  if not found then raise exception 'follow_target_unavailable' using errcode='42501'; end if;
  if v_visibility='community' then
    insert into public.community_follows(follower_id,followed_id) values(auth.uid(),p_target_id) on conflict(follower_id,followed_id) do nothing;
    return 'followed';
  end if;
  insert into public.community_follow_requests(requester_id,target_id) values(auth.uid(),p_target_id) on conflict do nothing;
  if exists(select 1 from public.community_follows where follower_id=auth.uid() and followed_id=p_target_id) then return 'followed'; end if;
  insert into public.community_notifications(user_id,actor_id,kind,payload) values(p_target_id,auth.uid(),'follow_request','{}'::jsonb);
  return 'requested';
end;
$function$;
create or replace function public.community_respond_follow_request(p_request_id uuid,p_accept boolean) returns boolean language plpgsql security definer set search_path='' as $function$
declare v_request public.community_follow_requests%rowtype;
begin
  if auth.uid() is null or not public.community_is_member() then raise exception 'community_membership_required' using errcode='42501'; end if;
  select * into v_request from public.community_follow_requests where id=p_request_id and target_id=auth.uid() and status='pending' for update;
  if not found then raise exception 'follow_request_unavailable' using errcode='P0002'; end if;
  update public.community_follow_requests set status=case when p_accept then 'accepted' else 'declined' end,decided_at=now() where id=p_request_id;
  if p_accept then
    insert into public.community_follows(follower_id,followed_id) values(v_request.requester_id,auth.uid()) on conflict(follower_id,followed_id) do nothing;
    insert into public.community_notifications(user_id,actor_id,kind,payload) values(v_request.requester_id,auth.uid(),'follow_request_accepted','{}'::jsonb);
  end if;
  return p_accept;
end;
$function$;
revoke all on function public.community_request_follow(uuid) from public,anon,authenticated;
grant execute on function public.community_request_follow(uuid) to authenticated;
revoke all on function public.community_respond_follow_request(uuid,boolean) from public,anon,authenticated;
grant execute on function public.community_respond_follow_request(uuid,boolean) to authenticated;
commit;