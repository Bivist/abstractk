import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { TabId } from '../types';

interface TourStep {
  target?: string; // data-tour değeri; yoksa ekranın ortasında gösterilir
  tab?: TabId; // adım gösterilmeden önce açılacak sekme
  tr: { title: string; text: string };
  en: { title: string; text: string };
}

const STEPS: TourStep[] = [
  {
    tab: 'home',
    tr: { title: 'Abstract’a hoş geldin 👋', text: 'Akademik makaleleri kaydırarak keşfet. Sana kısa bir tur yapalım; istediğin an “Turu geç” ile çıkabilirsin.' },
    en: { title: 'Welcome to Abstract 👋', text: 'Discover academic papers by swiping. Let’s take a quick tour; you can leave any time with “Skip tour”.' }
  },
  {
    tab: 'home',
    target: 'explore-btn',
    tr: { title: 'Keşfet', text: 'Buna basınca makale kartları açılır. Kartları kaydırarak gezersin.' },
    en: { title: 'Explore', text: 'Tap here to open the paper cards and start swiping.' }
  },
  {
    tab: 'home',
    target: 'filter-btn',
    tr: { title: 'Filtrele', text: 'Alan, yayın yılı, yazar ve dergi seçebilirsin. Birden fazla alan seçersen önce hepsinin ortak olduğu makaleler gelir; ortak yayın yoksa sana haber verilir ve alanlar ayrı ayrı gösterilir.' },
    en: { title: 'Filter', text: 'Pick fields, publication years, author and journal. With several fields, papers shared by all of them come first; if none exist you are told and the fields are shown separately.' }
  },
  {
    tab: 'home',
    target: 'theme-btn',
    tr: { title: 'Gece / gündüz', text: 'Fener düğmesi temayı değiştirir: gündüz modu ya da fenerin yandığı derin deniz modu.' },
    en: { title: 'Day / night', text: 'The lighthouse button switches the theme between day and the deep-sea night mode.' }
  },
  {
    tab: 'home',
    target: 'nav-disc',
    tr: { title: 'Keşfet sekmesi', text: 'Makale akışına istediğin zaman buradan dönebilirsin.' },
    en: { title: 'Explore tab', text: 'Come back to the paper feed from here at any time.' }
  },
  {
    tab: 'disc',
    target: 'disc-stage',
    tr: { title: 'Makale kartı', text: 'Kartı sağa kaydır: beğen. Sola kaydır: geç. Yukarı kaydır ya da karta dokun: makalenin ayrıntıları açılır.' },
    en: { title: 'Paper card', text: 'Swipe right to like, left to pass. Swipe up or tap the card to open the paper details.' }
  },
  {
    tab: 'disc',
    target: 'disc-actions',
    tr: { title: 'Düğmeler', text: 'Kaydırmak istemezsen bu düğmeleri kullan: ✕ geç, ▲ ayrıntı, ♥ beğen.' },
    en: { title: 'Buttons', text: 'Prefer not to swipe? Use these: ✕ pass, ▲ details, ♥ like.' }
  },
  {
    tab: 'disc',
    target: 'disc-filter',
    tr: { title: 'Hızlı filtre', text: 'Filtreyi akıştayken de buradan değiştirebilirsin.' },
    en: { title: 'Quick filter', text: 'You can also change the filter from the feed right here.' }
  },
  {
    tab: 'disc',
    target: 'nav-likes',
    tr: { title: 'Beğenilenler', text: 'Beğendiğin makaleler burada birikir. Klasörlere ayırabilir ve çıktı alabilirsin.' },
    en: { title: 'Favorites', text: 'Papers you like are collected here. Sort them into folders and export them.' }
  },
  {
    tab: 'likes',
    target: 'nav-dashboard',
    tr: { title: 'Seyir', text: 'Okuma alışkanlıklarını, ilgi alanlarını ve makaleler arasındaki bağlantıları burada takip edebilirsin. Seyir düğmesine dokunursan bu bölüme özel kısa bir tur da başlayacak.' },
    en: { title: 'Voyage', text: 'Explore your reading habits, interests and connections between papers here. Tap the Voyage button to start a separate guided tour of this section.' }
  },
  {
    tab: 'sets',
    target: 'nav-sets',
    tr: { title: 'Ayarlar', text: 'Akış modu (dikey kaydırma), tema, dil, ses ve çeviri ayarları burada. Bu turu da buradan yeniden başlatabilirsin.' },
    en: { title: 'Settings', text: 'Feed mode, theme, language, sound and translation live here. You can also replay this tour from here.' }
  },
  {
    tab: 'home',
    tr: { title: 'Hazırsın! 🌊', text: 'İyi keşifler. Önce “Keşfet”e basıp ilk makaleni kaydır.' },
    en: { title: 'You’re all set! 🌊', text: 'Happy exploring. Tap “Explore” and swipe your first paper.' }
  }
];

