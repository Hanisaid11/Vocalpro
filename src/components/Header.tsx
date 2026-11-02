import React from 'react';
import { Mic, MicOff, Cloud, Sliders, Music, Globe, BookOpen } from 'lucide-react';
import { VocalRangeProfile, PitchDetectionResult, AppLanguage, NotationSystem, AppTheme } from '../types/vocal';
import { translations } from '../utils/i18n';
import { formatNoteName } from '../utils/noteUtils';
import { haptics } from '../utils/haptics';
import { GlobalMetronomeHeaderToggle } from './Audio/GlobalMetronomeHeaderToggle';
import { InfoGuideButton } from './Common/InfoGuideButton';
import { THEMES } from '../utils/theme';

interface HeaderProps {
  profile: VocalRangeProfile;
  isListening: boolean;
  onToggleMic: () => void;
  onOpenSync: () => void;
  onOpenProfiler: () => void;
  onOpenSettings?: () => void;
  onToggleLanguage?: () => void;
  onOpenTheory?: () => void;
  onOpenSectionGuide?: () => void;
  language?: AppLanguage;
  notation?: NotationSystem;
  theme?: AppTheme;
  currentPitch: PitchDetectionResult | null;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  isListening,
  onToggleMic,
  onOpenSync,
  onOpenProfiler,
  onOpenSettings,
  onToggleLanguage,
  onOpenTheory,
  onOpenSectionGuide,
  language = 'ar',
  notation = 'arabic',
  theme = 'classic-piano',
}) => {
  const t = translations[language] || translations.en;
  const currentTheme = THEMES[theme] || THEMES['classic-piano'];
  const isLight = currentTheme.isLight;

  return (
    <header className={`sticky top-0 z-40 ${currentTheme.headerBg} backdrop-blur-md ${currentTheme.headerBorder} px-3 sm:px-4 py-2.5 transition-colors duration-300`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-pink-500 p-[1.5px] shadow-lg shadow-indigo-950/30 shrink-0">
            <div className={`w-full h-full ${isLight ? 'bg-white text-indigo-600' : 'bg-[#090d16] text-cyan-400'} rounded-2xl flex items-center justify-center transition-colors`}>
              <Music className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className={`text-sm font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'} flex items-center gap-1`}>
                <span>{t.appName}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isLight ? 'bg-amber-500/20 text-amber-800 border border-amber-400/40' : 'bg-indigo-600/40 text-indigo-300 border border-indigo-500/30'} font-extrabold`}>PRO</span>
              </h1>
            </div>
            <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'} hidden sm:block`}>{t.appTagline}</p>
          </div>
        </div>

        {/* Center: Range Badge (clickable to calibrate) */}
        <button
          onClick={() => {
            haptics.tap();
            onOpenProfiler();
          }}
          className={`hidden md:flex items-center gap-2 px-3 py-1 ${
            isLight
              ? 'bg-white hover:bg-amber-50/80 border-amber-200/80 text-slate-800 shadow-sm'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
          } border rounded-xl text-xs transition`}
          title={t.voiceProfilerDesc}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentTheme.accentColor }} />
          <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{profile.voiceType}</span>
          <span className={`font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'} text-[11px]`} dir="ltr">
            ({formatNoteName(profile.lowestNote, notation)} – {formatNoteName(profile.highestNote, notation)})
          </span>
        </button>

        {/* Right actions: Language toggle, Settings, Cloud Sync, Master Mic */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Section Educational Guide (i) Button */}
          {onOpenSectionGuide && (
            <InfoGuideButton
              onClick={onOpenSectionGuide}
              title={language === 'ar' ? 'معلومات وتفاصيل هذا القسم' : 'Section Information'}
              size="md"
            />
          )}

          {/* Quick Music Theory Lessons Button */}
          {onOpenTheory && (
            <button
              onClick={() => {
                haptics.tap();
                onOpenTheory();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl ${
                isLight
                  ? 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-800 shadow-sm'
                  : 'bg-indigo-950/70 border-indigo-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white shadow-sm'
              } border transition text-xs font-semibold active:scale-95`}
              title={language === 'ar' ? 'أكاديمية قراءة النوتة الموسيقية والنظريات' : 'Music Theory Lessons'}
              aria-label="Music Theory Lessons"
            >
              <BookOpen className={`w-3.5 h-3.5 ${isLight ? 'text-indigo-600' : 'text-cyan-400'}`} />
              <span className="text-[11px] font-bold hidden sm:inline">
                {language === 'ar' ? 'دروس النوتة' : 'Theory'}
              </span>
            </button>
          )}

          {/* Quick Language Toggle */}
          {onToggleLanguage && (
            <button
              onClick={() => {
                haptics.tap();
                onToggleLanguage();
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl ${
                isLight
                  ? 'bg-white hover:bg-amber-50/80 border-amber-200/80 text-slate-800 shadow-sm'
                  : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white'
              } border transition text-xs font-semibold`}
              title={language === 'en' ? 'التحويل إلى اللغة العربية' : 'Switch to English'}
              aria-label="Toggle Language"
            >
              <Globe className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-cyan-400'}`} />
              <span className="text-[11px] font-bold font-mono">
                {language === 'en' ? 'عربي' : 'EN'}
              </span>
            </button>
          )}

          {/* Settings Modal Button */}
          {onOpenSettings && (
            <button
              onClick={() => {
                haptics.tap();
                onOpenSettings();
              }}
              className={`p-2 rounded-xl ${
                isLight
                  ? 'bg-white hover:bg-amber-50/80 border-amber-200/80 text-slate-700 hover:text-slate-900 shadow-sm'
                  : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white shadow-sm'
              } border transition`}
              title={t.settingsTitle}
              aria-label={t.settings}
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}

          {/* Cloud Sync Button */}
          <button
            onClick={() => {
              haptics.tap();
              onOpenSync();
            }}
            className={`p-2 rounded-xl ${
              isLight
                ? 'bg-white hover:bg-amber-50/80 border-amber-200/80 text-indigo-600 shadow-sm'
                : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white shadow-sm'
            } border transition`}
            title={t.cloudSync}
            aria-label={t.cloudSync}
          >
            <Cloud className={`w-4 h-4 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`} />
          </button>

          {/* Global Metronome & Tempo Pacing Toggle */}
          <GlobalMetronomeHeaderToggle language={language} />

          {/* Master Microphone Button */}
          <button
            onClick={() => {
              haptics.tap();
              onToggleMic();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-md active:scale-95 ${
              isListening
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60 ring-2 ring-emerald-400/30'
                : isLight
                ? 'bg-white hover:bg-amber-50/80 text-slate-700 border border-amber-200/80 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            aria-label={isListening ? 'Mute Microphone' : 'Enable Microphone'}
          >
            {isListening ? (
              <>
                <Mic className="w-3.5 h-3.5 animate-pulse" />
                <span className="hidden sm:inline">{t.micActive}</span>
              </>
            ) : (
              <>
                <MicOff className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">{t.enableMic}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
