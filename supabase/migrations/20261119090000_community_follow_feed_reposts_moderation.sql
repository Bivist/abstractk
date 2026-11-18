-- Curated, follow-based community feed, reposts, and audited post moderation.
begin;

alter table public.community_notifications drop constraint if exists community_notifications_kind_check;
alter table public.community_notifications add constraint community_notifications_kind_check
  check (kind in ('follow','like','comment','message','share','message_request','message_request_accepted','message_request_declined','connection_admin_created','post_removed'));

alter table public.community_posts
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_at timestamptz,
  add column if not exists moderation_status text not null default 'visible',
  add column if not exists moderated_at timestamptz,
  add column if not exists moderated_by uuid references auth.users(id) on delete set null,
  add column if not exists moderation_reason text,
  add column if not exists repost_of uuid references public.community_posts(id) on delete set null,
  add column if not exists repost_note text;

do $constraints$
begin
  if not exists (select 1 from pg_constraint where conname='community_posts_moderation_status_check' and conrelid='public.community_posts'::regclass) then
    alter table public.community_posts add constraint community_posts_moderation_status_check check (moderation_status in ('visible','removed'));
  end if;
  if not exists (select 1 from pg_constraint where conname='community_posts_repost_note_length_check' and conrelid='public.community_posts'::regclass) then
    alter table public.community_posts add constraint community_posts_repost_note_length_check check (repost_note is null or char_length(repost_note) <= 1000);
  end if;
  if not exists (select 1 from pg_constraint where conname='community_posts_repost_requires_note_check' and conrelid='public.community_posts'::regclass) then
    alter table public.community_posts add constraint community_posts_repost_requires_note_check check (repost_of is null or (repost_note is not null and char_length(trim(repost_note)) > 0));
  end if;
end
$constraints$;

create index if not exists community_posts_feed_featured_idx
  on public.community_posts(is_featured desc, created_at desc)
  where moderation_status='visible';
create index if not exists community_posts_repost_of_idx
  on public.community_posts(repost_of) where repost_of is not null;

-- A normal client cannot forge a repost or set moderation fields through INSERT.
drop policy if exists community_posts_insert on public.community_posts;
create policy community_posts_insert
on public.community_posts for insert to authenticated
with check (
  public.community_is_member()
  and author_id=(select auth.uid())
  and repost_of is null
  and is_featured=false
  and moderation_status='visible'
);

-- Feed reads are restricted at the database boundary: own posts, followed accounts,
-- and admin-curated featured posts. Admins retain moderation visibility.
drop policy if exists community_posts_read on public.community_posts;
create policy community_posts_read
on public.community_posts for select to authenticated
using (
  public.community_is_member()
  and moderation_status='visible'
  and (
    author_id=(select auth.uid())
    or is_featured=true
    or public.community_is_admin()
    or exists (
      select 1 from public.community_follows f
      where f.follower_id=(select auth.uid())
        and f.followed_id=community_posts.author_id
    )
  )
);

create or replace function public.community_repost_post(p_source_post_id uuid, p_note text)
returns uuid
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_source public.community_posts%rowtype;
  v_new_id uuid;
  v_note text := trim(coalesce(p_note,''));
begin
  if auth.uid() is null or not public.community_is_member() then
    raise exception 'community_membership_required' using errcode='42501';
  end if;
  if p_source_post_id is null or char_length(v_note)<1 or char_length(v_note)>1000 then
    raise exception 'invalid_repost' using errcode='22023';
  end if;
  select * into v_source from public.community_posts
  where id=p_source_post_id and moderation_status='visible'
  for share;
  if not found then raise exception 'post_unavailable' using errcode='42501'; end if;
  if v_source.author_id<>auth.uid()
     and not public.community_is_admin()
     and not v_source.is_featured
     and not exists(select 1 from public.community_follows f where f.follower_id=auth.uid() and f.followed_id=v_source.author_id) then
    raise exception 'post_not_in_following_feed' using errcode='42501';
  end if;
  if exists(select 1 from public.community_blocks b
    where (b.blocker_id=auth.uid() and b.blocked_id=v_source.author_id)
       or (b.blocker_id=v_source.author_id and b.blocked_id=auth.uid())) then
    raise exception 'post_unavailable' using errcode='42501';
  end if;
  insert into public.community_posts(author_id,body,paper,repost_of,repost_note)
  values(auth.uid(),' ',null,p_source_post_id,v_note)
  returning id into v_new_id;
  return v_new_id;
end;
$function$;

create or replace function public.community_admin_set_post_featured(p_post_id uuid,p_featured boolean)
returns void
language plpgsql
security definer
set search_path=''
as $function$
declare v_author uuid;
begin
  if auth.uid() is null or not public.community_is_admin() then
    raise exception 'admin_required' using errcode='42501';
  end if;
  select author_id into v_author from public.community_posts where id=p_post_id and moderation_status='visible' for update;
  if not found then raise exception 'post_not_found' using errcode='P0002'; end if;
  update public.community_posts
    set is_featured=p_featured, featured_at=case when p_featured then now() else null end
    where id=p_post_id;
  insert into public.community_admin_audit(actor_id,action,target_user_id,details)
  values(auth.uid(),case when p_featured then 'post_featured' else 'post_unfeatured' end,v_author,
         jsonb_build_object('post_id',p_post_id));
end;
$function$;

create or replace function public.community_admin_remove_post(p_post_id uuid,p_reason text)
returns void
language plpgsql
security definer
set search_path=''
as $function$
declare v_author uuid; v_reason text:=trim(coalesce(p_reason,''));
begin
  if auth.uid() is null or not public.community_is_admin() then
    raise exception 'admin_required' using errcode='42501';
  end if;
  if char_length(v_reason)<5 or char_length(v_reason)>500 then
    raise exception 'moderation_reason_required' using errcode='22023';
  end if;
  select author_id into v_author from public.community_posts where id=p_post_id and moderation_status='visible' for update;
  if not found then raise exception 'post_not_found' using errcode='P0002'; end if;
  update public.community_posts set moderation_status='removed',moderated_at=now(),moderated_by=auth.uid(),moderation_reason=v_reason,is_featured=false where id=p_post_id;
  insert into public.community_admin_audit(actor_id,action,target_user_id,details)
  values(auth.uid(),'post_removed',v_author,jsonb_build_object('post_id',p_post_id,'reason',v_reason));
  insert into public.community_notifications(user_id,actor_id,kind,entity_id,payload)
  values(v_author,auth.uid(),'post_removed',p_post_id,jsonb_build_object('reason',v_reason));
end;
$function$;

revoke all on function public.community_repost_post(uuid,text) from public,anon,authenticated;
grant execute on function public.community_repost_post(uuid,text) to authenticated;
revoke all on function public.community_admin_set_post_featured(uuid,boolean) from public,anon,authenticated;
grant execute on function public.community_admin_set_post_featured(uuid,boolean) to authenticated;
revoke all on function public.community_admin_remove_post(uuid,text) from public,anon,authenticated;
grant execute on function public.community_admin_remove_post(uuid,text) to authenticated;

commit;