const SEYIR_STEPS: TourStep[] = [
  {
    tab: 'dashboard',
    target: 'seyir-overview',
    tr: { title: 'Seyir’e hoş geldin', text: 'Burası okuma alışkanlıklarını ve akademik keşiflerini takip edebileceğin kişisel alanın.' },
    en: { title: 'Welcome to Voyage', text: 'This is your personal space to follow your reading habits and academic discoveries.' }
  },
  {
    tab: 'dashboard',
    target: 'seyir-activity',
    tr: { title: 'Okuma aktiviten', text: 'Son günlerde ne kadar makale okuduğunu ve düzenini buradan görebilirsin.' },
    en: { title: 'Reading activity', text: 'See how many papers you have read recently and follow your routine here.' }
  },
  {
    tab: 'dashboard',
    target: 'seyir-topics',
    tr: { title: 'Öne çıkan konular', text: 'İlgini çeken bir konuya dokun. Abstract o konuyla ilgili makaleleri Keşfet bölümünde arayacak.' },
    en: { title: 'Topics you explore', text: 'Tap a topic and Abstract will find related papers in the Explore section.' }
  },
  {
    tab: 'dashboard',
    target: 'seyir-map-tab',
    tr: { title: 'Makale Haritası', text: 'Bu sekme, kaydettiğin makaleleri ortak konularına göre birbirine bağlayarak görmeni sağlar. Şimdi haritayı birlikte inceleyelim.' },
    en: { title: 'Paper Map', text: 'This view connects your saved papers by shared topics. Let’s take a look at the map.' }
  },
  {
    tab: 'dashboard',
    target: 'seyir-map-content',
    tr: { title: 'Makaleler arasındaki bağlantılar', text: 'Her nokta kaydettiğin bir makaleyi temsil eder. Noktalara dokunarak makale bilgilerini açabilir, yakınlaştırıp uzaklaştırabilir ve alanlara göre filtreleyebilirsin. Haritanın görünümü de uygulamanın gece/gündüz temasına uyum sağlar.' },
    en: { title: 'Connections between papers', text: 'Each point represents a saved paper. Select a point to view its details, zoom and pan the map, or filter by field. The map also follows the app’s day/night theme.' }
  },
  {
    tab: 'dashboard',
    target: 'seyir-depth',
    tr: { title: 'Yakında', text: 'Okuma Derinliği bölümü üzerinde çalışılıyor. Yeni özellik hazır olduğunda burada açılacak.' },
    en: { title: 'Coming soon', text: 'The Reading Depth feature is still in development and will appear here when ready.' }
  }
];

interface Props {
  lang: 'tr' | 'en';
  onSetTab: (tab: TabId) => void;
  onClose: () => void;
  mode?: 'general' | 'seyir';
}

const PAD = 6;
const TIP_W = 300;

