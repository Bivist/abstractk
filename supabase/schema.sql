-- Abstract: bulut senkronu tablosu.
-- Supabase paneli > SQL Editor'e yapıştırıp bir kez çalıştır.

create table if not exists public.user_data (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  liked      jsonb not null default '[]'::jsonb,
  folders    jsonb not null default '{}'::jsonb,
  history    jsonb not null default '[]'::jsonb,
  streak     jsonb not null default '{}'::jsonb,
  settings   jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

-- Her kullanıcı yalnızca kendi satırını görebilir / yazabilir.
drop policy if exists "user_data_select_own" on public.user_data;
create policy "user_data_select_own" on public.user_data
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "user_data_insert_own" on public.user_data;
create policy "user_data_insert_own" on public.user_data
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "user_data_update_own" on public.user_data;
create policy "user_data_update_own" on public.user_data
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_data_delete_own" on public.user_data;
create policy "user_data_delete_own" on public.user_data
  for delete to authenticated using (auth.uid() = user_id);


-- Profil fotoğrafları: herkese açık okuma, yalnızca kullanıcı kendi klasörüne yazabilir.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 8388608,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "avatar_public_read" on storage.objects;
create policy "avatar_public_read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "avatar_insert_own_folder" on storage.objects;
create policy "avatar_insert_own_folder" on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatar_update_own_folder" on storage.objects;
create policy "avatar_update_own_folder" on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatar_delete_own_folder" on storage.objects;
create policy "avatar_delete_own_folder" on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);


-- Topluluk önerileri: yalnızca kullanıcı açıkça katılmayı seçerse makale kimlikleri tutulur.
-- Diğer kullanıcıların profilleri istemci tarafından doğrudan okunamaz.
create table if not exists public.community_interest_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  liked_paper_ids text[] not null default '{}',
  viewed_paper_ids text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.community_interest_profiles enable row level security;

drop policy if exists "community_profile_select_own" on public.community_interest_profiles;
create policy "community_profile_select_own" on public.community_interest_profiles
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "community_profile_insert_own" on public.community_interest_profiles;
create policy "community_profile_insert_own" on public.community_interest_profiles
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "community_profile_update_own" on public.community_interest_profiles;
create policy "community_profile_update_own" on public.community_interest_profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "community_profile_delete_own" on public.community_interest_profiles;
create policy "community_profile_delete_own" on public.community_interest_profiles
  for delete to authenticated using (auth.uid() = user_id);

-- Benzer kullanıcıların beğendiği makaleleri yalnızca toplulaştırılmış kimlikler olarak döndürür.
-- Kullanıcı kimliği, profil veya tekil etkileşim bilgisi RPC sonucuna dahil edilmez.
create or replace function public.get_community_recommendations()
returns table (paper_id text, relevance bigint)
language sql
security definer
set search_path = public
as $$
  with mine as (
    select liked_paper_ids, viewed_paper_ids
    from public.community_interest_profiles
    where user_id = auth.uid()
  ),
  similar_users as (
    select other.user_id, other.liked_paper_ids,
      (
        select count(*)::bigint
        from unnest(other.liked_paper_ids || other.viewed_paper_ids) other_id
        where other_id = any(mine.liked_paper_ids || mine.viewed_paper_ids)
      ) as overlap
    from public.community_interest_profiles other
    cross join mine
    where other.user_id <> auth.uid()
      and (
        other.liked_paper_ids && (mine.liked_paper_ids || mine.viewed_paper_ids)
        or other.viewed_paper_ids && (mine.liked_paper_ids || mine.viewed_paper_ids)
      )
  ),
  candidates as (
    select unnest(s.liked_paper_ids) as candidate_id, s.overlap
    from similar_users s
    where s.overlap > 0
  )
  select c.candidate_id as paper_id, sum(c.overlap)::bigint as relevance
  from candidates c
  cross join mine
  where not (c.candidate_id = any(mine.liked_paper_ids || mine.viewed_paper_ids))
  group by c.candidate_id
  order by relevance desc
  limit 100;
$$;

revoke all on function public.get_community_recommendations() from public;
grant execute on function public.get_community_recommendations() to authenticated;
