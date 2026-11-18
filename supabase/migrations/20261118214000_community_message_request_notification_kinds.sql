-- Extend the existing notification event constraint for the message request flow.
-- Existing notification kinds remain valid.
begin;
alter table public.community_notifications
  drop constraint if exists community_notifications_kind_check;

alter table public.community_notifications
  add constraint community_notifications_kind_check
  check (kind = any (array[
    'follow'::text,
    'like'::text,
    'comment'::text,
    'message'::text,
    'share'::text,
    'message_request'::text,
    'message_request_accepted'::text,
    'message_request_declined'::text,
    'connection_admin_created'::text
  ]));
commit;