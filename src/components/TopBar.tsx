import React, { useRef, useState } from 'react';
import { AppIcon } from './AppIcon';

interface TopBarProps {
  onGoHome: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  reelsMode?: boolean;
  avatarUrl?: string | null;
  showAvatar?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  onGoHome,
  isDark,
  onToggleTheme,
  reelsMode = false,
  avatarUrl = null,
  showAvatar = true
}) => {
  const [avatarExpanded, setAvatarExpanded] = useState(false);
  const logoClickRef = useRef<{ count: number; lastClick: number }>({ count: 0, lastClick: 0 });
  const [beaconBurst, setBeaconBurst] = useState(false);
  const [showSecretBadge, setShowSecretBadge] = useState(false);
  const [secretBadgeUnlocked, setSecretBadgeUnlocked] = useState(() => {
    try { return localStorage.getItem('abs_lighthouse_secret_badge') === '1'; } catch { return false; }
  });

  const handleLogoClick = () => {
    onGoHome();
    const now = Date.now();
    const previous = logoClickRef.current;
    const count = now - previous.lastClick > 1800 ? 1 : previous.count + 1;
    logoClickRef.current = { count, lastClick: now };

    if (count >= 5) {
      logoClickRef.current = { count: 0, lastClick: 0 };
      setBeaconBurst(true);
      setShowSecretBadge(true);
      setSecretBadgeUnlocked(true);
      try { localStorage.setItem('abs_lighthouse_secret_badge', '1'); } catch {}
      window.setTimeout(() => setBeaconBurst(false), 2600);
      window.setTimeout(() => setShowSecretBadge(false), 6500);
    }
  };
  const [avatarAnimation, setAvatarAnimation] = useState<'grow' | 'shrink'>('grow');
  const toggleAvatar = () => {
    setAvatarAnimation(avatarExpanded ? 'shrink' : 'grow');
    setAvatarExpanded(value => !value);
  };
  return (
    <header className="relative z-20 flex items-center justify-between px-5 py-2 bg-white dark:bg-[#071828] border-b border-[#c5dfe9]/60 dark:border-[#0d2f45] shadow-sm shadow-sky-950/5">
      {/* Brand & Logo Zone */}
      <button
        type="button"
        onClick={handleLogoClick}
        className="relative flex items-center gap-3 text-left group focus-visible:outline-2 focus-visible:outline-sky-600 rounded-xl transition-transform active:scale-95"
        title="Ana Sayfa"
      >
        {/* Logo: büyütülmüş, çerçevesiz */}
        <div className={`relative w-[68px] h-[68px] flex items-center justify-center shrink-0 ${beaconBurst ? 'drop-shadow-[0_0_18px_rgba(56,189,248,0.95)]' : ''}`}>
          {beaconBurst && (
            <>
              <span className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-1 w-24 -translate-y-1/2 -translate-x-1/2 rounded-full bg-cyan-300/80 blur-md animate-ping" />
              <span className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-1 w-28 -translate-y-1/2 -translate-x-1/2 rotate-[-18deg] rounded-full bg-amber-200/90 blur-sm animate-pulse" />
              <span className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-1 w-28 -translate-y-1/2 -translate-x-1/2 rotate-[18deg] rounded-full bg-cyan-200/90 blur-sm animate-pulse" />
            </>
          )}
          <span className={beaconBurst ? 'relative z-10 scale-110 transition-transform duration-500' : 'relative z-10 transition-transform duration-500'}>
          <AppIcon
            name="logo"
            size={64}
            className="w-16 h-16 object-contain scale-[1.12]"
            alt="Abstract Logo"
            fallback={
              <svg viewBox="0 0 40 40" className="w-11 h-11 fill-none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" stroke="#0284c7" strokeWidth="2.5" />
                <path d="M12 28L20 12L28 28" stroke="#0284c7" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 23H25" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            }
          />
          </span>
        </div>
        <div className="flex flex-col">
          <span className="font-serif text-[26px] font-bold tracking-tight text-[#0a2540] dark:text-[#f0f9ff]">
            Abstract
          </span>
          {reelsMode && (
            <span className="text-[9px] uppercase tracking-wider font-bold text-cyan-600 dark:text-cyan-400 -mt-1 font-sans">
              Akış Modu
            </span>
          )}
        </div>
      </button>

      {showSecretBadge && (
        <div
          role="status"
          aria-live="polite"
          className="absolute left-4 top-[calc(100%+10px)] z-[80] w-[min(330px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-cyan-300/50 bg-[#071d30]/95 p-4 text-left text-white shadow-[0_18px_55px_rgba(2,20,35,0.45)] backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-500"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-amber-200/50 bg-cyan-300/10 text-amber-200 shadow-[0_0_22px_rgba(103,232,249,0.2)]">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
                <path d="M12 2.8 14.7 8l5.7.8-4.1 4 1 5.7-5.3-2.7-5.3 2.7 1-5.7-4.1-4L9.3 8 12 2.8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M12 6.5v7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Gizli keşif · {secretBadgeUnlocked ? 'Rozet açıldı' : 'Yeni keşif'}</p>
              <p className="mt-1 text-sm font-semibold text-white">Fenerin Sırlarını Keşfettin</p>
            </div>
            <button type="button" onClick={() => setShowSecretBadge(false)} aria-label="Mesajı kapat" className="ml-auto self-start rounded-full px-2 text-white/60 hover:bg-white/10 hover:text-white">×</button>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-200">“Bazı keşifler yalnızca dikkatli bakanlara görünür.”</p>
          <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3 text-[11px] font-medium text-cyan-200">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]" />
            Gizli başarı rozeti koleksiyonuna eklendi
          </div>
        </div>
      )}

      {showAvatar && avatarUrl && (
        <button
          type="button"
          onClick={toggleAvatar}
          aria-label={avatarExpanded ? 'Profil fotoğrafını küçült' : 'Profil fotoğrafını büyüt'}
          aria-expanded={avatarExpanded}
          className={`profile-avatar-trigger ${avatarExpanded ? 'is-expanded' : ''} ${avatarAnimation === 'grow' ? 'avatar-grow' : 'avatar-shrink'}`}
        >
          <img src={avatarUrl} alt="Profil fotoğrafın" className="profile-avatar-image" />
        </button>
      )}

      {/* Right Controls: Circular Dark Navy Lighthouse Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleTheme}
          data-tour="theme-btn"
          aria-label="Tema değiştir"
          title={isDark ? "Gece Modu Açık (Fener Yanıyor) - Gündüze Geç" : "Gündüz Modu (Fener Kapalı) - Geceye Geç"}
          className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md relative hover:scale-105 active:scale-95 transition-all border group ${
            isDark
              ? 'bg-[#051a2e] text-white border-sky-500/50 shadow-amber-500/10'
              : 'bg-[#0a2540] text-slate-300 border-sky-900/40'
          }`}
        >
          {/* Glowing pulse beacon light ONLY in dark mode */}
          {isDark && (
            <span className="absolute -top-0.5 right-1 w-2.5 h-2.5 rounded-full bg-amber-400/90 blur-xs animate-pulse" />
          )}
          
          <svg className="w-6 h-6 transition-transform group-hover:rotate-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Light beam triangles ONLY in dark mode */}
            {isDark && (
              <path
                d="M14 6L21 3M14 8L22 9M10 6L3 3M10 8L2 9"
                stroke="#fbbf24"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="filter drop-shadow-[0_0_3px_#fde047]"
              />
            )}
            
            {/* Lighthouse Tower Body */}
            <path
              d="M10 20L11 9H13L14 20"
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Stripes */}
            <path d="M10.5 13H13.5" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M10.2 16.5H13.8" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" />
            {/* Base */}
            <path d="M8.5 20H15.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            {/* Lantern Room */}
            <path d="M10 9L11 5H13L14 9H10Z" stroke="#ffffff" strokeWidth="1.6" strokeLinejoin="round" fill="#ffffff" fillOpacity={isDark ? "0.2" : "0.08"} />
            {/* Roof Dome */}
            <path d="M10 5L12 2.5L14 5H10Z" fill={isDark ? "#38bdf8" : "#0284c7"} stroke={isDark ? "#38bdf8" : "#0284c7"} strokeWidth="1.2" strokeLinejoin="round" />
            {/* Lamp Beacon - Glowing warm yellow when dark, unlit slate when light */}
            <circle
              cx="12"
              cy="7"
              r="1.5"
              fill={isDark ? "#facc15" : "#64748b"}
              className={isDark ? "filter drop-shadow-[0_0_4px_#fde047]" : ""}
            />
          </svg>
        </button>
      </div>
    </header>
  );
};
