alter table public.community_profiles
  add column if not exists avatar_shape text not null default 'circle'
  check (avatar_shape in ('circle','rounded','square'));