create policy community_post_views_no_direct_access
on public.community_post_views
for all
to authenticated
using (false)
with check (false);