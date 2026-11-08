import React, { useMemo, useState } from 'react';
import { BookOpen, Search, StickyNote, Quote, Lightbulb, Pencil, Trash2, ExternalLink, X, Check, NotebookPen } from 'lucide-react';
import { PaperNote } from '../types';

type NoteFilter = 'all' | PaperNote['type'];

interface NotesArchiveProps {
  notes: PaperNote[];
  onUpdateNote: (noteId: string, content: string) => void;
  onDeleteNote: (noteId: string) => void;
  onOpenPaper: (note: PaperNote) => void;
}

const noteMeta: Record<PaperNote['type'], { label: string; Icon: React.ElementType; tone: string }> = {
  note: { label: 'Kişisel not', Icon: StickyNote, tone: 'text-sky-700 bg-sky-50 dark:text-sky-300 dark:bg-sky-950/40' },
  quote: { label: 'Önemli alıntı', Icon: Quote, tone: 'text-violet-700 bg-violet-50 dark:text-violet-300 dark:bg-violet-950/40' },
  question: { label: 'Araştırma sorusu', Icon: Lightbulb, tone: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40' }
};

export const NotesArchive: React.FC<NotesArchiveProps> = ({ notes, onUpdateNote, onDeleteNote, onOpenPaper }) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<NoteFilter>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const counts = useMemo(() => ({
    all: notes.length,
    note: notes.filter(n => n.type === 'note').length,
    quote: notes.filter(n => n.type === 'quote').length,
    question: notes.filter(n => n.type === 'question').length
  }), [notes]);

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr-TR');
    return [...notes]
      .filter(note => filter === 'all' || note.type === filter)
      .filter(note => !q || [
        note.content, note.paperTitle, note.paperJournal, note.paperField, note.paperAuthors
      ].some(value => value?.toLocaleLowerCase('tr-TR').includes(q)))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, query, filter]);

  const startEdit = (note: PaperNote) => {
    setEditingId(note.id);
    setDraft(note.content);
  };

  const saveEdit = (note: PaperNote) => {
    if (!draft.trim()) return;
    onUpdateNote(note.id, draft);
    setEditingId(null);
    setDraft('');
  };

  const filters: { id: NoteFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Tümü', count: counts.all },
    { id: 'note', label: 'Notlar', count: counts.note },
    { id: 'quote', label: 'Alıntılar', count: counts.quote },
    { id: 'question', label: 'Sorular', count: counts.question }
  ];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[#f1f8fb] dark:bg-[#020f1a]">
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-8 space-y-5">
        <header className="relative overflow-hidden rounded-3xl border border-[#c5dfe9] dark:border-[#16445e] bg-gradient-to-br from-white via-[#e8f6fb] to-[#d8eff7] dark:from-[#071828] dark:via-[#092338] dark:to-[#0b3045] p-5 sm:p-7">
          <div className="absolute -right-8 -top-10 w-44 h-44 rounded-full border border-sky-300/30 dark:border-sky-400/15" />
          <div className="absolute -right-1 -top-3 w-28 h-28 rounded-full border border-sky-300/30 dark:border-sky-400/15" />
          <div className="relative flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-900/15 shrink-0">
              <NotebookPen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-sky-700 dark:text-sky-300">ABSTRACT · KİŞİSEL ARŞİV</p>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0a2540] dark:text-[#e0f4ff] mt-1">Bilim Defterim</h1>
              <p className="text-xs sm:text-sm text-[#527993] dark:text-[#8db6ca] mt-1">Makalelerden biriktirdiğin fikirler, sorular ve önemli cümleler.</p>
            </div>
          </div>
          <div className="relative grid grid-cols-3 gap-2 mt-5 max-w-md">
            <div className="rounded-xl bg-white/70 dark:bg-[#061522]/60 border border-white/70 dark:border-[#16445e] p-2.5">
              <p className="text-lg font-bold tabular-nums text-[#0a4267] dark:text-sky-300">{counts.all}</p>
              <p className="text-[10px] text-[#527993] dark:text-[#8db6ca]">Toplam kayıt</p>
            </div>
            <div className="rounded-xl bg-white/70 dark:bg-[#061522]/60 border border-white/70 dark:border-[#16445e] p-2.5">
              <p className="text-lg font-bold tabular-nums text-[#0a4267] dark:text-sky-300">{counts.quote}</p>
              <p className="text-[10px] text-[#527993] dark:text-[#8db6ca]">Alıntı</p>
            </div>
            <div className="rounded-xl bg-white/70 dark:bg-[#061522]/60 border border-white/70 dark:border-[#16445e] p-2.5">
              <p className="text-lg font-bold tabular-nums text-[#0a4267] dark:text-sky-300">{counts.question}</p>
              <p className="text-[10px] text-[#527993] dark:text-[#8db6ca]">Araştırma sorusu</p>
            </div>
          </div>
        </header>

        <div className="space-y-3">
          <label className="relative block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6d94aa] dark:text-[#78a9c2]" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Notlarda, makale başlıklarında veya alanlarda ara…"
              className="w-full h-11 pl-10 pr-10 rounded-2xl border border-[#c5dfe9] dark:border-[#16445e] bg-white dark:bg-[#071828] text-sm text-[#0a2540] dark:text-[#e0f4ff] placeholder:text-[#86a5b7] focus:outline-none focus:ring-2 focus:ring-sky-500/25" />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="Aramayı temizle" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#6d94aa]"><X className="w-4 h-4" /></button>}
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map(item => (
              <button key={item.id} type="button" onClick={() => setFilter(item.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold border transition-colors ${filter === item.id ? 'bg-sky-700 border-sky-700 text-white shadow-sm' : 'bg-white dark:bg-[#071828] border-[#c5dfe9] dark:border-[#16445e] text-[#527993] dark:text-[#9bc5d8]'}`}>
                {item.label}<span className={`text-[10px] ${filter === item.id ? 'text-sky-100' : 'opacity-70'}`}>{item.count}</span>
              </button>
            ))}
          </div>
        </div>

        {filteredNotes.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-bold text-[#527993] dark:text-[#8db6ca]">{filteredNotes.length} kayıt listeleniyor</p>
              <p className="text-[10px] text-[#7899ac] dark:text-[#648da5]">Son güncellenen önce</p>
            </div>
            {filteredNotes.map(note => {
              const meta = noteMeta[note.type];
              const Icon = meta.Icon;
              const isEditing = editingId === note.id;
              return (
                <article key={note.id} className="rounded-2xl border border-[#c5dfe9] dark:border-[#16445e] bg-white dark:bg-[#071828] p-4 sm:p-5 shadow-[0_4px_16px_rgba(7,50,75,0.04)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${meta.tone}`}><Icon className="w-3 h-3" />{meta.label}</span>
                      <time className="text-[10px] text-[#7899ac] dark:text-[#648da5]">{new Date(note.updatedAt).toLocaleDateString('tr-TR')}</time>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!isEditing && <button type="button" onClick={() => startEdit(note)} aria-label="Notu düzenle" title="Düzenle" className="p-2 rounded-lg text-[#648da5] hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-[#0c2d44] dark:hover:text-sky-300"><Pencil className="w-4 h-4" /></button>}
                      <button type="button" onClick={() => { if (window.confirm('Bu kaydı Bilim Defterim’den silmek istiyor musun?')) onDeleteNote(note.id); }} aria-label="Notu sil" title="Sil" className="p-2 rounded-lg text-[#648da5] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <button type="button" onClick={() => onOpenPaper(note)} className="group mt-3 text-left w-full min-w-0">
                    <span className="block text-sm font-bold leading-snug text-[#0a2540] dark:text-[#e0f4ff] group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">{note.paperTitle || 'Başlığı kaydedilmemiş makale'}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 text-[10px] text-[#6c91a8] dark:text-[#78a9c2]">
                      {note.paperJournal && <span>{note.paperJournal}</span>}
                      {note.paperField && <><span>·</span><span>{note.paperField}</span></>}
                      <span className="inline-flex items-center gap-1 ml-auto">Makaleye git <ExternalLink className="w-3 h-3" /></span>
                    </span>
                  </button>

                  {isEditing ? (
                    <div className="mt-3 space-y-2">
                      <textarea value={draft} onChange={e => setDraft(e.target.value)} maxLength={5000} rows={4}
                        className="w-full resize-y rounded-xl border border-sky-300 dark:border-[#1b6688] bg-[#f8fcfe] dark:bg-[#04121e] p-3 text-sm leading-relaxed text-[#0a2540] dark:text-[#e0f4ff] focus:outline-none focus:ring-2 focus:ring-sky-500/25" />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-[#7899ac]">{draft.length}/5000</span>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => { setEditingId(null); setDraft(''); }} className="px-3 py-2 rounded-xl text-xs font-semibold text-[#527993] hover:bg-slate-100 dark:hover:bg-[#0c2d44]">Vazgeç</button>
                          <button type="button" disabled={!draft.trim()} onClick={() => saveEdit(note)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-700 text-white text-xs font-bold disabled:opacity-40"><Check className="w-3.5 h-3.5" />Kaydet</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#294e67] dark:text-[#c5e0ed]">{note.content}</p>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-[#b9d6e3] dark:border-[#16445e] bg-white/70 dark:bg-[#071828]/70 px-5 py-12 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-sky-100 dark:bg-[#0c2d44] text-sky-700 dark:text-sky-300 flex items-center justify-center"><BookOpen className="w-6 h-6" /></div>
            <h2 className="mt-4 text-base font-bold text-[#0a2540] dark:text-[#e0f4ff]">{notes.length === 0 ? 'Defterin henüz boş' : 'Aradığın kayıt bulunamadı'}</h2>
            <p className="mt-1 max-w-sm mx-auto text-xs leading-relaxed text-[#64869c] dark:text-[#83aabd]">{notes.length === 0 ? 'Bir makalenin ayrıntılarını açıp kişisel not, önemli alıntı veya araştırma sorusu eklediğinde kayıtların burada birikecek.' : 'Başka bir kelime dene veya farklı bir kayıt türü seç.'}</p>
            {(query || filter !== 'all') && <button type="button" onClick={() => { setQuery(''); setFilter('all'); }} className="mt-4 px-4 py-2 rounded-xl bg-sky-700 text-white text-xs font-bold">Filtreleri temizle</button>}
          </div>
        )}
      </div>
    </div>
  );
};
