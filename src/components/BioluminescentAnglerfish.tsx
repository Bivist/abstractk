import React from 'react';
import { motion } from 'motion/react';
import { RefreshCw, SlidersHorizontal } from 'lucide-react';

interface BioluminescentAnglerfishProps {
  onOpenFilter?: () => void;
  onReset?: () => void;
  message?: string;
}

export const BioluminescentAnglerfish: React.FC<BioluminescentAnglerfishProps> = ({
  onOpenFilter,
  onReset,
  message = 'Kaydırılacak makale bulunamadı.'
}) => {
  return (
    <div className="angler-empty-state relative flex-1 w-full min-h-[360px] rounded-[28px] overflow-hidden flex flex-col items-center justify-center px-5 py-8">
      <div className="angler-water-glow" aria-hidden="true" />
      <motion.div
        className="angler-fish-wrap relative z-10 w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center"
        animate={{ y: [0, -9, 0], rotate: [0, -1.5, 0, 1.5, 0] }}
        transition={{ duration: 5.8, ease: 'easeInOut', repeat: Infinity }}
      >
        <div className="angler-lure-glow" aria-hidden="true" />
        <motion.img
          src="/angler-fish.svg"
          alt="Fener balığı"
          className="angler-fish-image relative z-10 w-full h-full object-contain"
          animate={{ scale: [1, 1.025, 1], x: [0, 2, 0] }}
          transition={{ duration: 3.4, ease: 'easeInOut', repeat: Infinity }}
        />
      </motion.div>

      <motion.div
        className="relative z-10 mt-2 flex flex-col items-center text-center gap-5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.12 }}
      >
        <p className="text-sm sm:text-base font-semibold tracking-wide text-slate-700 dark:text-slate-100">
          {message}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {onOpenFilter && (
            <button
              type="button"
              onClick={onOpenFilter}
              className="px-4 py-2.5 rounded-full bg-sky-600 hover:bg-sky-500 border border-sky-400/50 text-white text-xs sm:text-sm font-semibold transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-sky-950/20"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filtreleri Değiştir</span>
            </button>
          )}

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="px-4 py-2.5 rounded-full bg-white/85 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-100 text-xs sm:text-sm font-semibold transition-all active:scale-95 flex items-center gap-2 shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Tümünü Keşfet</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
