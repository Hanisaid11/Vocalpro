import React from 'react';
import { Mic, MicOff, Cloud, Sliders, Music, Globe, BookOpen, Maximize, Minimize } from 'lucide-react';
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
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
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
  onToggleFullscreen,
  isFullscreen = false,
  language = 'ar',
  notation = 'arabic',
  theme = 'classic-piano',
}) => {
  const t = translations[language] || translations.en;
  const currentTheme = THEMES[theme] || THEMES['classic-piano'];
  const isLight = currentTheme.isLight;

  return (
    <header className={`sticky top-0 z-40 ${currentTheme.headerBg} backdrop-blur-md ${currentTheme.headerBorder} px-2 sm:px-4 py-2 transition-colors duration-300 w-full max-w-full overflow-hidden box-border`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2 w-full">
        {/* Left: Compact Music Icon (Brand Name removed per user request) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-pink-500 p-[1.5px] shadow-md shadow-indigo-950/30 shrink-0">
            <div className={`w-full h-full ${isLight ? 'bg-white text-indigo-600' : 'bg-[#090d16] text-cyan-400'} rounded-xl flex items-center justify-center transition-colors`}>
              <Music className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Center: Range Badge (clickable to calibrate, visible on tablet/desktop) */}
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

        {/* Right actions: Info Guide, Theory, Language, Fullscreen, APK, Settings, Metronome, Master Mic */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Quick Section Educational Guide (i) Button */}
          {onOpenSectionGuide && (
            <InfoGuideButton
              onClick={onOpenSectionGuide}
              title={language === 'ar' ? 'معلومات وتفاصيل هذا القسم' : 'Section Information'}
              size="sm"
            />
          )}

          {/* Quick Music Theory Lessons Button */}
          {onOpenTheory && (
            <button
              onClick={() => {
                haptics.tap();
                onOpenTheory();
              }}
              className={`flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl ${
                isLight
                  ? 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-800 shadow-sm'
                  : 'bg-indigo-950/70 border-indigo-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white shadow-sm'
              } border transition text-xs font-semibold active:scale-95 shrink-0`}
              title={language === 'ar' ? 'أكاديمية قراءة النوتة الموسيقية والنظريات' : 'Music Theory Lessons'}
              aria-label="Music Theory Lessons"
            >
              <BookOpen className={`w-3.5 h-3.5 ${isLight ? 'text-indigo-600' : 'text-cyan-400'}`} />
              <span className="text-[11px] font-bold hidden sm:inline">
                {language === 'ar' ? 'دروس النوتة' : 'Theory'}
              </span>
            </button>
          )}

          {/* Fullscreen Edge-to-Edge Toggle Button */}
          {onToggleFullscreen && (
            <button
              onClick={() => {
                haptics.tap();
                onToggleFullscreen();
              }}
              className={`p-1.5 sm:p-2 rounded-xl border transition shrink-0 ${
                isFullscreen
                  ? 'bg-pink-600/20 border-pink-500 text-pink-400 shadow-sm'
                  : isLight
                  ? 'bg-white hover:bg-amber-50/80 border-amber-200/80 text-slate-700 hover:text-slate-900 shadow-sm'
                  : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white shadow-sm'
              }`}
              title={
                language === 'ar'
                  ? isFullscreen
                    ? 'الخروج من ملء الشاشة'
                    : 'وضع ملء الشاشة وتجربة التطبيق'
                  : isFullscreen
                  ? 'Exit Fullscreen'
                  : 'Immersive Fullscreen'
              }
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <Minimize className="w-3.5 h-3.5 text-pink-400" />
              ) : (
                <Maximize className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Quick Language Toggle */}
          {onToggleLanguage && (
            <button
              onClick={() => {
                haptics.tap();
                onToggleLanguage();
              }}
              className={`flex items-center gap-1 p-1.5 sm:px-2 sm:py-1.5 rounded-xl ${
                isLight
                  ? 'bg-white hover:bg-amber-50/80 border-amber-200/80 text-slate-800 shadow-sm'
                  : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white'
              } border transition text-xs font-semibold shrink-0`}
              title={language === 'en' ? 'التحويل إلى اللغة العربية' : 'Switch to English'}
              aria-label="Toggle Language"
            >
              <Globe className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-cyan-400'}`} />
              <span className="text-[10px] font-bold font-mono">
                {language === 'en' ? 'ع' : 'EN'}
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
              className={`p-1.5 sm:p-2 rounded-xl ${
                isLight
                  ? 'bg-white hover:bg-amber-50/80 border-amber-200/80 text-slate-700 hover:text-slate-900 shadow-sm'
                  : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white shadow-sm'
              } border transition shrink-0`}
              title={t.settingsTitle}
              aria-label={t.settings}
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Cloud Sync Button (Desktop/Tablet) */}
          <button
            onClick={() => {
              haptics.tap();
              onOpenSync();
            }}
            className={`hidden sm:flex p-2 rounded-xl ${
              isLight
                ? 'bg-white hover:bg-amber-50/80 border-amber-200/80 text-indigo-600 shadow-sm'
                : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white shadow-sm'
            } border transition shrink-0`}
            title={t.cloudSync}
            aria-label={t.cloudSync}
          >
            <Cloud className={`w-4 h-4 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`} />
          </button>

          {/* Global Metronome & Tempo Pacing Toggle */}
          <GlobalMetronomeHeaderToggle language={language} className="shrink-0" />

          {/* Master Microphone Button */}
          <button
            onClick={() => {
              haptics.tap();
              onToggleMic();
            }}
            className={`flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition shadow-md active:scale-95 shrink-0 ${
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
                <Mic className="w-3.5 h-3.5 animate-pulse text-white" />
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
