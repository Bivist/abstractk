import { supabase } from '../lib/supabase';
import { Paper, ReadingHistoryItem } from '../types';

/**
 * Kullanıcı açıkça izin verdiyse yalnızca makale kimliklerini topluluk profiline yazar.
 * Profil tablosu RLS ile kullanıcıya özel; diğer kullanıcıların kayıtları doğrudan okunamaz.
 */
function buildInterestTerms(liked: Paper[], history: ReadingHistoryItem[]): string[] {
  const terms = new Set<string>();
  const add = (prefix: string, value?: string) => {
    const normalized = String(value || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').replace(/[^a-z0-9]+/g, ' ').trim();
    if (normalized.length >= 3) terms.add(`${prefix}:${normalized}`);
  };
  liked.forEach(paper => {
    add('field', paper.field); add('sub', paper.sub);
    (paper.kw || []).forEach(value => add('keyword', value));
    (paper.tp || []).forEach(value => add('topic', value));
  });
  history.forEach(item => {
    add('field', item.field); add('sub', item.sub);
    (item.kw || []).forEach(value => add('keyword', value));
    String(item.title || '').split(/[^\p{L}\p{N}]+/u).filter(value => value.length >= 5).slice(0, 12).forEach(value => add('title', value));
  });
  return Array.from(terms).slice(0, 300);
}

export async function syncCommunityProfile(
  liked: Paper[],
  history: ReadingHistoryItem[],
  enabled: boolean
): Promise<void> {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  if (!enabled) {
    const { error } = await supabase.from('community_interest_profiles').delete().eq('user_id', user.id);
    if (error) throw error;
    return;
  }

  const likedIds = Array.from(new Set(liked.map(p => p.id).filter(Boolean))).slice(0, 500);
  const viewedIds = Array.from(new Set(history.map(p => p.paperId).filter(Boolean))).slice(0, 500);
  const { error } = await supabase.from('community_interest_profiles').upsert({
    user_id: user.id,
    liked_paper_ids: likedIds,
    viewed_paper_ids: viewedIds,
    interest_terms: buildInterestTerms(liked, history),
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' });
  if (error) throw error;
}

/** Benzer ilgi profillerinden gelen makale kimliklerini döndürür. Eşleşme aynı makaleye değil, konu/alan terimlerine dayanır. */
export async function getCommunityRecommendationIds(): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('get_community_recommendations');
  if (error) throw error;
  return (Array.isArray(data) ? data : [])
    .map((row: { paper_id?: unknown }) => row?.paper_id)
    .filter((id: unknown): id is string => typeof id === 'string');
}
