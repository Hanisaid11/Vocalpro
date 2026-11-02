import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Maximize2, Minimize2, Sliders, Volume2, Globe, Music, Palette, Mic2 } from 'lucide-react';
import { VocalRangeProfile, PitchDetectionResult, AppLanguage, NotationSystem, InstrumentType, AppTheme, VocalSampleVowel } from '../../types/vocal';
import { VerticalPiano } from './VerticalPiano';
import { HorizontalPiano } from './HorizontalPiano';
import { translations, INSTRUMENT_NAMES, NOTATION_OPTIONS } from '../../utils/i18n';
import { THEMES } from '../../utils/theme';
import { audioEngine } from '../../audio/audioEngine';
import { haptics } from '../../utils/haptics';
import { VocalLibraryModal } from '../Audio/VocalLibraryModal';
import { VOCAL_TIMBRE_LIBRARY } from '../../utils/vocalLibrary';
import { DetailedGuideModal } from '../Common/DetailedGuideModal';
import { InfoGuideButton } from '../Common/InfoGuideButton';
import { PIANO_SOURCES, PianoSoundSource } from '../../audio/pianoSoundManager';

interface PianoViewProps {
  profile: VocalRangeProfile;
  currentPitch: PitchDetectionResult | null;
  language?: AppLanguage;
  notation?: NotationSystem;
  instrument?: InstrumentType;
  theme?: AppTheme;
  autoVerticalOnFullscreen?: boolean;
  pianoSoundSource?: PianoSoundSource;
  onChangePianoSource?: (source: PianoSoundSource) => void;
  onSelectRangeProfile?: (profile: VocalRangeProfile) => void;
  targetMidi?: number | null;
  onChangeNotation?: (notation: NotationSystem) => void;
  onChangeInstrument?: (instrument: InstrumentType) => void;
  onChangeTheme?: (theme: AppTheme) => void;
  onOpenSettings?: () => void;
}

