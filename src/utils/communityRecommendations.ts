import { supabase } from '../lib/supabase';
import { Paper, ReadingHistoryItem } from '../types';

/**
 * Kullanıcı açıkça izin verdiyse yalnızca makale kimliklerini topluluk profiline yazar.
 * Profil tablosu RLS ile kullanıcıya özel; diğer kullanıcıların kayıtları doğrudan okunamaz.
 */
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
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' });
  if (error) throw error;
}

/** Benzer ilgi profillerinden gelen yalnızca makale kimliklerini döndürür. */
export async function getCommunityRecommendationIds(): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('get_community_recommendations');
  if (error) throw error;
  return (Array.isArray(data) ? data : [])
    .map((row: { paper_id?: unknown }) => row?.paper_id)
    .filter((id: unknown): id is string => typeof id === 'string');
}
