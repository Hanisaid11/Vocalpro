import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  Play,
  Square,
  ChevronUp,
  ChevronDown,
  Mic,
  Maximize2,
  Minimize2,
  Target,
  Sliders,
} from 'lucide-react';
import {
  NoteInfo,
  VocalRangeProfile,
  PitchDetectionResult,
  AppLanguage,
  NotationSystem,
  AppTheme,
  EasternMaqam,
  ReverbSpacePreset,
} from '../../types/vocal';
import { midiToNoteInfo, formatNoteName } from '../../utils/noteUtils';
import { audioEngine } from '../../audio/audioEngine';
import { translations } from '../../utils/i18n';
import { THEMES } from '../../utils/theme';
import { haptics } from '../../utils/haptics';

interface VerticalPianoProps {
  profile: VocalRangeProfile;
  currentPitch: PitchDetectionResult | null;
  language?: AppLanguage;
  notation?: NotationSystem;
  theme?: AppTheme;
  onSelectRangeProfile?: (profile: VocalRangeProfile) => void;
  targetMidi?: number | null;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const VerticalPiano: React.FC<VerticalPianoProps> = ({
  profile,
  currentPitch,
  language = 'ar',
  notation = 'arabic',
  theme = 'classic-piano',
  targetMidi,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const isAr = language === 'ar';
  const t = translations[language] || translations.en;
  const themeConfig = THEMES[theme] || THEMES['classic-piano'];

  const containerRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLDivElement>(null);

  // Key Height controls vertical key size
  const [keyHeight, setKeyHeight] = useState<number>(isFullscreen ? 44 : 38);
  const [activeMidiNotes, setActiveMidiNotes] = useState<Set<number>>(new Set());
  const [scrollProgress, setScrollProgress] = useState<number>(0.4);
  const [visibleRatio, setVisibleRatio] = useState<number>(0.25);
  const [rangeOnlyMode, setRangeOnlyMode] = useState<boolean>(false);

  // Clean Display Modes:
  // 'photo' -> Pure authentic Real Piano reference look (no floating numbers or text clutter)
  // 'engraved' -> Subtle musical solfege & note names embossed cleanly
  // 'coach' -> Full pedagogical badges: Hz, octave, and Min/Max/Passaggio indicators
  const [displayMode, setDisplayMode] = useState<'photo' | 'engraved' | 'coach'>('engraved');
  const [showQuickSettings, setShowQuickSettings] = useState<boolean>(false);

  // Recording & Playback state
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [recordedCount, setRecordedCount] = useState(0);

  // Direction: Low notes at top vs Bass at bottom
  const [lowNotesAtTop, setLowNotesAtTop] = useState<boolean>(true);
  const [activeMaqam, setActiveMaqam] = useState<EasternMaqam>(audioEngine.getMaqam());
  const [reverbPreset, setReverbPreset] = useState<ReverbSpacePreset>(audioEngine.getReverbPreset());

  // Full 88-Key Standard Piano Compass: A0 (21) to C8 (108)
  const full88Keys = useMemo(() => {
    const list: NoteInfo[] = [];
    for (let m = 21; m <= 108; m++) {
      list.push(midiToNoteInfo(m));
    }
    return list;
  }, []);

  const activeCompass = useMemo(() => {
    if (!rangeOnlyMode) return full88Keys;
    const minMidi = Math.max(21, profile.lowestNote.midi - 1);
    const maxMidi = Math.min(108, profile.highestNote.midi + 1);
    return full88Keys.filter((n) => n.midi >= minMidi && n.midi <= maxMidi);
  }, [rangeOnlyMode, full88Keys, profile]);

  const displayWhiteKeys = useMemo(() => {
    const keys = activeCompass.filter((note) => !note.name.includes('#'));
    return lowNotesAtTop ? keys : [...keys].reverse();
  }, [activeCompass, lowNotesAtTop]);

  interface BlackKeyInfo {
    note: NoteInfo;
    boundaryWhiteIndex: number;
  }

  const displayBlackKeys = useMemo(() => {
    const list: BlackKeyInfo[] = [];
    for (let i = 0; i < displayWhiteKeys.length - 1; i++) {
      const topWhite = displayWhiteKeys[i];
      const bottomWhite = displayWhiteKeys[i + 1];

      if (lowNotesAtTop) {
        if (bottomWhite.midi - topWhite.midi === 2) {
          const blackMidi = topWhite.midi + 1;
          const blackNote = full88Keys.find((n) => n.midi === blackMidi);
          if (blackNote) {
            list.push({ note: blackNote, boundaryWhiteIndex: i + 1 });
          }
        }
      } else {
        if (topWhite.midi - bottomWhite.midi === 2) {
          const blackMidi = bottomWhite.midi + 1;
          const blackNote = full88Keys.find((n) => n.midi === blackMidi);
          if (blackNote) {
            list.push({ note: blackNote, boundaryWhiteIndex: i + 1 });
          }
        }
      }
    }
    return list;
  }, [displayWhiteKeys, full88Keys, lowNotesAtTop]);

  // Adjust key height when entering fullscreen
  useEffect(() => {
    if (isFullscreen) {
      setKeyHeight((prev) => Math.max(46, prev));
    }
  }, [isFullscreen]);

  // Subscribe to recording state
  useEffect(() => {
    const unsub = audioEngine.subscribeRecording((rec, play, count) => {
      setIsRecording(rec);
      setIsPlayingRecording(play);
      setRecordedCount(count);
    });
    return () => unsub();
  }, []);

  // Center vertical piano on user's vocal range
  const scrollToVocalRange = (smooth = false) => {
    if (!containerRef.current || displayWhiteKeys.length === 0) return;

    const targetMidiCenter =
      profile.middleRegisterNote?.midi ||
      Math.round((profile.lowestNote.midi + profile.highestNote.midi) / 2) ||
      60;

    let closestIndex = 0;
    let minDistance = Infinity;
    displayWhiteKeys.forEach((key, idx) => {
      const dist = Math.abs(key.midi - targetMidiCenter);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = idx;
      }
    });

    const clientH = containerRef.current.clientHeight || 450;
    const targetScroll = Math.max(0, closestIndex * keyHeight - clientH / 2 + keyHeight / 2);

    if (smooth) {
      containerRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
    } else {
      containerRef.current.scrollTop = targetScroll;
    }
    handleScroll();
  };

  useEffect(() => {
    scrollToVocalRange(false);
    const timer = setTimeout(() => scrollToVocalRange(false), 80);
    return () => clearTimeout(timer);
  }, [keyHeight, rangeOnlyMode, lowNotesAtTop, profile.id]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll > 0) {
      const progress = 1 - scrollTop / maxScroll;
      setScrollProgress(Math.max(0, Math.min(1, progress)));
      setVisibleRatio(Math.max(0.1, Math.min(0.5, clientHeight / scrollHeight)));
    }
  };

