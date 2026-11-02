import React from 'react';
import { Piano, Mic, Flame, Target, BarChart2, Gamepad2, Music, Award } from 'lucide-react';
import { AppLanguage, AppTheme } from '../types/vocal';
import { translations } from '../utils/i18n';
import { haptics } from '../utils/haptics';
import { THEMES } from '../utils/theme';

export type ActiveTab = 'piano' | 'levels' | 'songMatch' | 'profiler' | 'games' | 'warmup' | 'trainer' | 'analytics';

interface NavigationProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  language?: AppLanguage;
  theme?: AppTheme;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onChangeTab, language = 'en', theme = 'classic-piano' }) => {
  const t = translations[language];
  const currentTheme = THEMES[theme] || THEMES['classic-piano'];
  const isLight = currentTheme.isLight;

  const navItems: Array<{ id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'piano', label: t.piano, icon: Piano },
    { id: 'levels', label: t.levels, icon: Award },
    { id: 'songMatch', label: t.songMatch, icon: Music },
    { id: 'profiler', label: t.profiler, icon: Mic },
    { id: 'games', label: t.games, icon: Gamepad2 },
    { id: 'warmup', label: t.warmup, icon: Flame },
    { id: 'trainer', label: t.trainer, icon: Target },
    { id: 'analytics', label: t.stats, icon: BarChart2 },
  ];

  const handleSelect = (tab: ActiveTab) => {
    haptics.tap();
    onChangeTab(tab);
  };

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-40 ${currentTheme.navBg} backdrop-blur-lg ${currentTheme.navBorder} px-1 py-1.5 safe-area-pb transition-colors duration-300 shadow-lg`}>
      <div className="max-w-lg mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-1.5 sm:px-2 rounded-2xl transition-all duration-150 relative active:scale-95 ${
                isActive
                  ? isLight
                    ? 'text-amber-800 font-bold'
                    : 'text-cyan-400 font-bold'
                  : isLight
                  ? 'text-slate-500 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition ${
                  isActive
                    ? isLight
                      ? 'bg-amber-500/20 text-amber-800 shadow-sm'
                      : 'bg-cyan-500/15 text-cyan-400 shadow-sm shadow-cyan-950/40'
                    : 'bg-transparent text-current'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[9px] sm:text-[10px] mt-0.5 tracking-tight font-medium">{item.label}</span>
              {isActive && (
                <div
                  className="absolute -bottom-1 w-3 h-0.5 rounded-full"
                  style={{ backgroundColor: currentTheme.accentColor }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