export const PianoView: React.FC<PianoViewProps> = ({
  profile,
  currentPitch,
  language = 'en',
  notation = 'english',
  instrument = 'piano',
  theme = 'classic-piano',
  autoVerticalOnFullscreen = true,
  pianoSoundSource,
  onChangePianoSource,
  onSelectRangeProfile,
  targetMidi,
  onChangeNotation,
  onChangeInstrument,
  onChangeTheme,
  onOpenSettings,
}) => {
  const t = translations[language];
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('horizontal'); // Default horizontal so the Real Piano photo layout is immediately front & center
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInstrumentMenu, setShowInstrumentMenu] = useState(false);
  const [showNotationMenu, setShowNotationMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [pianoSource, setPianoSource] = useState<PianoSoundSource>(pianoSoundSource || audioEngine.getPianoSource());
  const [showPianoSourceMenu, setShowPianoSourceMenu] = useState(false);
  const [vocalVowel, setVocalVowel] = useState<VocalSampleVowel>(audioEngine.getVocalVowel());
  const [showVocalLibraryModal, setShowVocalLibraryModal] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    if (pianoSoundSource) {
      setPianoSource(pianoSoundSource);
    }
  }, [pianoSoundSource]);

  // Monitor browser fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (isFs && autoVerticalOnFullscreen) {
        setOrientation('vertical');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [autoVerticalOnFullscreen]);

  const toggleFullscreen = async () => {
    haptics.tap();
    try {
      if (!document.fullscreenElement) {
        if (autoVerticalOnFullscreen) {
          setOrientation('vertical');
        }
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else {
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else {
          setIsFullscreen(false);
        }
      }
    } catch {
      setIsFullscreen((prev) => {
        const next = !prev;
        if (next && autoVerticalOnFullscreen) {
          setOrientation('vertical');
        }
        return next;
      });
    }
  };

  const handleSelectInstrument = (inst: InstrumentType) => {
    haptics.tap();
    audioEngine.setInstrument(inst);
    if (onChangeInstrument) {
      onChangeInstrument(inst);
    }
    setShowInstrumentMenu(false);
    audioEngine.playTone(440, 0.5);
  };

  const handleSelectPianoSource = async (sourceId: PianoSoundSource) => {
    haptics.tap();
    setPianoSource(sourceId);
    audioEngine.setPianoSource(sourceId);
    if (onChangePianoSource) {
      onChangePianoSource(sourceId);
    }
    setShowPianoSourceMenu(false);
    // Audition middle C note with the newly selected source
    await audioEngine.playTone(261.63, 1.2, 'piano', 60);
  };

  const handleSelectNotation = (not: NotationSystem) => {
    haptics.tap();
    if (onChangeNotation) {
      onChangeNotation(not);
    }
    setShowNotationMenu(false);
  };

  const handleSelectTheme = (th: AppTheme) => {
    haptics.tap();
    if (onChangeTheme) {
      onChangeTheme(th);
    }
    setShowThemeMenu(false);
  };

  const activePianoSourceObj = PIANO_SOURCES.find((s) => s.id === pianoSource) || PIANO_SOURCES[0];
  const currentTheme = THEMES[theme] || THEMES['classic-piano'];
  const isLight = currentTheme.isLight;

  return (
    <div className={`flex flex-col gap-2.5 ${isFullscreen ? `fixed inset-0 z-50 ${currentTheme.appBg} p-2` : ''}`}>
      {/* Top Layout & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        {/* Left: Quick instrument, notation, & theme pills */}
        <div className="flex items-center gap-1.5 relative">
          {/* Instrument Pill */}
          <div className="relative">
            <button
              onClick={() => {
                setShowInstrumentMenu(!showInstrumentMenu);
                setShowPianoSourceMenu(false);
                setShowNotationMenu(false);
                setShowThemeMenu(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition shadow-sm ${
                isLight
                  ? 'bg-white hover:bg-amber-50/80 border-amber-200/80 text-slate-800'
                  : 'bg-slate-900 border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800'
              }`}
              title={t.instrumentLabel}
            >
              <span>{INSTRUMENT_NAMES[instrument]?.icon}</span>
              <span className="font-semibold text-[11px] hidden sm:inline">
                {INSTRUMENT_NAMES[instrument]?.[language]}
              </span>
            </button>

            {showInstrumentMenu && (
              <div className="absolute top-full mt-1.5 left-0 z-50 w-56 bg-slate-900 border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 px-2.5 py-1 border-b border-slate-800">
                  {t.instrumentLabel}
                </div>
                {(Object.keys(INSTRUMENT_NAMES) as InstrumentType[]).map((instKey) => {
                  const inst = INSTRUMENT_NAMES[instKey];
                  const isSelected = instrument === instKey;
                  return (
                    <button
                      key={instKey}
                      onClick={() => handleSelectInstrument(instKey)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-left transition ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="text-base">{inst.icon}</span>
                      <span className="flex-1">{inst[language]}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                    </button>
                  );
                })}

                {instrument === 'vocal' && (
                  <div className="mt-2 pt-2 border-t border-slate-800 px-1 pb-1">
                    <div className="text-[10px] uppercase font-bold text-cyan-400 mb-1.5 flex items-center justify-between">
                      <span>{language === 'ar' ? 'خامة الصوت البشري' : 'Human Vocal Timbre'}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowInstrumentMenu(false);
                          setShowVocalLibraryModal(true);
                        }}
                        className="text-[9px] text-cyan-400 underline hover:text-cyan-300"
                      >
                        {language === 'ar' ? 'المكتبة كاملة ↗' : 'All Timbres ↗'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto pr-0.5">
                      {VOCAL_TIMBRE_LIBRARY.map((item) => (
                        <button
                          key={item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            haptics.tap();
                            setVocalVowel(item.id);
                            audioEngine.setVocalVowel(item.id);
                            audioEngine.playTone(440, 0.8, 'vocal', undefined, item.id);
                          }}
                          className={`py-1.5 px-2 rounded-lg text-[10px] font-bold text-left flex items-center justify-between border transition ${
                            vocalVowel === item.id
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <span>{item.icon}</span>
                            <span className="truncate">{language === 'ar' ? item.symbolAr : item.symbolEn}</span>
                          </span>
                          {vocalVowel === item.id && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Piano Sound Source Picker (Yamaha C5, Steinway, MusyngKite, Physical Synth) */}
          {instrument === 'piano' && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowPianoSourceMenu(!showPianoSourceMenu);
                  setShowInstrumentMenu(false);
                  setShowNotationMenu(false);
                  setShowThemeMenu(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-500/50 text-xs text-amber-200 hover:text-white hover:border-amber-400 transition shadow-sm"
                title={language === 'ar' ? 'مصدر صوت نغمات البيانو' : 'Piano Sound Engine Source'}
              >
                <span>{activePianoSourceObj.icon}</span>
                <span className="font-bold text-[11px] max-w-[120px] sm:max-w-none truncate">
                  {language === 'ar'
                    ? activePianoSourceObj.nameAr.split('(')[0].trim()
                    : activePianoSourceObj.nameEn.split('(')[0].trim()}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono hidden md:inline border border-amber-500/30">
                  {activePianoSourceObj.badge}
                </span>
              </button>

              {showPianoSourceMenu && (
                <div className="absolute top-full mt-1.5 left-0 z-50 w-72 sm:w-80 bg-slate-900/95 border border-amber-500/50 rounded-2xl p-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 px-1">
                    <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                      <span>🎹</span>
                      <span>{language === 'ar' ? 'اختر خامة ونقاء صوت البيانو' : 'Select Piano Sound Engine'}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {language === 'ar' ? 'انقر للاستماع' : 'Tap to audition'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {PIANO_SOURCES.map((src) => {
                      const isSelected = pianoSource === src.id;
                      return (
                        <button
                          key={src.id}
                          onClick={() => handleSelectPianoSource(src.id)}
                          className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition ${
                            isSelected
                              ? 'bg-amber-500/20 border border-amber-400 text-white shadow-sm'
                              : 'bg-slate-800/70 border border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <span className="text-xl shrink-0 mt-0.5">{src.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs text-amber-200 truncate">
                                {language === 'ar' ? src.nameAr : src.nameEn}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-950 text-amber-300 border border-amber-800 shrink-0">
                                {src.badge}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                              {language === 'ar' ? src.descAr : src.descEn}
                            </p>
                          </div>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notation Pill */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotationMenu(!showNotationMenu);
                setShowInstrumentMenu(false);
                setShowPianoSourceMenu(false);
                setShowThemeMenu(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition shadow-sm ${
                isLight
                  ? 'bg-white hover:bg-indigo-50/80 border-indigo-200/80 text-slate-800'
                  : 'bg-slate-900 border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800'
              }`}
              title={t.notationLabel}
            >
              <Music className={`w-3.5 h-3.5 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`} />
              <span className="font-semibold text-[11px]">
                {notation === 'english' ? 'C D E' : notation === 'solfege' ? 'Do Re Mi' : 'دو ري مي'}
              </span>
            </button>

            {showNotationMenu && (
              <div className="absolute top-full mt-1.5 left-0 z-50 w-56 bg-slate-900 border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 px-2.5 py-1 border-b border-slate-800">
                  {t.notationLabel}
                </div>
                {(Object.keys(NOTATION_OPTIONS) as NotationSystem[]).map((notKey) => {
                  const not = NOTATION_OPTIONS[notKey];
                  const isSelected = notation === notKey;
                  return (
                    <button
                      key={notKey}
                      onClick={() => handleSelectNotation(notKey)}
                      className={`w-full flex flex-col items-start px-2.5 py-2 rounded-xl text-xs text-left transition ${
                        isSelected
                          ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{not[language]}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 mt-0.5">{not.example}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Theme Pill */}
          <div className="relative">
            <button
              onClick={() => {
                setShowThemeMenu(!showThemeMenu);
                setShowInstrumentMenu(false);
                setShowPianoSourceMenu(false);
                setShowNotationMenu(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition shadow-sm ${
                isLight
                  ? 'bg-white hover:bg-pink-50/80 border-pink-200/80 text-slate-800'
                  : 'bg-slate-900 border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800'
              }`}
              title={t.themesLabel}
            >
              <Palette className={`w-3.5 h-3.5 ${isLight ? 'text-pink-600' : 'text-pink-400'}`} />
              <span className="font-semibold text-[11px] hidden sm:inline">
                {THEMES[theme]?.[language === 'ar' ? 'nameAr' : 'nameEn']}
              </span>
            </button>

            {showThemeMenu && (
              <div className="absolute top-full mt-1.5 left-0 z-50 w-72 sm:w-80 bg-slate-900 border border-slate-700/80 rounded-2xl p-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-1 max-h-80 overflow-y-auto">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 px-1">
                  <div className="text-[11px] font-bold text-pink-400 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" />
                    <span>{t.themesLabel}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {language === 'ar' ? 'ثيمات نهارية وملونة' : 'Light & Colorful'}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {(Object.keys(THEMES) as AppTheme[]).map((themeKey) => {
                    const th = THEMES[themeKey];
                    const isSelected = theme === themeKey;
                    return (
                      <button
                        key={themeKey}
                        onClick={() => handleSelectTheme(themeKey)}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs text-left transition ${
                          isSelected
                            ? 'bg-pink-500/20 text-pink-200 font-bold border border-pink-400/50 shadow-sm'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="text-xl shrink-0">{th.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate">{language === 'ar' ? th.nameAr : th.nameEn}</span>
                            {th.isLight ? (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                                {language === 'ar' ? 'مشرق ☀️' : 'Light ☀️'}
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-medium bg-slate-800 text-slate-400 shrink-0">
                                {themeKey === 'vibrant-sunset' || themeKey === 'emerald-mint'
                                  ? language === 'ar'
                                    ? 'ملون 🎨'
                                    : 'Vivid 🎨'
                                  : language === 'ar'
                                  ? 'داكن 🌙'
                                  : 'Dark 🌙'}
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Human Vocal Library Quick Button */}
          <button
            onClick={() => {
              haptics.tap();
              setShowVocalLibraryModal(true);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition shadow-sm ${
              instrument === 'vocal'
                ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border-cyan-500/60 text-cyan-300 shadow-cyan-950/40'
                : isLight
                ? 'bg-white hover:bg-cyan-50/80 border-cyan-200/80 text-slate-800'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title={t.vocalLibraryTitle}
          >
            <Mic2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-bold">
              {language === 'ar' ? 'مكتبة الأصوات البشرية' : 'Vocal Library'}
            </span>
            {instrument === 'vocal' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-cyan-500 text-slate-950 font-black uppercase font-mono">
                {vocalVowel}
              </span>
            )}
          </button>

          {/* Detailed Piano & Pitch Lab Guide Button */}
          <InfoGuideButton
            onClick={() => setIsGuideOpen(true)}
            title={language === 'ar' ? 'معلومات بيانو التدريب التفاعلي' : 'Interactive Piano Guide'}
            size="md"
          />
        </div>

        {/* Right: Layout switcher (Vertical vs Horizontal) + Fullscreen */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Orientation switch */}
          <div className={`flex p-0.5 rounded-xl border text-xs ${isLight ? 'bg-white border-amber-200/80 shadow-sm' : 'bg-slate-900 border-slate-800'}`}>
            <button
              onClick={() => {
                haptics.tap();
                setOrientation('horizontal');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition ${
                orientation === 'horizontal'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={t.horizontalPiano}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="text-[11px]">{language === 'ar' ? 'أفقي (صورة البيانو)' : 'Horizontal'}</span>
            </button>
            <button
              onClick={() => {
                haptics.tap();
                setOrientation('vertical');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition ${
                orientation === 'vertical'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={t.verticalPiano}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="text-[11px]">{language === 'ar' ? 'رأسي (أندرويد)' : 'Vertical'}</span>
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition shadow-sm ${
              isFullscreen
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : isLight
                ? 'bg-white border-amber-200/80 text-slate-700 hover:bg-amber-50 hover:text-slate-900'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title={isFullscreen ? t.exitFullscreen : t.fullscreen}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline text-[11px]">{isFullscreen ? t.exitFullscreen : t.fullscreen}</span>
          </button>

          {/* Settings shortcut */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className={`p-1.5 rounded-xl border transition shadow-sm ${
                isLight
                  ? 'bg-white border-amber-200/80 text-slate-700 hover:bg-amber-50 hover:text-slate-900'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={t.settings}
              aria-label={t.settings}
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Render Active Layout */}
      {orientation === 'vertical' ? (
        <VerticalPiano
          profile={profile}
          currentPitch={currentPitch}
          language={language}
          notation={notation}
          theme={theme}
          onSelectRangeProfile={onSelectRangeProfile}
          targetMidi={targetMidi}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />
      ) : (
        <HorizontalPiano
          profile={profile}
          currentPitch={currentPitch}
          language={language}
          notation={notation}
          theme={theme}
          onSelectRangeProfile={onSelectRangeProfile}
        />
      )}

      {/* Human Vocal Timbres Library Modal */}
      <VocalLibraryModal
        isOpen={showVocalLibraryModal}
        onClose={() => setShowVocalLibraryModal(false)}
        language={language}
        currentVowel={vocalVowel}
        onSelectVowel={(newVowel) => {
          setVocalVowel(newVowel);
          if (onChangeInstrument) {
            onChangeInstrument('vocal');
          }
        }}
      />

      {/* Detailed Physiological & Acoustic Guide Modal */}
      <DetailedGuideModal
        guideId="section_piano"
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        language={language}
      />
    </div>
  );
};
