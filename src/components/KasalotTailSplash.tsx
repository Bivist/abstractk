import React, { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X, Waves, Sparkles } from 'lucide-react';

interface KasalotTailSplashProps {
  isOpen: boolean;
  onDismiss: () => void;
}

export const KasalotTailSplash: React.FC<KasalotTailSplashProps> = ({ isOpen, onDismiss }) => {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', closeOnEscape);
    const timer = window.setTimeout(onDismiss, 6500);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      window.clearTimeout(timer);
    };
  }, [isOpen, onDismiss]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-[#031321]/75 px-4 py-8 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="kasalot-title"
          onClick={onDismiss}
        >
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-[30px] border border-cyan-200/20 bg-gradient-to-b from-[#0b3850] via-[#08283d] to-[#041725] text-white shadow-[0_28px_100px_rgba(0,0,0,0.55)]"
            initial={{ y: 34, scale: 0.94, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 22, scale: 0.97, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 22 }}
            onClick={event => event.stopPropagation()}
          >
            <div className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-blue-500/15 blur-3xl" />

            <button
              type="button"
              onClick={onDismiss}
              aria-label="Kaşalot keşfini kapat"
              className="absolute right-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/75 transition hover:bg-white/20 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative z-10 px-6 pb-6 pt-7 text-center">
              <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-100/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" /> Okyanustan bir karşılaşma
              </div>
              <h2 id="kasalot-title" className="font-serif text-2xl font-black tracking-tight sm:text-3xl">
                Derinlerden bir dev yükseliyor
              </h2>
              <p className="mx-auto mt-2 max-w-[30ch] text-xs leading-relaxed text-sky-100/70">
                Hızlı keşif dalgaların okyanusun en etkileyici dalgıçlarından birini yüzeye çıkardı.
              </p>

              <div className="relative mx-auto mt-5 h-48 w-full overflow-hidden rounded-2xl border border-cyan-100/10 bg-gradient-to-b from-[#0d4560]/70 to-[#041b2b]/80">
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-cyan-200/10 to-transparent" />
                <motion.div
                  className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/15"
                  animate={reduceMotion ? {} : { scale: [0.75, 1.35], opacity: [0.55, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.div
                  className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/20"
                  animate={reduceMotion ? {} : { scale: [0.7, 1.5], opacity: [0.65, 0] }}
                  transition={{ duration: 2.2, delay: 0.55, repeat: Infinity, ease: 'easeOut' }}
                />

                <motion.svg
                  viewBox="0 0 360 190"
                  className="absolute inset-0 h-full w-full"
                  fill="none"
                  initial={reduceMotion ? false : { y: 75, rotate: 4, opacity: 0 }}
                  animate={reduceMotion ? {} : { y: [75, -8, -2, 75], rotate: [4, -2, 0, 4], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 5.6, times: [0, 0.32, 0.68, 1], ease: 'easeInOut' }}
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="whale-fluke-fill" x1="180" y1="35" x2="180" y2="165" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#B8E8F2" />
                      <stop offset="1" stopColor="#328AA8" />
                    </linearGradient>
                  </defs>
                  <path d="M180 154 C160 126 137 93 103 76 C76 62 45 59 25 65 C37 91 65 112 100 119 C128 125 151 137 174 169 L186 169 C209 137 232 125 260 119 C295 112 323 91 335 65 C315 59 284 62 257 76 C223 93 200 126 180 154Z" fill="url(#whale-fluke-fill)" stroke="#D8F5FA" strokeWidth="2" />
                  <path d="M174 169 Q180 143 186 169" stroke="#E6FAFC" strokeWidth="2" strokeLinecap="round" />
                  <path d="M92 82 Q132 100 166 142 M268 82 Q228 100 194 142" stroke="#E7FAFC" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round" />
                </motion.svg>

                <div className="absolute inset-x-0 bottom-0 h-9">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-cyan-400/45 to-cyan-300/0"
                    animate={reduceMotion ? {} : { opacity: [0.35, 0.8, 0.35] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                  <svg viewBox="0 0 360 40" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M0 18 Q45 2 90 18 T180 18 T270 18 T360 18 V40 H0Z" fill="#38BDF8" fillOpacity=".42" />
                    <path d="M0 25 Q45 10 90 25 T180 25 T270 25 T360 25" stroke="#DDF8FF" strokeOpacity=".65" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-left">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200">
                  <Waves className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-cyan-100">Kaşalot (Physeter macrocephalus)</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-sky-100/65">
                    Derin dalışlarıyla tanınan bu dişli balina, okyanusun karanlık katmanlarında avlanabilir.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onDismiss}
                className="mt-4 w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-extrabold text-[#062236] shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-200 active:scale-[0.99]"
              >
                Keşfe devam et
              </button>
              <p className="mt-2 text-[9px] font-medium tracking-wide text-sky-100/35">Bu küçük karşılaşma birkaç saniye sonra kendiliğinden kapanır.</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
