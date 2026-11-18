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
  -- Existing table constraint requires a non-empty body or paper. Keep the note
  -- in body for compatibility and in repost_note for explicit semantic rendering.
  insert into public.community_posts(author_id,body,paper,repost_of,repost_note)
  values(auth.uid(),v_note,null,p_source_post_id,v_note)
  returning id into v_new_id;
  return v_new_id;
end;
$function$;

revoke all on function public.community_repost_post(uuid,text) from public,anon,authenticated;
grant execute on function public.community_repost_post(uuid,text) to authenticated;
