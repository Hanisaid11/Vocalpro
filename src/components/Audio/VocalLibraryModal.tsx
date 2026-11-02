/**
 * VocalMaster Pro - Human Vocal Timbres Library Modal & Player
 * مكتبة الأصوات والنغمات البشرية الطبيعية
 */
import React, { useState } from 'react';
import { Volume2, Check, Sparkles, X, Play, Music, Mic2 } from 'lucide-react';
import { VocalSampleVowel, AppLanguage } from '../../types/vocal';
import { VOCAL_TIMBRE_LIBRARY, VocalTimbreInfo } from '../../utils/vocalLibrary';
import { audioEngine } from '../../audio/audioEngine';
import { haptics } from '../../utils/haptics';
import { translations } from '../../utils/i18n';

interface VocalLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: AppLanguage;
  currentVowel: VocalSampleVowel;
  onSelectVowel: (vowel: VocalSampleVowel) => void;
}

export const VocalLibraryModal: React.FC<VocalLibraryModalProps> = ({
  isOpen,
  onClose,
  language,
  currentVowel,
  onSelectVowel,
}) => {
  const [playingId, setPlayingId] = useState<VocalSampleVowel | null>(null);
  const [previewOctave, setPreviewOctave] = useState<number>(4);
  const isAr = language === 'ar';
  const t = translations[language];

  if (!isOpen) return null;

  const handleAudition = (item: VocalTimbreInfo, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    haptics.tap();
    setPlayingId(item.id);

    // Calculate MIDI note based on previewOctave (e.g. C3, C4, C5)
    const midi = (item.samplePitchMidi % 12) + (previewOctave + 1) * 12;
    audioEngine.playNote(midi, 1.8, 'vocal', item.id);

    setTimeout(() => {
      setPlayingId((prev) => (prev === item.id ? null : prev));
    }, 1800);
  };

  const handleApplyToPiano = (item: VocalTimbreInfo) => {
    haptics.success();
    audioEngine.setVocalVowel(item.id);
    audioEngine.setInstrument('vocal');
    onSelectVowel(item.id);
    handleAudition(item);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Mic2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{t.vocalLibraryTitle}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                  7 Timbres
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.vocalLibraryDesc}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audition Octave Bar */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Music className="w-3.5 h-3.5 text-cyan-400" />
            {isAr ? 'أوكتاف الاستماع والنغمات:' : 'Audition Octave:'}
          </span>
          <div className="flex items-center gap-1">
            {[3, 4, 5].map((oct) => (
              <button
                key={oct}
                onClick={() => {
                  haptics.tap();
                  setPreviewOctave(oct);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  previewOctave === oct
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Octave {oct} {oct === 3 ? (isAr ? '(جهير)' : '(Bass/Low)') : oct === 4 ? (isAr ? '(متوسط)' : '(Mid)') : (isAr ? '(عالي)' : '(High)')}
              </button>
            ))}
          </div>
        </div>

        {/* Timbres List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
          {VOCAL_TIMBRE_LIBRARY.map((item) => {
            const isCurrent = currentVowel === item.id;
            const isPlaying = playingId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleApplyToPiano(item)}
                className={`group p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer relative overflow-hidden ${
                  isCurrent
                    ? 'bg-gradient-to-r from-cyan-950/40 to-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-950/30'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                {/* Active Indicator Bar */}
                {isCurrent && (
                  <div className={`absolute top-0 bottom-0 ${isAr ? 'right-0' : 'left-0'} w-1.5 bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]`} />
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Vowel Symbol & Details */}
                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* Visual Icon Badge */}
                    <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 border transition ${
                      isCurrent
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-800/90 border-slate-700 text-slate-300 group-hover:border-slate-600'
                    }`}>
                      <span className="text-xl leading-none">{item.icon}</span>
                      <span className="text-[10px] font-black tracking-tighter mt-1 font-mono uppercase">
                        {isAr ? item.symbolAr : item.symbolEn}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm sm:text-base text-white">
                          {isAr ? item.nameAr : item.nameEn}
                        </h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          isCurrent
                            ? 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {isAr ? item.badgeAr : item.badgeEn}
                        </span>
                        {isCurrent && (
                          <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-semibold">
                            <Check className="w-3.5 h-3.5" />
                            {isAr ? 'مُفعّل على البيانو' : 'Active on Piano'}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-cyan-400/90 font-medium mt-0.5">
                        {isAr ? item.titleAr : item.titleEn}
                      </p>

                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed max-w-xl">
                        {isAr ? item.techniqueAr : item.techniqueEn}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleAudition(item, e)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border ${
                        isPlaying
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20 animate-pulse'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                      title={t.playVocalSample}
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${isPlaying ? 'animate-bounce' : ''}`} />
                      <span>{isPlaying ? (isAr ? 'استماع...' : 'Playing...') : t.playVocalSample}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyToPiano(item)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                        isCurrent
                          ? 'bg-cyan-500 text-slate-950 shadow-md'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                      }`}
                    >
                      {isCurrent ? (isAr ? 'محدد' : 'Selected') : t.setAsActiveVoice}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>
              {isAr
                ? 'جميع الأصوات مصممة بنموذج Formant Filters الصوتي البشري المتقدم وتستجيب فوراً لمفاتيح البيانو'
                : 'All vocal timbres use advanced human formant acoustic modeling and trigger instantly on piano keys'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
