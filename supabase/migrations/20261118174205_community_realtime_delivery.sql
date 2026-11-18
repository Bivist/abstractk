-- Enable live delivery for community direct messages and notifications.
-- RLS remains the access boundary: messages are readable only by conversation members,
-- notifications only by their intended recipient, and only authenticated members qualify.
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages, public.community_notifications;
