import React from 'react';
import { TabId } from '../types';
import { AppIcon } from './AppIcon';
import { Compass, Heart, Settings } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
  langDict: Record<string, string>;
  likesCount: number;
  desktop?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  langDict,
  likesCount,
  desktop = false
}) => {
  // Lighthouse SVG Icon for "Ana sayfa" matching reference image
  const LighthouseIcon = ({ active }: { active: boolean }) => (
    <svg className="w-5 h-5 transition-transform" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 21H15M10 21L11 9H13L14 21M9 9H15M10 9L11 5H13L14 9M12 2L10 5H14L12 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? "0.15" : "0"}
      />
      <circle cx="12" cy="7" r="1.5" fill={active ? "#0284c7" : "currentColor"} />
    </svg>
  );

  const tabs: {
    id: TabId;
    labelKey: string;
    iconName: 'home' | 'explore' | 'likes' | 'dashboard' | 'settings';
    renderIcon: (active: boolean) => React.ReactNode;
  }[] = [
    {
      id: 'home',
      labelKey: 'tab_home',
      iconName: 'home',
      renderIcon: (active) => <LighthouseIcon active={active} />
    },
    {
      id: 'disc',
      labelKey: 'tab_explore',
      iconName: 'explore',
      renderIcon: (active) => <Compass className={`w-5 h-5 ${active ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
    },
    {
      id: 'likes',
      labelKey: 'tab_likes',
      iconName: 'likes',
      renderIcon: (active) => (
        <div className="relative">
          <Heart className={`w-5 h-5 ${active ? 'fill-[#ff6b6b] text-[#ff6b6b] stroke-[#ff6b6b]' : 'stroke-[1.8]'}`} />
          {likesCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#f43f5e] text-white text-[10px] font-bold flex items-center justify-center shadow-xs"
            >
              {likesCount > 99 ? '99+' : likesCount}
            </motion.span>
          )}
        </div>
      )
    },
    {
      id: 'dashboard',
      labelKey: 'tab_dashboard',
      iconName: 'dashboard',
      renderIcon: (active) => (
        <svg className="w-5 h-5 transition-transform" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={active ? "2" : "1.6"} strokeDasharray="2 2" opacity="0.6" />
          <circle cx="12" cy="5" r="1.8" fill={active ? "#0284c7" : "currentColor"} />
          <circle cx="6" cy="16" r="1.8" fill={active ? "#0284c7" : "currentColor"} />
          <circle cx="18" cy="15" r="2.2" fill={active ? "#06b6d4" : "currentColor"} />
          <circle cx="12" cy="12" r="1.5" fill={active ? "#38bdf8" : "currentColor"} />
          <path d="M12 5L6 16M12 5L18 15M6 16L18 15M12 5L12 12" stroke="currentColor" strokeWidth="1.3" opacity={active ? "0.9" : "0.5"} />
        </svg>
      )
    },
    {
      id: 'sets',
      labelKey: 'tab_settings',
      iconName: 'settings',
      renderIcon: (active) => <Settings className={`w-5 h-5 ${active ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
    }
  ];

  return (
    <nav className={desktop ? "relative z-20 w-60 shrink-0 bg-white dark:bg-[#071828] px-3 py-5 border-r border-[#c5dfe9]/40 dark:border-[#0d2f45] overflow-y-auto" : "relative z-20 bg-white dark:bg-[#071828] px-3 pb-3 pt-7 shadow-[0_-6px_20px_rgba(2,132,199,0.08)] border-t border-[#c5dfe9]/40 dark:border-[#0d2f45] overflow-visible"}>
      {/* Gentle Oceanic Wavy Top Edge Contour */}
      <div className="absolute -top-[7px] left-0 right-0 h-[8px] pointer-events-none overflow-hidden leading-none">
        <svg
          viewBox="0 0 1200 12"
          preserveAspectRatio="none"
          className="w-full h-full fill-white dark:fill-[#071828] drop-shadow-[0_-2px_3px_rgba(2,132,199,0.04)]"
        >
          <path d="M0 12 C150 2, 300 2, 450 7 C600 12, 750 2, 900 6 C1050 10, 1150 3, 1200 8 L1200 12 L0 12 Z" />
        </svg>
      </div>

      <div className={desktop ? "flex flex-col gap-2" : "flex items-center justify-around max-w-md mx-auto"}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              data-tour={`nav-${tab.id}`}
              className={desktop ? "relative w-full py-3 px-4 flex flex-row items-center justify-start gap-3 min-h-[48px] rounded-xl transition-all group focus-visible:outline-hidden" : "relative flex-1 py-1 px-1 flex flex-col items-center justify-center gap-1 min-h-[50px] transition-all group focus-visible:outline-hidden"}
            >
              {/* Masaüstünde yatay vurgu; mobilde belirgin, yüzen mavi aktif düğme */}
              {desktop && isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  className="absolute inset-0 rounded-xl bg-[#dff0f7] dark:bg-[#0c2d44]"
                />
              )}

              {!desktop && isActive && (
                <motion.div
                  layoutId="mobileActiveBubble"
                  transition={{ type: 'spring', stiffness: 230, damping: 28, mass: 1.05 }}
                  className="pointer-events-none absolute left-1/2 top-[-39px] z-0 flex h-[54px] w-[54px] -translate-x-1/2 items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-br from-[#42a8ed] via-[#0876c9] to-[#064a9b] shadow-[0_6px_15px_rgba(2,80,150,0.30),inset_0_2px_4px_rgba(255,255,255,0.30)] ring-[2px] ring-[#83d6b7]/65 dark:border-[#071828] dark:from-[#38bdf8] dark:via-[#087bb8] dark:to-[#06436e] dark:ring-[#5cc9ad]/60"
                >
                  <span className="absolute inset-[4px] rounded-full border border-white/20" />
                  <span className="absolute left-[9px] top-[7px] h-[15px] w-[25px] -rotate-[28deg] rounded-full bg-white/25 blur-[2px]" />
                  <motion.span
                    aria-hidden="true"
                    className="absolute -right-[1px] bottom-[6px] h-[15px] w-[15px] rounded-full border-[3px] border-[#6de0a9] border-l-transparent border-t-transparent"
                    animate={{ rotate: [0, 35, 0] }}
                    transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </motion.div>
              )}

              <motion.div
                animate={isActive
                  ? desktop ? { y: 0, scale: 1.04 } : { y: -24, scale: 1.04 }
                  : { y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 27, mass: 0.9 }}
                className={desktop
                  ? `relative z-10 ${
                      isActive ? 'text-[#0284c7] dark:text-[#38bdf8]' : 'text-[#527993] dark:text-[#7bb0cc] group-hover:text-[#0284c7] dark:group-hover:text-[#38bdf8]'
                    }`
                  : `relative z-10 flex h-6 items-center justify-center ${
                      isActive ? 'text-white' : 'text-[#527993] dark:text-[#7bb0cc] group-hover:text-[#0284c7] dark:group-hover:text-[#38bdf8]'
                    }`}
              >
                <AppIcon
                  name={tab.iconName}
                  size={20}
                  className={`w-5 h-5 object-contain ${!desktop && isActive ? 'brightness-0 invert' : ''}`}
                  alt={tab.labelKey}
                  fallback={tab.renderIcon(isActive)}
                />
              </motion.div>

              {/* Tab Label */}
              <span
                className={`${desktop ? "relative z-10 text-sm transition-all duration-200 leading-tight" : "relative z-10 text-[11px] transition-all duration-200 leading-tight"} ${
                  isActive
                    ? (desktop ? 'text-[#0284c7] dark:text-[#38bdf8] font-bold' : 'text-[#0a3b63] dark:text-[#d9f4ff] font-bold')
                    : 'text-[#527993] dark:text-[#7bb0cc] font-medium'
                }`}
              >
                {langDict[tab.labelKey]}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
