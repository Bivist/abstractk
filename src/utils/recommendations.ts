import { Paper, ReadingHistoryItem } from '../types';

type InterestPaper = Pick<Paper, 'field' | 'sub' | 'kw' | 'tp'>;

const normalize = (value: string) =>
  String(value || '')
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const add = (profile: Map<string, number>, key: string, weight: number) => {
  if (key.length > 1) profile.set(key, (profile.get(key) || 0) + weight);
};

function learn(paper: InterestPaper, weight: number, profile: Map<string, number>) {
  add(profile, `field:${normalize(paper.field)}`, weight * 2.8);
  if (paper.sub) add(profile, `sub:${normalize(paper.sub)}`, weight * 2.1);
  (paper.kw || []).forEach(value => add(profile, `term:${normalize(value)}`, weight * 1.7));
  (paper.tp || []).forEach(value => add(profile, `topic:${normalize(value)}`, weight * 1.4));
}

function score(paper: Paper, profile: Map<string, number>, interacted: Set<string>) {
  if (interacted.has(paper.id)) return -1000;
  let value = profile.get(`field:${normalize(paper.field)}`) || 0;
  if (paper.sub) value += profile.get(`sub:${normalize(paper.sub)}`) || 0;
  for (const keyword of paper.kw || []) value += profile.get(`term:${normalize(keyword)}`) || 0;
  for (const topic of paper.tp || []) value += profile.get(`topic:${normalize(topic)}`) || 0;
  const year = Number(paper.year);
  if (Number.isFinite(year)) value += Math.max(0, 1.2 - Math.max(0, new Date().getFullYear() - year) * 0.08);
  return value;
}

/** Kişisel ilgi profili: beğeniler + makale ayrıntısı açılmış okuma geçmişi. */
export function rankPapersForUser(papers: Paper[], liked: Paper[], history: ReadingHistoryItem[]): Paper[] {
  if (!papers.length || (!liked.length && !history.length)) return papers;
  const profile = new Map<string, number>();
  const interacted = new Set<string>();
  liked.forEach(paper => {
    interacted.add(paper.id);
    learn(paper, 3.2, profile);
  });
  history.forEach(item => {
    interacted.add(item.paperId);
    learn({ field: item.field, sub: item.sub, kw: item.kw || [], tp: [] }, 1.35, profile);
  });
  return papers.map((paper, index) => ({ paper, index, score: score(paper, profile, interacted) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(item => item.paper);
}
