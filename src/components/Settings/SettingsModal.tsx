import React, { useState } from 'react';
import { Sliders, X, Check, Volume2, Globe, Music, Smartphone, Shield, Zap, RefreshCw, Palette, Clock, Mic } from 'lucide-react';
import { AppSettings, saveAppSettings } from '../../utils/storage';
import { AppLanguage, NotationSystem, InstrumentType, AppTheme, VocalSampleVowel, NoteDurationBeat } from '../../types/vocal';
import { translations, INSTRUMENT_NAMES, NOTATION_OPTIONS } from '../../utils/i18n';
import { THEMES } from '../../utils/theme';
import { audioEngine } from '../../audio/audioEngine';
import { haptics } from '../../utils/haptics';
import { VOCAL_TIMBRE_LIBRARY } from '../../utils/vocalLibrary';
import { PIANO_SOURCES, PianoSoundSource } from '../../audio/pianoSoundManager';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [current, setCurrent] = useState<AppSettings>(settings);
  const [previewingInstrument, setPreviewingInstrument] = useState<InstrumentType | null>(null);
  const [previewingPianoSource, setPreviewingPianoSource] = useState<PianoSoundSource | null>(null);

  if (!isOpen) return null;

  const t = translations[current.language || 'en'];

  const handleChange = (partial: Partial<AppSettings>) => {
    const updated = { ...current, ...partial };
    setCurrent(updated);
    onUpdateSettings(updated);
    saveAppSettings(updated);

    if (partial.instrument) {
      audioEngine.setInstrument(partial.instrument);
    }
    if (partial.pianoSoundSource) {
      audioEngine.setPianoSource(partial.pianoSoundSource);
    }
  };

  const handleTestInstrument = async (inst: InstrumentType) => {
    haptics.tap();
    setPreviewingInstrument(inst);
    // Play test note (A3 or C4)
    await audioEngine.playTone(261.63, 1.2, inst);
    setPreviewingInstrument(null);
  };

  const handleTestPianoSource = async (sourceId: PianoSoundSource) => {
    haptics.tap();
    setPreviewingPianoSource(sourceId);
    audioEngine.setPianoSource(sourceId);
    handleChange({ pianoSoundSource: sourceId });
    await audioEngine.playTone(261.63, 1.2, 'piano', 60);
    setPreviewingPianoSource(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in select-none">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-5 md:p-6 shadow-2xl text-slate-100 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center border border-indigo-500/40">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{t.settingsTitle}</h2>
              <p className="text-xs text-slate-400">Audio synthesis, language, & display preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Language Toggle */}
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.languageLabel}</span>
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => {
                haptics.tap();
                handleChange({ language: 'en' });
              }}
              className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-semibold transition ${
                current.language === 'en'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <span>🇺🇸 English</span>
              {current.language === 'en' && <Check className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => {
                haptics.tap();
                handleChange({ language: 'ar' });
              }}
              className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-semibold transition ${
                current.language === 'ar'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <span>🇸🇦 العربية (Arabic)</span>
              {current.language === 'ar' && <Check className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* 2. Instrument Voice Selection */}
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t.instrumentLabel}</span>
            </label>
            <span className="text-[10px] text-slate-500">Tap speaker to audition tone</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {(Object.keys(INSTRUMENT_NAMES) as InstrumentType[]).map((key) => {
              const item = INSTRUMENT_NAMES[key];
              const isSelected = current.instrument === key;
              const isAuditioning = previewingInstrument === key;

              return (
                <div
                  key={key}
                  className={`p-2.5 rounded-2xl border flex items-center justify-between transition ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <button
                    onClick={() => {
                      haptics.tap();
                      handleChange({ instrument: key });
                    }}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <div className="font-bold text-xs text-slate-200">
                        {current.language === 'ar' ? item.ar : item.en}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {key === 'oud' ? 'Authentic resonance' : key === 'piano' ? 'Acoustic grand' : 'Synthesized timbre'}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleTestInstrument(key)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Audition Instrument Sound"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isAuditioning ? 'animate-bounce text-cyan-400' : ''}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2A. Real Piano Sound Engine & Multi-Source Samples */}
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <span>🎹</span>
              <span>{current.language === 'ar' ? 'مصدر نغمات البيانو (عينات واقعية)' : 'Piano Sound Engine & Source'}</span>
            </label>
            <span className="text-[10px] text-amber-400/80 font-mono">
              {current.language === 'ar' ? 'أستوديو حقيقي عالي النقاء' : 'Real Studio Samples'}
            </span>
          </div>

          <div className="flex flex-col gap-2 text-xs">
            {PIANO_SOURCES.map((src) => {
              const isSelected = (current.pianoSoundSource || 'yamaha-c5') === src.id;
              const isAuditioning = previewingPianoSource === src.id;

              return (
                <div
                  key={src.id}
                  className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2.5 transition ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-sm'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <button
                    onClick={() => {
                      haptics.tap();
                      handleChange({ pianoSoundSource: src.id });
                    }}
                    className="flex items-start gap-2.5 flex-1 text-left min-w-0"
                  >
                    <span className="text-xl shrink-0 mt-0.5">{src.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-200">
                          {current.language === 'ar' ? src.nameAr : src.nameEn}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800/80">
                          {src.badge}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                        {current.language === 'ar' ? src.descAr : src.descEn}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleTestPianoSource(src.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white transition shrink-0"
                    title={current.language === 'ar' ? 'استمع لعينة هذا البيانو' : 'Audition Piano Sound'}
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isAuditioning ? 'animate-bounce text-amber-400' : ''}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2B. Human Vocal Samples Formants (Aah / Ooh / Eee / Mmm / Brrr / Laa / Nay) */}
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.vocalLibraryTitle}</span>
            </label>
            <span className="text-[10px] text-cyan-400 font-mono">
              {current.language === 'ar' ? '7 خامات بشرية بنموذج رنين طبيعي' : '7 Acoustic Formant Timbres'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
            {VOCAL_TIMBRE_LIBRARY.map((item) => {
              const isSelected = (current.vocalVowel || 'aah') === item.id;
              const isAr = current.language === 'ar';
              return (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-xl border flex flex-col justify-between transition ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <button
                    onClick={() => {
                      haptics.tap();
                      handleChange({ vocalVowel: item.id, instrument: 'vocal' });
                      audioEngine.setVocalVowel(item.id);
                      audioEngine.setInstrument('vocal');
                      audioEngine.playTone(261.63, 1.4, 'vocal', undefined, item.id);
                    }}
                    className="flex flex-col items-start w-full text-left"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base">{item.icon}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <span className="text-xs font-bold mt-1.5 text-white">
                      {isAr ? item.symbolAr : item.symbolEn}
                    </span>
                    <span className="text-[10px] text-cyan-400 font-medium truncate w-full mt-0.5">
                      {isAr ? item.badgeAr : item.badgeEn}
                    </span>
                    <span className="text-[9px] text-slate-500 line-clamp-1 mt-0.5">
                      {isAr ? item.titleAr : item.titleEn}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2C. Note Duration (4, 2, or 1 beat lengths) */}
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.noteDurationBeatsLabel}</span>
            </label>
            <span className="text-[10px] text-slate-500 font-mono">
              {current.language === 'ar' ? 'طول رنين النغمة' : 'Sustain beat length'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            {[
              { beats: 4 as const, label: t.beats4, sec: '4s' },
              { beats: 2 as const, label: t.beats2, sec: '2s' },
              { beats: 1 as const, label: t.beats1, sec: '1s' },
            ].map((b) => {
              const isSelected = (current.noteDurationBeats || 2) === b.beats;
              return (
                <button
                  key={b.beats}
                  onClick={() => {
                    haptics.tap();
                    handleChange({ noteDurationBeats: b.beats });
                    audioEngine.setNoteDurationBeats(b.beats);
                    audioEngine.playTone(330, b.beats);
                  }}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-bold">{b.label}</span>
                  <span className="text-[10px] font-mono text-slate-500">({b.sec})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Note Naming System (C-D-E vs Do-Re-Mi vs دو-ري-مي) */}
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <span className="font-mono text-cyan-400 font-black">#♭</span>
            <span>{t.notationLabel}</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {(Object.keys(NOTATION_OPTIONS) as NotationSystem[]).map((key) => {
              const opt = NOTATION_OPTIONS[key];
              const isSelected = current.notation === key;

              return (
                <button
                  key={key}
                  onClick={() => {
                    haptics.tap();
                    handleChange({ notation: key });
                  }}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-bold">{current.language === 'ar' ? opt.ar : opt.en}</span>
                  <span className="text-[10px] text-slate-500 font-mono mt-1">{opt.example}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Visual Piano & App Themes (Light & Colorful) */}
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-pink-400" />
              <span>{t.themesLabel}</span>
            </label>
            <span className="text-[10px] text-pink-400 font-mono">
              {current.language === 'ar' ? 'ثيمات نهارية مشرقة وثيمات ملونة' : 'Light & Colorful Themes'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {(Object.keys(THEMES) as AppTheme[]).map((key) => {
              const th = THEMES[key];
              const isSelected = current.theme === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    haptics.tap();
                    handleChange({ theme: key });
                  }}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition ${
                    isSelected
                      ? 'bg-pink-500/20 border-pink-400 text-pink-200 font-bold shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span className="text-xl shrink-0">{th.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold truncate">
                        {current.language === 'ar' ? th.nameAr : th.nameEn}
                      </span>
                      {th.isLight ? (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                          {current.language === 'ar' ? 'مشرق ☀️' : 'Daylight ☀️'}
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full font-medium bg-slate-800 text-slate-400 shrink-0">
                          {key === 'vibrant-sunset' || key === 'emerald-mint'
                            ? current.language === 'ar'
                              ? 'ملون 🎨'
                              : 'Vivid 🎨'
                            : current.language === 'ar'
                            ? 'داكن 🌙'
                            : 'Dark 🌙'}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-pink-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Fullscreen behavior & Haptics */}
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3 text-xs">
          {/* Auto-Vertical Fullscreen Switch */}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-200 block">{t.autoVerticalFs}</span>
              <span className="text-[10px] text-slate-400">
                {current.language === 'ar'
                  ? 'يتحول البيانو تلقائياً للوضع الرأسي المحسن لشاشات الهواتف'
                  : 'Automatically layout keys bottom-to-top when entering fullscreen'}
              </span>
            </div>
            <input
              type="checkbox"
              checked={current.autoVerticalOnFullscreen}
              onChange={(e) => handleChange({ autoVerticalOnFullscreen: e.target.checked })}
              className="w-4 h-4 accent-cyan-400 rounded"
            />
          </div>

          {/* Haptic Feedback */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-900">
            <div>
              <span className="font-bold text-slate-200 block">{t.hapticFeedback}</span>
              <span className="text-[10px] text-slate-400">Vibration pulse when hitting correct pitch</span>
            </div>
            <input
              type="checkbox"
              checked={current.hapticFeedbackEnabled}
              onChange={(e) => handleChange({ hapticFeedbackEnabled: e.target.checked })}
              className="w-4 h-4 accent-cyan-400 rounded"
            />
          </div>

          {/* Screen Wake Lock */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-900">
            <div>
              <span className="font-bold text-slate-200 block">{t.keepScreenAwake}</span>
              <span className="text-[10px] text-slate-400">Prevents screen from dimming during singing</span>
            </div>
            <input
              type="checkbox"
              checked={current.keepScreenAwake}
              onChange={(e) => handleChange({ keepScreenAwake: e.target.checked })}
              className="w-4 h-4 accent-cyan-400 rounded"
            />
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg transition active:scale-98"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
};
