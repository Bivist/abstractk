import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Paper } from '../types';
import { HoldToConfirmButton } from './HoldToConfirmButton';
import { FolderPlus, Download, Check, Trash2, ArrowUp, ArrowDown, ChevronRight, FileText, Sparkles, Share2 } from 'lucide-react';

interface LikesScreenProps {
  likedPapers: Paper[];
  folders: Record<string, string[]>;
  currentFolder: string;
  onSelectFolder: (folder: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onClearSelection: () => void;
  onRemoveSelected: () => void;
  onOpenNewFolder: () => void;
  onOpenMoveFolder: () => void;
  onExport: (items: Paper[]) => void;
  onOpenMap?: () => void;
  onOpenDetails: (paper: Paper) => void;
  onSharePaper?: (paper: Paper) => void;
  onRemoveLike: (paperId: string) => void;
  onUndoRemove: () => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  langDict: Record<string, string>;
}

export const LikesScreen: React.FC<LikesScreenProps> = ({
  likedPapers,
  folders,
  currentFolder,
  onSelectFolder,
  selectedIds,
  onToggleSelect,
  onClearSelection,
  onRemoveSelected,
  onOpenNewFolder,
  onOpenMoveFolder,
  onExport,
  onOpenMap,
  onOpenDetails,
  onSharePaper,
  onRemoveLike,
  onUndoRemove,
  onMoveUp,
  onMoveDown,
  langDict
}) => {
  const [undoPaper, setUndoPaper] = useState<Paper | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);
  const removeWithFeedback = (paper: Paper) => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoPaper(paper);
    onRemoveLike(paper.id);
    undoTimer.current = setTimeout(() => setUndoPaper(null), 2000);
  };
  const undoLastRemoval = () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    onUndoRemove();
    setUndoPaper(null);
  };

  // Extract all unique folder names
  const allFolderNames = Array.from(
    new Set(Object.values(folders).flat())
  );

  // Filter papers based on selected folder
  const displayedPapers = currentFolder === '__all__'
    ? likedPapers
    : likedPapers.filter(p => (folders[p.id] || []).includes(currentFolder));

  const selectedCount = selectedIds.size;
  const selectedPapers = likedPapers.filter(p => selectedIds.has(p.id));

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-3.5 max-w-lg mx-auto w-full select-none">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#c5dfe9] dark:border-[#0d2f45]">
        <h3 className="font-serif text-lg font-bold text-[#0a2540] dark:text-[#e0f4ff]">
          {langDict.likes_header || "♡ Beğenilenler"}
        </h3>
        <div className="flex items-center gap-1.5">
          {onOpenMap && (
            <button
              type="button"
              onClick={onOpenMap}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500/15 to-cyan-500/20 border border-sky-400/40 text-xs font-bold text-[#0284c7] dark:text-[#38bdf8] flex items-center gap-1 hover:border-sky-500 transition-colors"
              title="Takımyıldız Bilgi Ağı Haritası"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span>Harita</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenNewFolder}
            className="px-2.5 py-1.5 rounded-xl bg-[#dff0f7] dark:bg-[#0d2236] border border-[#c5dfe9] dark:border-[#0d2f45] text-xs font-semibold flex items-center gap-1 hover:border-sky-600 transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>{langDict.new_folder_btn || "＋ Klasör"}</span>
          </button>
          <button
            type="button"
            onClick={() => onExport(displayedPapers)}
            disabled={!displayedPapers.length}
            className="px-2.5 py-1.5 rounded-xl bg-[#dff0f7] dark:bg-[#0d2236] border border-[#c5dfe9] dark:border-[#0d2f45] text-xs font-semibold flex items-center gap-1 hover:border-sky-600 transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>{langDict.export_btn || "⬇ Çıktı al"}</span>
          </button>
        </div>
      </div>

      {/* Folder Tabs Carousel */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-2.5 shrink-0">
        <button
          type="button"
          onClick={() => onSelectFolder('__all__')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            currentFolder === '__all__'
              ? 'bg-[#0369a1] text-white shadow-sm'
              : 'bg-[#dff0f7] dark:bg-[#0d2236] border border-[#c5dfe9] dark:border-[#0d2f45] text-[#4a7a96] dark:text-[#5fa8c8]'
          }`}
        >
          {langDict.all_folder || "Tümü"} ({likedPapers.length})
        </button>
        {allFolderNames.map(fName => {
          const count = likedPapers.filter(p => (folders[p.id] || []).includes(fName)).length;
          return (
            <button
              key={fName}
              type="button"
              onClick={() => onSelectFolder(fName)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                currentFolder === fName
                  ? 'bg-[#0369a1] text-white shadow-sm'
                  : 'bg-[#dff0f7] dark:bg-[#0d2236] border border-[#c5dfe9] dark:border-[#0d2f45] text-[#4a7a96] dark:text-[#5fa8c8]'
              }`}
            >
              {fName} ({count})
            </button>
          );
        })}
      </div>

      {undoPaper && (
        <div role="status" aria-live="polite" className="mb-2 flex shrink-0 items-center gap-2 rounded-xl border border-sky-200/80 bg-white/95 px-3 py-2 text-xs text-[#315d78] shadow-[0_4px_14px_rgba(2,132,199,0.10)] backdrop-blur dark:border-sky-900/70 dark:bg-[#0b2639]/95 dark:text-sky-100">
          <span className="min-w-0 flex-1 truncate">Makale beğenilenlerden çıkarıldı.</span>
          <button type="button" onClick={undoLastRemoval} className="shrink-0 rounded-full px-3 py-1.5 font-semibold text-sky-700 transition-colors hover:bg-sky-100 active:scale-95 dark:text-sky-300 dark:hover:bg-sky-900/60">Geri al</button>
        </div>
      )}

      {/* Batch Selection Action Bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 p-2.5 mb-2.5 rounded-2xl bg-gradient-to-r from-sky-700 to-cyan-600 text-white text-xs font-semibold shadow-md shrink-0">
          <span className="flex-1">{selectedCount} seçildi</span>
          <HoldToConfirmButton
            onConfirm={onRemoveSelected}
            duration={1200}
            resetAfter={1400}
            className="min-h-8 px-2.5 py-1 text-[11px]"
            confirmedContent="Silindi"
          >
            Silmek için basılı tut
          </HoldToConfirmButton>
          <button
            type="button"
            onClick={onOpenMoveFolder}
            className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 border border-white/20"
          >
            {langDict.move_folder_btn || "Klasöre taşı"}
          </button>
          <button
            type="button"
            onClick={() => onExport(selectedPapers)}
            className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 border border-white/20"
          >
            {langDict.export_btn || "Çıktı al"}
          </button>
          <button
            type="button"
            onClick={onClearSelection}
            className="p-1 rounded-lg bg-white/20 hover:bg-white/30"
          >
            ✕
          </button>
        </div>
      )}

      {/* Papers List */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5 pb-8">
        {!displayedPapers.length ? (
          <div className="flex flex-col items-center justify-center h-64 text-center text-[#4a7a96] dark:text-[#5fa8c8] gap-3">
            <span className="text-4xl">♡</span>
            <p className="text-sm">
              Henüz beğendiğiniz makale yok.<br />
              Keşfet'te sağa kaydırarak beğenebilirsiniz.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
          {displayedPapers.map((paper, idx) => {
            const isSelected = selectedIds.has(paper.id);
            const paperFolders = folders[paper.id] || [];
            return (
              <motion.div
                key={paper.id}
                layout
                drag="x"
                dragDirectionLock
                dragConstraints={{ left: -120, right: 0 }}
                dragElastic={0.12}
                onDragEnd={(_, info) => { if (info.offset.x < -78) removeWithFeedback(paper); }}
                whileDrag={{ scale: 0.985, transition: { duration: 0.12 } }}
                exit={{ x: -260, opacity: 0, scale: 0.94, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
                className={`relative touch-pan-y p-3.5 rounded-2xl bg-white dark:bg-[#071828] border transition-colors ${
                  isSelected
                    ? 'border-sky-600 ring-2 ring-sky-600/20 shadow-md'
                    : 'border-[#c5dfe9] dark:border-[#0d2f45] hover:border-sky-400'
                }`}
              >
                {/* Checkbox Trigger */}
                <button
                  type="button"
                  onClick={() => onToggleSelect(paper.id)}
                  className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-sky-600 border-sky-600 text-white'
                      : 'border-[#c5dfe9] dark:border-[#0d2f45] bg-[#dff0f7] dark:bg-[#0d2236]'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                <span className="block text-[9px] text-[#7b9aad] dark:text-[#6b91a8] mb-1">Silmek için sola kaydır</span>
                {/* Paper Title */}
                <h4
                  onClick={() => onOpenDetails(paper)}
                  className="font-serif text-sm sm:text-base font-bold text-[#0a2540] dark:text-[#e0f4ff] pr-8 cursor-pointer hover:text-sky-600 transition-colors line-clamp-2"
                >
                  {paper.title}
                </h4>

                {/* Subtitle */}
                <span className="block text-xs text-[#4a7a96] dark:text-[#5fa8c8] mt-1 mb-2">
                  {paper.authors} · {paper.journal}, {paper.year}
                </span>

                {/* Attached Folder Tags */}
                {paperFolders.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mb-2.5">
                    {paperFolders.map(fn => (
                      <span
                        key={fn}
                        className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#dbeafe] text-[#0369a1] dark:bg-[#0c2d44] dark:text-[#7dd3fc]"
                      >
                        {fn}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs pt-1 border-t border-[#c5dfe9]/60 dark:border-[#0d2f45]/60">
                  <button
                    type="button"
                    onClick={() => onOpenDetails(paper)}
                    className="px-2.5 py-1 rounded-full bg-[#dff0f7] dark:bg-[#0d2236] border border-[#c5dfe9] dark:border-[#0d2f45] font-medium hover:border-sky-600"
                  >
                    Ayrıntı
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveUp(idx)}
                    disabled={idx === 0}
                    className="p-1 rounded-full bg-[#dff0f7] dark:bg-[#0d2236] border border-[#c5dfe9] dark:border-[#0d2f45] hover:border-sky-600 disabled:opacity-30"
                    title="Yukarı taşı"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveDown(idx)}
                    disabled={idx === displayedPapers.length - 1}
                    className="p-1 rounded-full bg-[#dff0f7] dark:bg-[#0d2236] border border-[#c5dfe9] dark:border-[#0d2f45] hover:border-sky-600 disabled:opacity-30"
                    title="Aşağı taşı"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  {onSharePaper && (
                    <button
                      type="button"
                      onClick={() => onSharePaper(paper)}
                      className="px-2.5 py-1 rounded-full bg-sky-50 dark:bg-[#0c2d44] border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-medium flex items-center gap-1 hover:border-sky-500"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>{langDict.share_btn || 'Paylaş'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeWithFeedback(paper)}
                    className="px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-medium ml-auto flex items-center gap-1 hover:bg-rose-100"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Çıkar</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        )}
      </div>

      {/* Sitenin En Altındaki Telif & İmza Yazısı */}
      <footer className="mt-2 pt-2.5 pb-1 text-center border-t border-[#c5dfe9]/50 dark:border-[#0d2f45]/50 shrink-0 select-none">
        <p className="text-xs text-[#527993] dark:text-[#7bb0cc] font-medium tracking-wide">
          © 2026 Binali. Her hakkı saklıdır.
        </p>
      </footer>
    </div>
  );
};
