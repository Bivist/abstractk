import React, { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Search, Send, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Paper } from '../types';

type Recipient = {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  affiliation?: string;
  research_interests?: string[];
};

const field = 'w-full rounded-xl border border-[var(--ln)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-sky-500';
const primary = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';

function validUrl(value: unknown): string | null {
  try {
    const url = new URL(String(value));
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch { return null; }
}

const Avatar: React.FC<{ person: Recipient }> = ({ person }) => (
  <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sky-100 text-sm font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-200">
    {(person.display_name || person.username || 'Ü').slice(0,1).toLocaleUpperCase('tr-TR')}
    {validUrl(person.avatar_url) && <img src={validUrl(person.avatar_url)!} alt="" className="absolute inset-0 h-full w-full object-cover" onError={e => e.currentTarget.remove()} />}
  </span>
);

export const CommunityPaperShareSheet: React.FC<{
  userId: string;
  paper: Paper | null;
  onClose: () => void;
  onSent: (message: string) => void;
}> = ({ userId, paper, onClose, onSent }) => {
  const [followed, setFollowed] = useState<Recipient[]>([]);
  const [results, setResults] = useState<Recipient[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!supabase) { setLoading(false); return; }
      try {
        const { data: followRows, error: followError } = await supabase
          .from('community_follows').select('followed_id').eq('follower_id', userId);
        if (followError) throw followError;
        const ids = (followRows || []).map((row: any) => row.followed_id as string);
        if (ids.length) {
          const { data, error: profileError } = await supabase
            .from('community_profiles')
            .select('user_id,username,display_name,avatar_url,affiliation,research_interests')
            .in('user_id', ids);
          if (profileError) throw profileError;
          if (active) setFollowed((data || []) as Recipient[]);
        } else if (active) setFollowed([]);
      } catch (e) {
        if (active) setError(e && typeof e === 'object' && 'message' in e ? String((e as {message:unknown}).message) : 'Takip edilen üyeler yüklenemedi.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [userId]);

  const allRecipients = useMemo(() => {
    const map = new Map<string, Recipient>();
    [...followed, ...results].forEach(person => map.set(person.user_id, person));
    return [...map.values()];
  }, [followed, results]);

  const search = async () => {
    if (!supabase || query.trim().length < 2) {
      setError('Yeni üye aramak için en az iki karakter yaz.');
      return;
    }
    setSearching(true);
    setError('');
    try {
      const { data, error: searchError } = await supabase.rpc('community_search_members', { p_query: query.trim(), p_limit: 25 });
      if (searchError) throw searchError;
      setResults((data || []) as Recipient[]);
    } catch (e) {
      setError(e && typeof e === 'object' && 'message' in e ? String((e as {message:unknown}).message) : 'Üye araması yapılamadı.');
    } finally {
      setSearching(false);
    }
  };

  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const send = async () => {
    if (!supabase || !paper || selected.size === 0) return;
    setSending(true);
    setError('');
    let directCount = 0;
    let requestCount = 0;
    const failed: string[] = [];
    const attachment = {
      id: paper.id,
      title: String(paper.title || 'Akademik makale').slice(0, 500),
      url: validUrl(paper.link),
      authors: String(paper.authors || '').slice(0, 1000),
      journal: String(paper.journal || '').slice(0, 300),
      year: paper.year,
      field: String(paper.sub || paper.field || '').slice(0, 200),
      abstract: String(paper.abs || '').slice(0, 12000)
    };

    try {
      for (const recipientId of selected) {
        const person = allRecipients.find(item => item.user_id === recipientId);
        try {
          const { data: canMessage, error: canError } = await supabase.rpc('community_can_message', { p_other: recipientId });
          if (canError) throw canError;
          if (canMessage) {
            const { data: conversationId, error: conversationError } = await supabase.rpc('community_create_approved_conversation', {
              p_user_ids: [recipientId], p_kind: 'direct', p_title: null
            });
            if (conversationError) throw conversationError;
            const { error: sendError } = await supabase.rpc('community_send_message', {
              p_conversation_id: conversationId,
              p_body: note.trim() || 'Seninle bir akademik makale paylaştı.',
              p_attachment_type: 'paper',
              p_attachment: attachment
            });
            if (sendError) throw sendError;
            directCount++;
          } else {
            const { error: requestError } = await supabase.rpc('community_create_message_request', {
              p_recipient: recipientId,
              p_body: note.trim() || 'Seninle bir akademik makale paylaştı.',
              p_attachment_type: 'paper',
              p_attachment: attachment
            });
            if (requestError) throw requestError;
            requestCount++;
          }
        } catch (e) {
          failed.push(person?.display_name || person?.username || 'Bir üye');
        }
      }
      if (failed.length) {
        setError('Şu kişilere gönderilemedi: ' + failed.join(', ') + '. Daha önce bekleyen istek veya engelleme olabilir.');
      }
      if (directCount + requestCount > 0) {
        onSent(
          directCount && requestCount
            ? `Makale ${directCount} kişiye mesaj olarak, ${requestCount} kişiye onay isteği olarak gönderildi.`
            : directCount
              ? `Makale ${directCount} kişiye gönderildi.`
              : `Makale ${requestCount} kişiye mesaj isteği olarak gönderildi.`
        );
        if (!failed.length) onClose();
        setSelected(new Set());
      }
    } finally {
      setSending(false);
    }
  };

  if (!paper) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Makaleyi mesajla gönder">
      <div className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-[var(--ln)] bg-[var(--sf)] shadow-2xl sm:rounded-3xl">
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--ln)] px-4 py-3 sm:px-5">
          <div className="min-w-0"><div className="text-base font-bold text-[var(--ink)]">Makaleyi gönder</div><div className="mt-0.5 text-xs text-[var(--mu)]">Takip ettiklerin veya yeni üyeler</div></div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-[var(--mu)] hover:bg-[var(--bg)]" aria-label="Kapat"><X size={19}/></button>
        </header>
        <div className="shrink-0 border-b border-[var(--ln)] p-3 sm:p-4">
          <div className="rounded-2xl bg-[var(--bg)] p-3">
            <div className="text-[9px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">Paylaşılacak makale</div>
            <div className="mt-1 line-clamp-2 text-sm font-semibold text-[var(--ink)]">{paper.title}</div>
            <div className="mt-1 truncate text-[11px] text-[var(--mu)]">{paper.authors || 'Yazar bilgisi yok'}{paper.journal ? ' · ' + paper.journal : ''}</div>
          </div>
          <textarea className={field + ' mt-3 resize-none'} rows={2} maxLength={1000} value={note} onChange={e => setNote(e.target.value)} placeholder="İstersen makaleyle birlikte kısa bir not yaz…" />
          <div className="mt-3 flex gap-2">
            <input className={field + ' min-w-0 flex-1'} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void search(); } }} placeholder="Yeni üye ara…" />
            <button type="button" className={primary} disabled={searching || query.trim().length < 2} onClick={() => void search()}>{searching ? <Loader2 size={16} className="animate-spin"/> : <Search size={16}/>} Ara</button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
          {error && <div role="alert" className="mb-3 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:bg-rose-950/30 dark:text-rose-200">{error}</div>}
          <div className="mb-2 flex items-center justify-between gap-2"><h3 className="text-xs font-bold uppercase tracking-wider text-[var(--mu)]">Takip ettiklerin</h3><span className="text-[10px] text-[var(--mu)]">{selected.size} seçili</span></div>
          {loading && <div className="py-6 text-center text-xs text-[var(--mu)]"><Loader2 size={16} className="mx-auto mb-2 animate-spin"/>Kişiler yükleniyor…</div>}
          {!loading && !followed.length && <p className="rounded-xl bg-[var(--bg)] p-3 text-xs text-[var(--mu)]">Henüz takip ettiğin üye yok. Yukarıdan yeni bir üye arayabilirsin.</p>}
          <div className="space-y-1">
            {followed.map(person => <button key={person.user_id} type="button" onClick={() => toggle(person.user_id)} className={'flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors ' + (selected.has(person.user_id) ? 'bg-sky-100 ring-1 ring-sky-500 dark:bg-sky-950/50' : 'hover:bg-[var(--bg)]')}>
              <Avatar person={person}/><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[var(--ink)]">{person.display_name || person.username}</span><span className="block truncate text-[10px] text-[var(--mu)]">@{person.username}</span></span>
              <span className={'inline-flex h-6 w-6 items-center justify-center rounded-full border ' + (selected.has(person.user_id) ? 'border-sky-700 bg-sky-700 text-white' : 'border-[var(--ln)] text-transparent')}><Check size={14}/></span>
            </button>)}
          </div>
          {results.length > 0 && <><h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-[var(--mu)]">Arama sonuçları</h3><div className="space-y-1">{results.filter(person => !followed.some(f => f.user_id === person.user_id)).map(person => <button key={person.user_id} type="button" onClick={() => toggle(person.user_id)} className={'flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors ' + (selected.has(person.user_id) ? 'bg-sky-100 ring-1 ring-sky-500 dark:bg-sky-950/50' : 'hover:bg-[var(--bg)]')}>
            <Avatar person={person}/><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[var(--ink)]">{person.display_name || person.username}</span><span className="block truncate text-[10px] text-[var(--mu)]">@{person.username}{person.affiliation ? ' · ' + person.affiliation : ''}</span></span>
            <span className={'inline-flex h-6 w-6 items-center justify-center rounded-full border ' + (selected.has(person.user_id) ? 'border-sky-700 bg-sky-700 text-white' : 'border-[var(--ln)] text-transparent')}><Check size={14}/></span>
          </button>)}</div></>}
        </div>
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--ln)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
          <div className="min-w-0 text-[10px] leading-4 text-[var(--mu)]">{selected.size ? `${selected.size} kişiye gönderilecek. Yeni kişilere önce mesaj isteği gider.` : 'Göndermek için en az bir kişi seç.'}</div>
          <button type="button" className={primary} disabled={sending || selected.size===0} onClick={() => void send()}>{sending ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>} Gönder</button>
        </footer>
      </div>
    </div>
  );
};