export const OnboardingTour: React.FC<Props> = ({ lang, onSetTab, onClose, mode = 'general' }) => {
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  const activeSteps = mode === 'seyir' ? SEYIR_STEPS : STEPS;
  const step = activeSteps[idx];
  const t = step[lang] || step.tr;
  const isLast = idx === activeSteps.length - 1;
  const L = lang === 'en'
    ? { skip: 'Skip tour', next: 'Next', back: 'Back', done: 'Finish' }
    : { skip: 'Turu geç', next: 'İleri', back: 'Geri', done: 'Bitir' };

  // Adım değişince doğru sekmeye geç
  useEffect(() => {
    if (step.tab) onSetTab(step.tab);
    // Makale haritası adımına geçildiğinde Seyir içindeki ilgili görünümü aç.
    if (mode === 'seyir' && idx === 3) {
      window.dispatchEvent(new CustomEvent('abstract:seyir-tour-map'));
    }
    if (mode === 'seyir' && idx === 5) {
      window.dispatchEvent(new CustomEvent('abstract:seyir-tour-summary'));
    }
  }, [idx, mode]);

  // Hedef elemanı bul (sekme geçişi sonrası görünmesi için kısa süre dener) ve konumunu takip et
  const measure = useCallback(() => {
    setVp({ w: window.innerWidth, h: window.innerHeight });
    if (!step.target) { setRect(null); return; }
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    // Hedef ekrandan çıktıysa açıklama kutusunu hedefe sabitleme.
    const visible = r.bottom > 0 && r.top < window.innerHeight;
    setRect(r.width && r.height && visible ? r : null);
  }, [step.target]);

  useLayoutEffect(() => {
    setRect(null);

    // Seyir ekranı kendi içinde kaydırılır. Her adımda hedefi bu kaydırılabilir
    // alanın görünür bölümüne al; aksi hâlde alttaki adımlar ekranda kalmaz.
    let scrollTimer: ReturnType<typeof setTimeout> | undefined;
    let measureTimer: ReturnType<typeof setTimeout> | undefined;
    if (step.target) {
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        scrollTimer = setTimeout(measure, 420);
      }
    }

    measure();
    let tries = 0;
    const timer = window.setInterval(() => {
      measure();
      if (++tries > 16) window.clearInterval(timer);
    }, 120);

    // Kullanıcı tur açıkken sayfayı elle kaydırırsa vurguyu ve açıklama
    // kutusunu yeni konuma göre güncelle.
    const scrollable = document.querySelector<HTMLElement>('.overflow-y-auto');
    scrollable?.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);

    return () => {
      window.clearInterval(timer);
      if (scrollTimer) window.clearTimeout(scrollTimer);
      if (measureTimer) window.clearTimeout(measureTimer);
      scrollable?.removeEventListener('scroll', measure);
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [idx, measure, step.target]);

  const next = () => (isLast ? onClose() : setIdx(i => i + 1));
  const back = () => setIdx(i => Math.max(0, i - 1));

  // Tooltip konumu: hedefin altına, yer yoksa üstüne; yatayda ekrana sığdır
  const tipW = Math.min(TIP_W, vp.w - 24);
  let tipStyle: React.CSSProperties;
  if (rect) {
    const below = rect.bottom + PAD + 12;
    const placeBelow = below + 170 < vp.h || rect.top < 200;
    const left = Math.min(Math.max(12, rect.left + rect.width / 2 - tipW / 2), vp.w - tipW - 12);
    tipStyle = placeBelow
      ? { top: Math.min(below, vp.h - 190), left, width: tipW }
      : { bottom: vp.h - rect.top + PAD + 12, left, width: tipW };
  } else {
    tipStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: tipW };
  }

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Uygulama turu">
      {/* Tıklamaları engelleyen katman */}
      <div className="absolute inset-0 pointer-events-none" />

      {/* Karartma + vurgulu alan */}
      {rect ? (
        <div
          className="absolute rounded-2xl pointer-events-none transition-all duration-300 ring-2 ring-sky-300 animate-pulse"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgba(2, 15, 26, 0.74)'
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[#020f1a]/75 pointer-events-none" />
      )}

      {/* Açıklama kutusu */}
      <div
        className="absolute pointer-events-auto rounded-2xl bg-white dark:bg-[#071828] text-[#0a2540] dark:text-[#e0f4ff] border border-sky-200 dark:border-sky-800 shadow-2xl p-4"
        style={tipStyle}
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-serif text-base font-bold">{t.title}</h4>
          <span className="text-[10px] font-semibold text-[#4a7a96] dark:text-[#5fa8c8] tabular-nums shrink-0 mt-1">
            {idx + 1}/{activeSteps.length}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-[#35607a] dark:text-[#9ccce6]">{t.text}</p>

        <div className="flex items-center justify-between mt-3.5">
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] font-semibold text-[#4a7a96] dark:text-[#5fa8c8] hover:underline"
          >
            {L.skip}
          </button>
          <div className="flex gap-2">
            {idx > 0 && (
              <button
                type="button"
                onClick={back}
                className="px-3 py-1.5 rounded-xl border border-[#c5dfe9] dark:border-[#0d2f45] text-xs font-semibold"
              >
                {L.back}
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-700 to-cyan-600 text-white text-xs font-bold shadow-md"
            >
              {isLast ? L.done : L.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
