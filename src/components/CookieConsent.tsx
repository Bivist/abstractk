import React, { useState } from 'react';
import { Cookie, X, ShieldCheck } from 'lucide-react';
import { LegalDocumentModal } from './LegalDocuments';

const CONSENT_KEY = 'abs_cookie_consent';

export const CookieConsent: React.FC = () => {
  const [choice, setChoice] = useState<string | null>(() => {
    try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
  });
  const [showDetails, setShowDetails] = useState(false);
  const [showCookiePolicy, setShowCookiePolicy] = useState(false);

  const saveChoice = (value: 'all' | 'necessary') => {
    try { localStorage.setItem(CONSENT_KEY, value); } catch {}
    setChoice(value);
    // Analitik izni verildiyse, index.html içindeki izin kontrollü başlatıcıyı çalıştır.
    if (value === 'all') window.location.reload();
  };

  if (choice) return null;

  return (
    <aside
      role="dialog"
      aria-label="Çerez ve gizlilik tercihleri"
      aria-describedby="cookie-consent-description"
      className="fixed z-[85] left-3 right-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[min(620px,calc(100vw-2rem))]"
    >
      <div className="rounded-2xl border border-[#c5dfe9] dark:border-[#17435c] bg-white/95 dark:bg-[#071828]/95 text-[#0a2540] dark:text-[#e0f4ff] shadow-[0_12px_45px_rgba(3,35,58,0.22)] backdrop-blur-xl p-3.5 sm:p-4">
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
            <Cookie className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold">Çerez tercihlerin</div>
            <p id="cookie-consent-description" className="mt-1 text-[11px] sm:text-xs leading-relaxed text-[#42677e] dark:text-[#9bc3d8]">
              Abstract, sitenin çalışması ve tercihlerini hatırlamak için zorunlu yerel depolama kullanır. İzin verirsen anonim kullanım istatistikleri de toplarız.
            </p>
            {showDetails && (
              <p className="mt-2 text-[11px] leading-relaxed text-[#42677e] dark:text-[#9bc3d8]">
                Zorunlu depolama; oturum, uygulama tercihleri ve kaydettiğin içeriklerin çalışması içindir. Analitik tercih isteğe bağlıdır ve PostHog kullanım ölçümü yalnızca kabul ettiğinde etkinleştirilir. Tercihin bu cihazda saklanır.
              </p>
            )}
            <button type="button" onClick={() => setShowCookiePolicy(true)} className="mt-2 block text-[10px] font-semibold text-sky-700 dark:text-sky-300 underline underline-offset-2">
              Çerez politikasını oku
            </button>
          </div>
          <button type="button" onClick={() => saveChoice('necessary')} aria-label="Yalnızca zorunlu olanları kullan" className="w-7 h-7 rounded-full flex items-center justify-center text-[#66869a] hover:bg-sky-50 dark:hover:bg-sky-950/60 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => saveChoice('all')} className="flex-1 min-w-[145px] rounded-xl bg-sky-700 hover:bg-sky-800 text-white px-3 py-2.5 text-xs font-bold transition-colors">
            Tümünü kabul et
          </button>
          <button type="button" onClick={() => saveChoice('necessary')} className="flex-1 min-w-[145px] rounded-xl border border-[#c5dfe9] dark:border-[#24516a] bg-white/70 dark:bg-[#0b263a] text-[#16415b] dark:text-[#c5e5f3] px-3 py-2.5 text-xs font-semibold transition-colors">
            Yalnızca zorunlu
          </button>
          <button type="button" onClick={() => setShowDetails(v => !v)} className="w-full sm:w-auto px-2 py-1 text-[11px] font-semibold text-sky-700 dark:text-sky-300 hover:underline">
            {showDetails ? 'Daha az göster' : 'Ayrıntılar'}
          </button>
        </div>
      </div>
      {showCookiePolicy && <LegalDocumentModal documentKey="cookies" onClose={() => setShowCookiePolicy(false)} />}
    </aside>
  );
};
