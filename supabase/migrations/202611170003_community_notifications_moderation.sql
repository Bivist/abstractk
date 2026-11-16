-- Notifications and admin moderation workflow for the private community.
begin;

create or replace function public.community_notify_post_interaction()
returns trigger
language plpgsql security definer
set search_path=public,pg_temp
as $community$
declare v_owner uuid;
begin
  if tg_table_name='community_post_likes' then
    select author_id into v_owner from public.community_posts where id=new.post_id;
    if v_owner is not null and v_owner<>new.user_id then
      insert into public.community_notifications(user_id,actor_id,kind,entity_id)
      values(v_owner,new.user_id,'like',new.post_id);
    end if;
  elsif tg_table_name='community_comments' then
    select author_id into v_owner from public.community_posts where id=new.post_id;
    if v_owner is not null and v_owner<>new.author_id then
      insert into public.community_notifications(user_id,actor_id,kind,entity_id,payload)
      values(v_owner,new.author_id,'comment',new.post_id,jsonb_build_object('comment_id',new.id));
    end if;
  elsif tg_table_name='community_follows' then
    if new.followed_id<>new.follower_id then
      insert into public.community_notifications(user_id,actor_id,kind,entity_id)
      values(new.followed_id,new.follower_id,'follow',new.follower_id);
    end if;
  end if;
  return new;
end;
$community$;

drop trigger if exists community_like_notification on public.community_post_likes;
create trigger community_like_notification after insert on public.community_post_likes
for each row execute function public.community_notify_post_interaction();
drop trigger if exists community_comment_notification on public.community_comments;
create trigger community_comment_notification after insert on public.community_comments
for each row execute function public.community_notify_post_interaction();
drop trigger if exists community_follow_notification on public.community_follows;
create trigger community_follow_notification after insert on public.community_follows
for each row execute function public.community_notify_post_interaction();

create or replace function public.community_admin_review_report(p_report_id uuid,p_status text)
returns void
language plpgsql security definer
set search_path=public,pg_temp
as $community$
begin
  if auth.uid() is null or not public.community_is_admin() then
    raise exception 'admin_only' using errcode='42501';
  end if;
  if p_report_id is null or p_status not in ('reviewing','resolved','dismissed') then
    raise exception 'invalid_report_update' using errcode='22023';
  end if;
  update public.community_reports
  set status=p_status,reviewed_by=auth.uid(),reviewed_at=now()
  where id=p_report_id;
  if not found then raise exception 'report_not_found' using errcode='P0002'; end if;
  insert into public.community_admin_audit(actor_id,action,details)
  values(auth.uid(),'report_reviewed',jsonb_build_object('report_id',p_report_id,'status',p_status));
end;
$community$;

create or replace function public.community_mark_notifications_read(p_notification_ids uuid[] default null)
returns void
language plpgsql security definer
set search_path=public,pg_temp
as $community$
begin
  if auth.uid() is null or not public.community_is_member() then
    raise exception 'community_membership_required' using errcode='42501';
  end if;
  update public.community_notifications
  set read_at=coalesce(read_at,now())
  where user_id=auth.uid()
    and (p_notification_ids is null or id=any(p_notification_ids));
end;
$community$;

revoke all on function public.community_notify_post_interaction() from public,anon,authenticated;
revoke all on function public.community_admin_review_report(uuid,text) from public,anon;
revoke all on function public.community_mark_notifications_read(uuid[]) from public,anon;
grant execute on function public.community_admin_review_report(uuid,text) to authenticated;
grant execute on function public.community_mark_notifications_read(uuid[]) to authenticated;

commit;