  const scrollByDelta = (semitones: number) => {
    haptics.tap();
    if (!containerRef.current) return;
    const targetScroll = containerRef.current.scrollTop + semitones * keyHeight;
    containerRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
  };

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!minimapRef.current || !containerRef.current) return;
    const rect = minimapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const maxScroll = containerRef.current.scrollHeight - containerRef.current.clientHeight;
    containerRef.current.scrollTo({ top: (1 - ratio) * maxScroll, behavior: 'smooth' });
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

  // Glissando / finger swipe across keys
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

  const blackKeyHeight = Math.max(24, Math.round(keyHeight * 0.7));

  return (
    <div
      className={`flex flex-col bg-[#07090e] select-none transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none h-screen w-screen'
          : 'rounded-3xl overflow-hidden border border-slate-800 shadow-2xl'
      }`}
    >
      {/* 
        ========================================================================
        ROW 1: STREAMLINED AUDIO-CONSOLE TOOLBAR (NO CLUTTER)
        ========================================================================
      */}
      <div
        className={`px-2.5 py-2 ${themeConfig.topBarBg} border-b ${themeConfig.topBarBorder} flex items-center justify-between gap-1.5 sm:gap-2 text-xs z-30 shrink-0 shadow-md backdrop-blur-md`}
        dir="ltr"
      >
        {/* Navigation & Range Jump Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              haptics.tap();
              scrollToVocalRange(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950 to-blue-950 border border-cyan-500/80 text-cyan-300 font-bold text-xs shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.3)] hover:scale-105 active:scale-95 transition"
            title={isAr ? 'توسيط مباشر على مساحتك الصوتية' : 'Center on My Range'}
          >
            <Target className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">{isAr ? 'طبقتي' : 'My Range'}</span>
          </button>

          <button
            onClick={() => {
              haptics.tap();
              setLowNotesAtTop(!lowNotesAtTop);
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400 flex items-center justify-center font-bold text-xs hover:bg-slate-700 transition"
            title={lowNotesAtTop ? (isAr ? 'الترتيب: القرار بالأعلى ↗' : 'Bass Top') : (isAr ? 'الترتيب: القرار بالأسفل ↘' : 'Bass Bottom')}
          >
            ⇅
          </button>

          <button
            onClick={() => scrollByDelta(-6)}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center hover:bg-slate-700 transition"
            title={isAr ? 'تمرير للأعلى' : 'Scroll Up'}
          >
            <ChevronUp className="w-4 h-4" />
          </button>

          <button
            onClick={() => scrollByDelta(6)}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center hover:bg-slate-700 transition"
            title={isAr ? 'تمرير للأسفل' : 'Scroll Down'}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* 88-Key Interactive Overview Scrubber */}
        <div
          ref={minimapRef}
          onClick={handleMinimapClick}
          className="h-6 flex-1 max-w-[160px] bg-slate-900 border border-slate-700/80 rounded-md relative cursor-pointer overflow-hidden flex items-stretch shadow-inner"
          title={isAr ? 'مخطط الـ 88 مفتاحاً كاملة' : 'Full 88-Key Overview'}
        >
          <div className="w-full h-full flex pointer-events-none relative">
            {full88Keys
              .filter((k) => !k.name.includes('#'))
              .map((k) => (
                <div key={`vert-mini-w-${k.midi}`} className="flex-1 border-r border-slate-800/60 bg-slate-300" />
              ))}
          </div>

          <div
            style={{
              left: `${scrollProgress * (100 - visibleRatio * 100)}%`,
              width: `${visibleRatio * 100}%`,
            }}
            className="absolute top-0 bottom-0 bg-slate-900/85 border-x-2 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)] z-20 transition-all duration-75 pointer-events-none"
          />
        </div>

        {/* Actions & Tools Group */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Record Button */}
          <button
            onClick={() => {
              haptics.tap();
              if (isRecording) {
                audioEngine.stopRecording();
              } else {
                audioEngine.startRecording();
              }
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-xl border text-xs font-bold transition shadow ${
              isRecording
                ? 'bg-rose-950 border-rose-500 text-rose-300 ring-2 ring-rose-500/40 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isRecording ? t.stopRecording : t.recordKeys}
          >
            <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500' : 'bg-red-700'}`} />
            {recordedCount > 0 && <span className="text-[10px] text-amber-300">({recordedCount})</span>}
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
            className={`w-7 h-7 rounded-xl border flex items-center justify-center transition ${
              isPlayingRecording
                ? 'bg-amber-500 border-amber-400 text-slate-950 scale-105'
                : recordedCount > 0
                ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
                : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
            }`}
            title={isPlayingRecording ? 'Stop' : t.playRecording}
          >
            {isPlayingRecording ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
          </button>

          {/* Key Size Controls */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-0.5">
            <button
              onClick={() => {
                haptics.tap();
                setKeyHeight((h) => Math.max(26, h - 3));
              }}
              className="w-5 h-5 rounded-lg text-slate-200 flex items-center justify-center font-bold text-xs hover:bg-slate-800"
              title="Smaller keys"
            >
              –
            </button>
            <button
              onClick={() => {
                haptics.tap();
                setKeyHeight((h) => Math.min(60, h + 3));
              }}
              className="w-5 h-5 rounded-lg text-slate-200 flex items-center justify-center font-bold text-xs hover:bg-slate-800"
              title="Larger keys"
            >
              +
            </button>
          </div>

          {/* Quick Options / Display Mode Toggle */}
          <button
            onClick={() => setShowQuickSettings(!showQuickSettings)}
            className={`p-1.5 rounded-xl border transition ${
              showQuickSettings
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isAr ? 'خيارات العرض والمقامات والصدى' : 'Piano Options & Acoustics'}
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Button */}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
              title={isFullscreen ? t.exitFullscreen : t.fullscreen}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* 
        ========================================================================
        ROW 2: QUICK ACOUSTIC & DISPLAY DRAWER (When Sliders clicked)
        ========================================================================
      */}
      {showQuickSettings && (
        <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in">
          {/* Display Mode Selection: Photo / Engraved / Coach */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10" dir="ltr">
            <button
              onClick={() => {
                haptics.tap();
                setDisplayMode('photo');
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                displayMode === 'photo'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="100% Pure Photo Realism (No text overlays on keys)"
            >
              {isAr ? 'نقي كالصورة' : 'Pure Photo'}
            </button>
            <button
              onClick={() => {
                haptics.tap();
                setDisplayMode('engraved');
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                displayMode === 'engraved'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Subtle engraved note names on keys"
            >
              {isAr ? 'حفر نغمات' : 'Engraved'}
            </button>
            <button
              onClick={() => {
                haptics.tap();
                setDisplayMode('coach');
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                displayMode === 'coach'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Full vocal badges, Hz, and passaggio markers"
            >
              {isAr ? 'شامل ومدرب' : 'Coach Badges'}
            </button>
          </div>

          {/* Acoustic Reverb Presets */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-[10px] font-mono" dir="ltr">
            <span className="text-slate-400 px-1 font-sans">{isAr ? 'الصدى:' : 'Reverb:'}</span>
            {(['dry', 'studio', 'hall', 'cathedral'] as const).map((rev) => (
              <button
                key={rev}
                onClick={() => {
                  haptics.tap();
                  setReverbPreset(rev);
                  audioEngine.setReverbPreset(rev);
                }}
                className={`px-2 py-0.5 rounded-lg font-bold transition capitalize ${
                  reverbPreset === rev ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {rev === 'dry' ? (isAr ? 'جاف' : 'dry') : rev === 'studio' ? (isAr ? 'استوديو' : 'studio') : rev === 'hall' ? (isAr ? 'قاعة' : 'hall') : (isAr ? 'كاتدرائية' : 'cathedral')}
              </button>
            ))}
          </div>

          {/* Maqam & Quarter-Tone Mode */}
          <div className="flex items-center gap-1.5" dir="ltr">
            <span className="text-slate-400 text-[10px]">{isAr ? 'المقام:' : 'Maqam:'}</span>
            <select
              value={activeMaqam}
              onChange={(e) => {
                const next = e.target.value as EasternMaqam;
                haptics.tap();
                setActiveMaqam(next);
                audioEngine.setMaqam(next);
              }}
              className="bg-slate-950 border border-slate-700 text-cyan-300 rounded-lg px-2 py-1 text-[11px] font-bold focus:outline-none"
            >
              <option value="standard_12tet">{isAr ? 'غربي قياسي (12-TET)' : 'Western 12-TET'}</option>
              <option value="rast">{isAr ? 'مقام راست (مي♭، سي♭ ربع تون)' : 'Maqam Rast (E𝄳, B𝄳)'}</option>
              <option value="bayati">{isAr ? 'مقام بياتي (مي سيكاه 𝄳)' : 'Maqam Bayati (E𝄳)'}</option>
              <option value="saba">{isAr ? 'مقام صبا (مي سيكاه 𝄳، صول♭)' : 'Maqam Saba (E𝄳)'}</option>
              <option value="hijaz">{isAr ? 'مقام حجاز' : 'Maqam Hijaz'}</option>
              <option value="nahawand">{isAr ? 'مقام نهاوند' : 'Maqam Nahawand'}</option>
            </select>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        AUTHENTIC VERTICAL REAL PIANO CANVAS
        - FIXED RTL BUG: Wrapped strictly in dir="ltr"
        - White keys on left with soft gradient and rounded tips
        - Black keys on right with authentic dual gloss marks )(
        - No stray numbers, no empty brackets
        ========================================================================
      */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onPointerDown={() => {
          isPointerDownRef.current = true;
        }}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerMove={handleContainerPointerMove}
        dir="ltr"
        className={`relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${themeConfig.isLight ? 'bg-[#ebe4d5]' : 'bg-[#07090e]'} flex touch-none ${
          isFullscreen ? 'h-full' : 'h-[520px] max-h-[660px]'
        }`}
      >
        {/* Left Piano Wood Cheek Block (theme cushion trim) */}
        <div className={`w-2.5 sm:w-3 ${themeConfig.cushionBg} border-r border-black/30 shrink-0 shadow-lg z-25`} />

        {/* Keys Canvas Container */}
        <div
          className="relative flex-1 min-h-full"
          style={{ height: `${displayWhiteKeys.length * keyHeight}px` }}
        >
          {/* LAYER 1: WHITE KEYS */}
          {displayWhiteKeys.map((note, index) => {
            const inRange = isInVocalRange(note.midi);
            const isSung = isSungNote(note.midi);
            const isPlayed = activeMidiNotes.has(note.midi);
            const isLowest = profile.lowestNote.midi === note.midi;
            const isHighest = profile.highestNote.midi === note.midi;
            const isMiddle = profile.middleRegisterNote?.midi === note.midi;
            const isPassaggio =
              profile.passaggio?.primoMidi === note.midi ||
              profile.passaggio?.secondoMidi === note.midi;

            return (
              <button
                key={`vert-white-${note.midi}`}
                data-midi={note.midi}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handlePointerDown(note.midi);
                }}
                onPointerEnter={() => handlePointerEnter(note.midi)}
                style={{
                  top: `${index * keyHeight}px`,
                  height: `${keyHeight}px`,
                }}
                className={`absolute left-0 right-0 rounded-l-[4px] border-b border-[#0d0e12] flex items-center justify-between px-3 select-none transition-all active:brightness-95 cursor-pointer ${
                  isSung
                    ? 'bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 text-slate-950 font-black shadow-[inset_0_0_15px_rgba(16,185,129,0.8)] z-10'
                    : isPlayed
                    ? `${themeConfig.keyWhiteActive} z-10`
                    : targetMidi === note.midi
                    ? 'bg-gradient-to-r from-amber-100 via-amber-200 to-amber-300 text-slate-950 z-10 ring-2 ring-amber-400'
                    : inRange
                    ? `${themeConfig.keyWhiteBg}`
                    : 'bg-gradient-to-r from-slate-300 via-slate-200 to-slate-400 text-slate-500 opacity-65'
                }`}
              >
                {/* Left Side: Note Labels & Badges */}
                <div className="flex items-center gap-1.5 pointer-events-none z-10">
                  {displayMode === 'coach' && (
                    <>
                      {isLowest && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[8px] font-black shadow">
                          {t.minBadge}
                        </span>
                      )}
                      {isHighest && (
                        <span className="px-1.5 py-0.5 rounded bg-pink-600 text-white text-[8px] font-black shadow">
                          {t.maxBadge}
                        </span>
                      )}
                      {isMiddle && !isLowest && !isHighest && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[8px] font-black shadow">
                          {t.midBadge}
                        </span>
                      )}
                      {isPassaggio && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-600 text-white text-[8px] font-bold shadow">
                          Passaggio
                        </span>
                      )}
                    </>
                  )}

                  {displayMode !== 'photo' && (
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono text-xs font-black tracking-tight text-slate-900/90">
                        {formatNoteName(note, notation)}
                      </span>
                      {displayMode === 'coach' && (
                        <span className="text-[9px] font-mono text-slate-500 hidden sm:inline">
                          {Math.round(note.frequency)} {t.hzUnit}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right side octave watermark */}
                {displayMode !== 'photo' && (
                  <span className="text-[10px] font-mono font-bold text-slate-400/40 pointer-events-none pr-1">
                    {note.octave}
                  </span>
                )}
              </button>
            );
          })}

          {/* LAYER 2: BLACK KEYS WITH DUAL SPECULAR GLOSS )( */}
          {displayBlackKeys.map(({ note, boundaryWhiteIndex }) => {
            const inRange = isInVocalRange(note.midi);
            const isSung = isSungNote(note.midi);
            const isPlayed = activeMidiNotes.has(note.midi);
            const isLowest = profile.lowestNote.midi === note.midi;
            const isHighest = profile.highestNote.midi === note.midi;
            const topPosition = boundaryWhiteIndex * keyHeight - blackKeyHeight / 2;

            return (
              <button
                key={`vert-black-${note.midi}`}
                data-midi={note.midi}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handlePointerDown(note.midi);
                }}
                onPointerEnter={() => handlePointerEnter(note.midi)}
                style={{
                  top: `${topPosition}px`,
                  height: `${blackKeyHeight}px`,
                  width: '58%',
                  right: 0,
                }}
                className={`absolute z-20 rounded-l-[5px] border-l border-y border-[#000000] flex items-center justify-between px-2.5 select-none transition-all shadow-[0_4px_8px_rgba(0,0,0,0.9),-3px_2px_5px_rgba(0,0,0,0.7)] active:brightness-95 cursor-pointer ${
                  isSung
                    ? 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-800 text-white ring-2 ring-emerald-300'
                    : isPlayed
                    ? `${themeConfig.keyBlackActive}`
                    : targetMidi === note.midi
                    ? 'bg-gradient-to-r from-amber-700 via-amber-800 to-amber-950 text-white ring-2 ring-amber-400'
                    : inRange
                    ? `${themeConfig.keyBlackBg}`
                    : 'bg-[#151518] text-slate-500 opacity-60'
                }`}
              >
                {/* Left Tip of Black Key: Exact Specular Highlights )( from Reference Photo */}
                <div className="flex items-center gap-1.5 pointer-events-none">
                  <div className="flex items-center gap-[2px] opacity-80 pl-0.5">
                    <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
                      <path d="M3.5 2 C1.8 5.5, 1.8 12.5, 3.5 16" stroke="rgba(255,255,255,0.9)" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M6.5 2 C8.2 5.5, 8.2 12.5, 6.5 16" stroke="rgba(255,255,255,0.75)" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </div>

                  <div className="w-1 h-4 bg-gradient-to-r from-[#4b4b56] to-[#1c1c20] rounded-l-xs shadow-inner" />

                  {displayMode !== 'photo' && (
                    <span className="font-mono text-[11px] font-bold text-white/90">
                      {formatNoteName(note, notation)}
                    </span>
                  )}
                </div>

                {/* Right side frequency in Coach mode */}
                {displayMode === 'coach' && (
                  <div className="flex items-center gap-1.5 pointer-events-none">
                    {isLowest && (
                      <span className="px-1 py-0.2 rounded bg-blue-600 text-white text-[7px] font-bold">
                        {t.minBadge}
                      </span>
                    )}
                    {isHighest && (
                      <span className="px-1 py-0.2 rounded bg-pink-600 text-white text-[7px] font-bold">
                        {t.maxBadge}
                      </span>
                    )}
                    <span className="text-[9px] font-mono text-slate-400">
                      {Math.round(note.frequency)}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 
        ========================================================================
        BOTTOM CUSHION: CLASSIC RED VELVET (NO "REAL PIANO" TEXT)
        ========================================================================
      */}
      <div className={`w-full py-2 px-3.5 flex items-center justify-between text-xs z-30 shrink-0 ${themeConfig.cushionBg}`}>
        <div className="flex items-center gap-2">
          <span className={`font-serif tracking-widest text-xs sm:text-sm ${themeConfig.cushionText}`}>
            {isAr ? themeConfig.cushionTitleAr : themeConfig.cushionTitleEn}
          </span>
          <span className="text-[10px] sm:text-[11px] text-white/70 font-mono hidden sm:inline" dir="ltr">
            • {profile.voiceType} ({formatNoteName(profile.lowestNote, notation)} – {formatNoteName(profile.highestNote, notation)})
          </span>
        </div>

        {/* Live Sung Pitch */}
        {currentPitch?.note ? (
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/20 text-white px-2.5 py-0.5 rounded-full font-mono text-xs animate-pulse">
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold">{formatNoteName(currentPitch.note, notation)}</span>
            <span className="text-[10px]">({Math.round(currentPitch.frequency || 0)} {t.hzUnit})</span>
            <span className={currentPitch.isInTune ? 'text-emerald-400 font-bold' : 'text-amber-300'}>
              {currentPitch.cents > 0 ? `+${currentPitch.cents}` : currentPitch.cents}¢
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-white/70 italic hidden sm:inline">
            {t.singPrompt}
          </span>
        )}
      </div>
    </div>
  );
};
