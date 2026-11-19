drop policy if exists community_message_images_member_read on storage.objects;
create policy community_message_images_member_read
on storage.objects for select to authenticated
using (
  bucket_id = 'community-message-images'
  and exists (
    select 1 from public.community_conversation_members cm
    where cm.conversation_id::text = (storage.foldername(name))[1]
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
    where cm.conversation_id::text = (storage.foldername(name))[1]
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
    where cm.conversation_id::text = (storage.foldername(name))[1]
      and cm.user_id = (select auth.uid())
  )
);