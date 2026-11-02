import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Play, Square, ChevronLeft, ChevronRight, Mic, Target } from 'lucide-react';
import { NoteInfo, VocalRangeProfile, PitchDetectionResult, AppLanguage, NotationSystem, AppTheme } from '../../types/vocal';
import { midiToNoteInfo, formatNoteName } from '../../utils/noteUtils';
import { audioEngine } from '../../audio/audioEngine';
import { translations } from '../../utils/i18n';
import { THEMES } from '../../utils/theme';
import { haptics } from '../../utils/haptics';

interface HorizontalPianoProps {
  profile: VocalRangeProfile;
  currentPitch: PitchDetectionResult | null;
  language?: AppLanguage;
  notation?: NotationSystem;
  theme?: AppTheme;
  onSelectRangeProfile?: (profile: VocalRangeProfile) => void;
}

export const HorizontalPiano: React.FC<HorizontalPianoProps> = ({
  profile,
  currentPitch,
  language = 'ar',
  notation = 'arabic',
  theme = 'classic-piano',
}) => {
  const t = translations[language] || translations.en;
  const isAr = language === 'ar';
  const themeConfig = THEMES[theme] || THEMES['classic-piano'];

  const containerRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLDivElement>(null);

  const [viewCompass, setViewCompass] = useState<'my_range' | 'full_88'>('my_range');
  const [keyWidth, setKeyWidth] = useState<number>(48);
  const [activeMidiNotes, setActiveMidiNotes] = useState<Set<number>>(new Set());
  const [scrollProgress, setScrollProgress] = useState<number>(0.35);
  const [visibleRatio, setVisibleRatio] = useState<number>(0.2);

  const [noteDuration, setNoteDuration] = useState<number>(audioEngine.getNoteDuration());

  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [recordedCount, setRecordedCount] = useState(0);

  const full88Keys = useMemo(() => {
    const list: NoteInfo[] = [];
    for (let m = 21; m <= 108; m++) {
      list.push(midiToNoteInfo(m));
    }
    return list;
  }, []);

  const activeCompass = useMemo(() => {
    if (viewCompass === 'full_88') return full88Keys;
    const minMidi = Math.max(21, profile.lowestNote.midi - 1);
    const maxMidi = Math.min(108, profile.highestNote.midi + 1);
    return full88Keys.filter((n) => n.midi >= minMidi && n.midi <= maxMidi);
  }, [full88Keys, profile, viewCompass]);

  const whiteKeys = useMemo(() => {
    return activeCompass.filter((note) => !note.name.includes('#'));
  }, [activeCompass]);

  useEffect(() => {
    const unsub = audioEngine.subscribeRecording((rec, play, count) => {
      setIsRecording(rec);
      setIsPlayingRecording(play);
      setRecordedCount(count);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      if (viewCompass === 'my_range') {
        containerRef.current.scrollLeft = 0;
        updateScrollMetrics();
      } else {
        const middleMidi = profile.middleRegisterNote?.midi || 60;
        const whiteKeyIndex = whiteKeys.findIndex((k) => k.midi >= middleMidi);
        if (whiteKeyIndex !== -1) {
          const scrollTarget = Math.max(0, whiteKeyIndex * keyWidth - containerRef.current.clientWidth / 2 + keyWidth);
          containerRef.current.scrollLeft = scrollTarget;
          updateScrollMetrics();
        }
      }
    }
  }, [keyWidth, viewCompass]);

  const updateScrollMetrics = () => {
    if (!containerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    const maxScroll = Math.max(1, scrollWidth - clientWidth);
    const progress = Math.max(0, Math.min(1, scrollLeft / maxScroll));
    setScrollProgress(progress);
    setVisibleRatio(Math.min(1, clientWidth / scrollWidth));
  };

  const scrollByDelta = (semitones: number) => {
    haptics.tap();
    if (!containerRef.current) return;
    const targetScroll = containerRef.current.scrollLeft + semitones * keyWidth;
    containerRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
  };

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!minimapRef.current || !containerRef.current) return;
    const rect = minimapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const maxScroll = containerRef.current.scrollWidth - containerRef.current.clientWidth;
    containerRef.current.scrollTo({ left: ratio * maxScroll, behavior: 'smooth' });
  };

  const handlePlayNote = async (midi: number) => {
    haptics.tap();
    setActiveMidiNotes((prev) => new Set(prev).add(midi));
    audioEngine.playNote(midi, 2.0);

    setTimeout(() => {
      setActiveMidiNotes((prev) => {
        const next = new Set(prev);
        next.delete(midi);
        return next;
      });
    }, 280);
  };

  const isPointerDownRef = useRef(false);
  const lastSwipedMidiRef = useRef<number | null>(null);

  const handlePointerDown = (midi: number) => {
    isPointerDownRef.current = true;
    lastSwipedMidiRef.current = midi;
    handlePlayNote(midi);
  };

  const handlePointerEnter = (midi: number) => {
    if (isPointerDownRef.current && lastSwipedMidiRef.current !== midi) {
      lastSwipedMidiRef.current = midi;
      handlePlayNote(midi);
    }
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
    lastSwipedMidiRef.current = null;
  };

  const handleContainerPointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const keyEl = el?.closest('[data-midi]');
    if (keyEl) {
      const midiAttr = keyEl.getAttribute('data-midi');
      if (midiAttr) {
        const midi = parseInt(midiAttr, 10);
        if (!isNaN(midi) && lastSwipedMidiRef.current !== midi) {
          lastSwipedMidiRef.current = midi;
          handlePlayNote(midi);
        }
      }
    }
  };

  const isInVocalRange = (midi: number) => {
    return midi >= profile.lowestNote.midi && midi <= profile.highestNote.midi;
  };

  const isSungNote = (midi: number) => {
    return currentPitch?.note?.midi === midi && (currentPitch.clarity ?? 0) > 0.65;
  };

  const handleJumpToMidi = (targetMidi: number) => {
    haptics.tap();
    if (!containerRef.current) return;
    const idx = whiteKeys.findIndex((k) => k.midi >= targetMidi);
    if (idx !== -1) {
      const targetScroll = Math.max(0, idx * keyWidth - containerRef.current.clientWidth / 2 + keyWidth / 2);
      containerRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden select-none">
      {/* Top Controls Bar */}
      <div
        className={`p-2 sm:p-2.5 ${themeConfig.topBarBg} border-b ${themeConfig.topBarBorder} flex items-center justify-between gap-1 sm:gap-2.5 text-xs`}
        dir="ltr"
      >
        <button
          onClick={() => scrollByDelta(-7)}
          aria-label="Scroll Piano Left"
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-slate-700 to-slate-900 border border-slate-600 text-slate-100 flex items-center justify-center hover:scale-105 active:scale-95 transition shadow shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Record Keys Button */}
        <button
          onClick={() => {
            haptics.tap();
            if (isRecording) {
              audioEngine.stopRecording();
            } else {
              audioEngine.startRecording();
            }
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition shadow text-xs font-bold shrink-0 ${
            isRecording
              ? 'bg-rose-950 border-rose-500 text-rose-300 ring-2 ring-rose-500/40 animate-pulse'
              : 'bg-gradient-to-b from-slate-800 to-slate-950 border-slate-700 text-slate-200 hover:text-white'
          }`}
          title={isRecording ? t.stopRecording : t.recordKeys}
        >
          <div className="relative flex items-center justify-center">
            <div className={`w-3.5 h-3.5 rounded-full ${isRecording ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-red-800'}`} />
            {isRecording && <div className="absolute w-3.5 h-3.5 rounded-full bg-red-400 animate-ping" />}
          </div>
          <span className="hidden md:inline">{isRecording ? t.recording : t.recordKeys}</span>
          {recordedCount > 0 && (
            <span className="font-mono text-[10px] text-amber-300">({recordedCount})</span>
          )}
        </button>

        {/* Play Button */}
        <button
          onClick={() => {
            haptics.tap();
            if (isPlayingRecording) {
              audioEngine.stopPlayback();
            } else {
              audioEngine.playBackRecording();
            }
          }}
          disabled={recordedCount === 0 && !isPlayingRecording}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition shadow shrink-0 ${
            isPlayingRecording
              ? 'bg-amber-500 border-amber-400 text-slate-950 scale-105'
              : recordedCount > 0
              ? 'bg-gradient-to-b from-slate-700 to-slate-900 border-slate-600 text-slate-100 hover:text-amber-400 hover:scale-105'
              : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
          }`}
          title={isPlayingRecording ? 'Stop' : t.playRecording}
        >
          {isPlayingRecording ? (
            <Square className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        {/* 88-Key Minimap */}
        <div
          ref={minimapRef}
          onClick={handleMinimapClick}
          className="flex-1 h-7 bg-slate-900 border border-slate-700/80 rounded-md relative cursor-pointer overflow-hidden flex items-stretch shadow-inner min-w-[70px]"
          title="Full 88-key overview"
        >
          <div className="w-full h-full flex pointer-events-none relative">
            {full88Keys
              .filter((k) => !k.name.includes('#'))
              .map((k) => (
                <div key={`mini-w-${k.midi}`} className="flex-1 border-r border-slate-800/60 bg-slate-200" />
              ))}

            {full88Keys
              .filter((k) => k.name.includes('#'))
              .map((bk) => {
                const whiteList = full88Keys.filter((k) => !k.name.includes('#'));
                const whiteIndex = whiteList.findIndex((wk) => wk.midi > bk.midi);
                const pct = (whiteIndex / whiteList.length) * 100;
                return (
                  <div
                    key={`mini-b-${bk.midi}`}
                    style={{ left: `${pct}%` }}
                    className="absolute top-0 h-4 w-[1.5%] bg-slate-950 rounded-b-xs -translate-x-1/2 z-10"
                  />
                );
              })}
          </div>

          <div
            style={{
              left: `${scrollProgress * (100 - visibleRatio * 100)}%`,
              width: `${visibleRatio * 100}%`,
            }}
            className="absolute top-0 bottom-0 bg-slate-900/75 border-x-2 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)] z-20 transition-all duration-75 pointer-events-none"
          />
        </div>

        {/* My Range Toggle */}
        <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-xl border border-white/10 shrink-0">
          <button
            onClick={() => {
              haptics.tap();
              setViewCompass('my_range');
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
              viewCompass === 'my_range'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-3 h-3 text-current" />
            <span>{isAr ? 'طبقتي' : 'My Range'}</span>
          </button>
          <button
            onClick={() => {
              haptics.tap();
              setViewCompass('full_88');
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
              viewCompass === 'full_88'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>{isAr ? 'الكامل 88' : '88 Keys'}</span>
          </button>
        </div>

        {/* Pitch Duration Selector */}
        <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-0.5 shrink-0">
          {([1, 2, 4] as const).map((dur) => (
            <button
              key={dur}
              onClick={() => {
                haptics.tap();
                setNoteDuration(dur);
                audioEngine.setNoteDuration(dur);
              }}
              className={`px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-bold transition ${
                noteDuration === dur
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {dur}{isAr ? 'ث' : 's'}
            </button>
          ))}
        </div>

        {/* Key Size */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-2 py-1 rounded-xl shrink-0">
          <button
            onClick={() => {
              haptics.tap();
              setKeyWidth((w) => Math.max(34, w - 4));
            }}
            className="w-6 h-6 rounded-full bg-slate-800 border border-slate-600 text-slate-200 flex items-center justify-center font-bold text-xs hover:text-white"
          >
            –
          </button>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">{keyWidth}px</span>
          <button
            onClick={() => {
              haptics.tap();
              setKeyWidth((w) => Math.min(76, w + 4));
            }}
            className="w-6 h-6 rounded-full bg-slate-800 border border-slate-600 text-slate-200 flex items-center justify-center font-bold text-xs hover:text-white"
          >
            +
          </button>
        </div>

        <button
          onClick={() => scrollByDelta(7)}
          aria-label="Scroll Piano Right"
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-slate-700 to-slate-900 border border-slate-600 text-slate-100 flex items-center justify-center hover:scale-105 active:scale-95 transition shadow shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Vocal Range Direct Monitor Strip */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-xs gap-2">
        <div className="flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="font-semibold text-slate-200">
            {isAr ? 'نطاق صوتك المسجّل:' : 'Your Vocal Range:'}
          </span>
          <span className="font-mono text-cyan-300 font-bold" dir="ltr">
            {formatNoteName(profile.lowestNote, notation)} – {formatNoteName(profile.highestNote, notation)}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-semibold hidden sm:inline">
            {profile.voiceType}
          </span>
        </div>

        <div className="flex items-center gap-1.5" dir="ltr">
          <button
            onClick={() => handleJumpToMidi(profile.lowestNote.midi)}
            className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/40 transition"
          >
            {t.minBadge}: {formatNoteName(profile.lowestNote, notation)}
          </button>
          {profile.middleRegisterNote && (
            <button
              onClick={() => handleJumpToMidi(profile.middleRegisterNote!.midi)}
              className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/40 transition"
            >
              {t.midBadge}: {formatNoteName(profile.middleRegisterNote, notation)}
            </button>
          )}
          <button
            onClick={() => handleJumpToMidi(profile.highestNote.midi)}
            className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 hover:bg-pink-500/40 transition"
          >
            {t.maxBadge}: {formatNoteName(profile.highestNote, notation)}
          </button>
        </div>
      </div>

      {/* Piano Canvas (fixed dir="ltr") */}
      <div
        ref={containerRef}
        onScroll={updateScrollMetrics}
        onPointerMove={handleContainerPointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        dir="ltr"
        className={`relative overflow-x-auto overflow-y-hidden select-none ${themeConfig.isLight ? 'bg-[#ebe4d5]' : 'bg-slate-950'} py-1 px-1 min-h-[220px]`}
      >
        <div
          className="relative inline-flex items-start h-[190px]"
          style={{ width: `${whiteKeys.length * keyWidth}px` }}
        >
          {/* White Keys */}
          {whiteKeys.map((note, index) => {
            const inRange = isInVocalRange(note.midi);
            const isSung = isSungNote(note.midi);
            const isPlayed = activeMidiNotes.has(note.midi);
            const isLowest = profile.lowestNote.midi === note.midi;
            const isHighest = profile.highestNote.midi === note.midi;
            const isMiddle = profile.middleRegisterNote?.midi === note.midi;

            return (
              <button
                key={`white-${note.midi}`}
                data-midi={note.midi}
                onPointerDown={() => handlePointerDown(note.midi)}
                onPointerEnter={() => handlePointerEnter(note.midi)}
                style={{
                  left: `${index * keyWidth}px`,
                  width: `${keyWidth}px`,
                }}
                className={`absolute top-0 h-[196px] rounded-b-[4px] flex flex-col justify-end items-center pb-2.5 border-r border-[#cfd4de] transition-all active:translate-y-0.5 select-none ${
                  isSung
                    ? 'bg-gradient-to-b from-emerald-100 via-emerald-300 to-emerald-500 text-slate-950 font-bold ring-2 ring-emerald-300 shadow-xl z-20'
                    : isPlayed
                    ? `${themeConfig.keyWhiteActive} z-20`
                    : inRange
                    ? `${themeConfig.keyWhiteBg}`
                    : 'bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 text-slate-500 opacity-60'
                }`}
              >
                {isLowest && (
                  <span className="absolute top-2 px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[8px] font-black shadow">
                    {t.minBadge}
                  </span>
                )}
                {isHighest && (
                  <span className="absolute top-2 px-1.5 py-0.5 rounded-full bg-pink-600 text-white text-[8px] font-black shadow">
                    {t.maxBadge}
                  </span>
                )}
                {isMiddle && !isLowest && !isHighest && (
                  <span className="absolute top-2 px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[8px] font-black shadow">
                    {t.midBadge}
                  </span>
                )}

                <div className="flex flex-col items-center pointer-events-none mb-1">
                  <span className="font-extrabold text-xs tracking-tight font-mono text-slate-800">
                    {formatNoteName(note, notation)}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    {Math.round(note.frequency)}
                  </span>
                </div>

                <div className="w-[88%] h-[3px] bg-slate-400/30 rounded-full pointer-events-none" />
              </button>
            );
          })}

          {/* Black Keys with Specular Highlights */}
          {whiteKeys.map((whiteNote, index) => {
            const blackMidi = whiteNote.midi + 1;
            const blackNote = activeCompass.find((n) => n.midi === blackMidi && n.name.includes('#'));
            if (!blackNote) return null;

            const inRange = isInVocalRange(blackNote.midi);
            const isSung = isSungNote(blackNote.midi);
            const isPlayed = activeMidiNotes.has(blackNote.midi);
            const isLowest = profile.lowestNote.midi === blackNote.midi;
            const isHighest = profile.highestNote.midi === blackNote.midi;

            const blackWidth = Math.max(22, keyWidth * 0.62);
            const leftOffset = index * keyWidth + keyWidth - blackWidth / 2;

            return (
              <button
                key={`black-${blackNote.midi}`}
                data-midi={blackNote.midi}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handlePointerDown(blackNote.midi);
                }}
                onPointerEnter={() => handlePointerEnter(blackNote.midi)}
                style={{
                  left: `${leftOffset}px`,
                  width: `${blackWidth}px`,
                }}
                className={`absolute top-0 h-[122px] rounded-b-[3px] z-30 flex flex-col justify-end items-center pb-2 transition-all active:translate-y-0.5 select-none shadow-[2px_5px_8px_rgba(0,0,0,0.7),_0_2px_4px_rgba(0,0,0,0.6)] ${
                  isSung
                    ? 'bg-gradient-to-b from-emerald-500 via-emerald-600 to-emerald-800 text-white ring-2 ring-emerald-300'
                    : isPlayed
                    ? `${themeConfig.keyBlackActive}`
                    : inRange
                    ? `${themeConfig.keyBlackBg}`
                    : 'bg-[#18181b] opacity-60'
                }`}
              >
                <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-1 opacity-55 pointer-events-none">
                  <div className="w-1.5 h-3.5 rounded-full bg-gradient-to-b from-white/90 to-transparent" />
                  <div className="w-1.5 h-3.5 rounded-full bg-gradient-to-b from-white/90 to-transparent" />
                </div>

                <div className="w-[88%] h-2.5 bg-gradient-to-b from-[#3d3d46] to-[#1c1c20] rounded-b-[2px] mb-1 border-t border-white/10 shadow-inner pointer-events-none" />

                {isLowest && (
                  <span className="absolute top-1 text-[7px] text-blue-300 font-bold">{t.minBadge}</span>
                )}
                {isHighest && (
                  <span className="absolute top-1 text-[7px] text-pink-300 font-bold">{t.maxBadge}</span>
                )}
                <span className="text-[9px] font-bold font-mono text-white/80">
                  {formatNoteName(blackNote, notation)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Red Velvet Bottom Bar */}
      <div className={`w-full py-2.5 px-4 flex items-center justify-between text-xs ${themeConfig.cushionBg}`}>
        <div className="flex items-center gap-2">
          <span className={`font-serif tracking-widest text-sm ${themeConfig.cushionText}`}>
            {isAr ? themeConfig.cushionTitleAr : themeConfig.cushionTitleEn}
          </span>
          <span className="text-[11px] text-white/70 font-mono hidden sm:inline" dir="ltr">
            • {profile.voiceType} ({formatNoteName(profile.lowestNote, notation)} – {formatNoteName(profile.highestNote, notation)})
          </span>
        </div>

        {currentPitch?.note ? (
          <div className="flex items-center gap-2 bg-black/40 border border-white/20 text-white px-3 py-1 rounded-full font-mono text-xs animate-pulse" dir="ltr">
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold">{formatNoteName(currentPitch.note, notation)}</span>
            <span>({Math.round(currentPitch.frequency || 0)} {t.hzUnit})</span>
            <span className={currentPitch.isInTune ? 'text-emerald-400 font-bold' : 'text-amber-300'}>
              {currentPitch.cents > 0 ? `+${currentPitch.cents}` : currentPitch.cents}¢
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-white/70 italic hidden sm:inline">
            {t.singPrompt}
          </span>
        )}
      </div>
    </div>
  );
};
