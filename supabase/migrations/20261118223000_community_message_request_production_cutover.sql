-- Apply only when the new message-request-aware frontend is being promoted to production.
-- Until then, the legacy RPC remains compatible with the currently deployed client.
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
begin
  return public.community_create_approved_conversation(p_user_ids,p_kind,p_title);
end;
$function$;

revoke all on function public.community_create_conversation(uuid[],text,text) from public, anon, authenticated;
grant execute on function public.community_create_conversation(uuid[],text,text) to authenticated;
