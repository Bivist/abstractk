begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community-message-images', 'community-message-images', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png','image/webp'];

alter table public.community_messages
  drop constraint if exists community_messages_attachment_type_check;
alter table public.community_messages
  add constraint community_messages_attachment_type_check
  check (attachment_type is null or attachment_type in ('paper','note_snapshot','collection','citation','research_summary','image'));

drop policy if exists community_message_images_member_read on storage.objects;
create policy community_message_images_member_read
on storage.objects for select to authenticated
using (
  bucket_id = 'community-message-images'
  and exists (
    select 1 from public.community_conversation_members cm
    where cm.conversation_id = ((storage.foldername(name))[1])::uuid
      and cm.user_id = (select auth.uid())
  )
);

drop policy if exists community_message_images_member_upload on storage.objects;
create policy community_message_images_member_upload
on storage.objects for insert to authenticated
with check (
  bucket_id = 'community-message-images'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and exists (
    select 1 from public.community_conversation_members cm
    where cm.conversation_id = ((storage.foldername(name))[1])::uuid
      and cm.user_id = (select auth.uid())
  )
  and storage.extension(name) in ('jpg','jpeg','png','webp')
);

drop policy if exists community_message_images_owner_delete on storage.objects;
create policy community_message_images_owner_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'community-message-images'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and exists (
    select 1 from public.community_conversation_members cm
    where cm.conversation_id = ((storage.foldername(name))[1])::uuid
      and cm.user_id = (select auth.uid())
  )
);

commit;