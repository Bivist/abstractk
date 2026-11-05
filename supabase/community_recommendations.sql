-- Abstract: ilgi alanı tabanlı topluluk önerileri geçişi
-- Supabase SQL Editor'de bir kez çalıştırın. Aynı makaleyi beğenme zorunluluğunu kaldırır.

alter table public.community_interest_profiles
  add column if not exists interest_terms text[] not null default '{}';

create or replace function public.get_community_recommendations()
returns table (paper_id text, relevance bigint)
language sql
security definer
set search_path = public
as $$
  with mine as (
    select liked_paper_ids, viewed_paper_ids, interest_terms
    from public.community_interest_profiles
    where user_id = auth.uid()
  ),
  similar_users as (
    select other.user_id, other.liked_paper_ids,
      (
        select count(*)::bigint
        from unnest(other.interest_terms) term
        where term = any(mine.interest_terms)
      ) as overlap
    from public.community_interest_profiles other
    cross join mine
    where other.user_id <> auth.uid()
      and other.interest_terms && mine.interest_terms
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
