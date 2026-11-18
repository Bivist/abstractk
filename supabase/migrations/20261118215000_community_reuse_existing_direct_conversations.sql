-- Preserve direct conversations created before message-request gating.
-- Reuse a one-to-one thread when sharing another paper with the same member.
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
      -- Preserve pre-existing direct conversations created before connection gating.
      or exists (
        select 1
        from public.community_conversations c
        where c.kind='direct'
          and exists (
            select 1 from public.community_conversation_members mine
            where mine.conversation_id=c.id and mine.user_id=auth.uid()
          )
          and exists (
            select 1 from public.community_conversation_members theirs
            where theirs.conversation_id=c.id and theirs.user_id=p_other
          )
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

  -- Reuse an existing one-to-one thread rather than creating duplicate inbox rows.
  if p_kind='direct' then
    select c.id into v_id
    from public.community_conversations c
    where c.kind='direct'
      and exists (
        select 1 from public.community_conversation_members mine
        where mine.conversation_id=c.id and mine.user_id=auth.uid()
      )
      and exists (
        select 1 from public.community_conversation_members theirs
        where theirs.conversation_id=c.id and theirs.user_id=p_user_ids[1]
      )
      and (select count(*) from public.community_conversation_members cm where cm.conversation_id=c.id)=2
    order by c.updated_at desc
    limit 1;
    if v_id is not null then
      return v_id;
    end if;
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

revoke all on function public.community_can_message(uuid) from public, anon;
grant execute on function public.community_can_message(uuid) to authenticated;

revoke all on function public.community_create_conversation(uuid[],text,text) from public, anon;
grant execute on function public.community_create_conversation(uuid[],text,text) to authenticated;
