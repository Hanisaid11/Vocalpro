import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  Plus,
  Minus,
  Volume2,
  VolumeX,
  X,
  ChevronDown,
  Activity,
} from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';
import { haptics } from '../../utils/haptics';
import { AppLanguage } from '../../types/vocal';
import { translations } from '../../utils/i18n';

interface GlobalMetronomeHeaderToggleProps {
  language?: AppLanguage;
  className?: string;
}

const TEMPO_MARKINGS: Array<{ min: number; max: number; en: string; ar: string }> = [
  { min: 30, max: 59, en: 'Largo (Broad & Slow)', ar: 'لارغو (عريض وبطيء)' },
  { min: 60, max: 75, en: 'Adagio (Slow & Relaxed)', ar: 'أداجيو (بطيء وهادئ)' },
  { min: 76, max: 99, en: 'Andante (Walking Pace)', ar: 'أندانتيه (إيقاع الخطو)' },
  { min: 100, max: 120, en: 'Moderato (Moderate)', ar: 'موديراتور (معتدل)' },
  { min: 121, max: 145, en: 'Allegro (Fast & Bright)', ar: 'أليغرو (سريع ومرح)' },
  { min: 146, max: 175, en: 'Vivace (Lively & Fast)', ar: 'فيفاتشي (حيوي ورشيق)' },
  { min: 176, max: 240, en: 'Presto (Very Fast)', ar: 'بريستو (سريع جداً)' },
];

export const GlobalMetronomeHeaderToggle: React.FC<GlobalMetronomeHeaderToggleProps> = ({
  language = 'ar',
  className = '',
}) => {
  const isAr = language === 'ar';
  const t = translations[language] || translations.en;

  // Real-time engine states
  const [isRunning, setIsRunning] = useState<boolean>(() => audioEngine.isMetronomeRunning());
  const [bpm, setBpm] = useState<number>(() => audioEngine.getMetronomeBpm());
  const [timeSignature, setTimeSignature] = useState<number>(() => audioEngine.getMetronomeTimeSignature());
  const [isMuted, setIsMuted] = useState<boolean>(() => audioEngine.isMetronomeMuted());
  const [currentBeat, setCurrentBeat] = useState<number>(-1);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  // Tap Tempo state
  const tapTimesRef = useRef<number[]>([]);
  const tapTimeoutRef = useRef<number | null>(null);
  const [tapActive, setTapActive] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Subscribe to engine state changes (running, bpm, time signature, mute)
  useEffect(() => {
    const unsubState = audioEngine.subscribeMetronomeState((running, curBpm, beats, muted) => {
      setIsRunning(running);
      setBpm(curBpm);
      setTimeSignature(beats);
      setIsMuted(muted);
    });

    const unsubBeat = audioEngine.subscribeMetronome((beat) => {
      setCurrentBeat(beat);
    });

    return () => {
      unsubState();
      unsubBeat();
    };
  }, []);

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    if (!isPopoverOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsPopoverOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPopoverOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPopoverOpen]);

  // Master 1-touch toggle (Start / Stop)
  const handleToggle = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
      }
      haptics.tap();

      if (isRunning) {
        audioEngine.stopMetronome();
      } else {
        await audioEngine.startMetronome(bpm);
      }
    },
    [isRunning, bpm]
  );

  // Adjust BPM delta
  const handleAdjustBpm = useCallback(
    (delta: number) => {
      haptics.tap();
      const nextBpm = Math.max(30, Math.min(240, bpm + delta));
      audioEngine.setMetronomeBpm(nextBpm);
    },
    [bpm]
  );

  // Set direct BPM
  const handleSetBpm = useCallback((newBpm: number) => {
    const clamped = Math.max(30, Math.min(240, Math.round(newBpm)));
    audioEngine.setMetronomeBpm(clamped);
  }, []);

  // Time signature toggle
  const handleSetTimeSignature = useCallback((beats: number) => {
    haptics.tap();
    audioEngine.setMetronomeTimeSignature(beats);
  }, []);

  // Mute toggle (audible clicks vs visual pulses)
  const handleToggleMute = useCallback(() => {
    haptics.tap();
    audioEngine.setMetronomeMuted(!isMuted);
  }, [isMuted]);

  // Tap tempo calculation
  const handleTapTempo = useCallback(() => {
    haptics.tap();
    setTapActive(true);
    setTimeout(() => setTapActive(false), 120);

    const now = performance.now();
    const tapTimes = tapTimesRef.current;

    if (tapTimeoutRef.current !== null) {
      window.clearTimeout(tapTimeoutRef.current);
    }

    tapTimes.push(now);

    // Keep only the last 5 taps
    if (tapTimes.length > 5) {
      tapTimes.shift();
    }

    if (tapTimes.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < tapTimes.length; i++) {
        intervals.push(tapTimes[i] - tapTimes[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (avgInterval > 0) {
        const calculatedBpm = Math.round(60000 / avgInterval);
        if (calculatedBpm >= 30 && calculatedBpm <= 240) {
          audioEngine.setMetronomeBpm(calculatedBpm);
        }
      }
    }

    // Reset tap buffer if idle for 2 seconds
    tapTimeoutRef.current = window.setTimeout(() => {
      tapTimesRef.current = [];
    }, 2000);
  }, []);

  // Find tempo description
  const tempoMarking = TEMPO_MARKINGS.find((m) => bpm >= m.min && bpm <= m.max) || TEMPO_MARKINGS[2];
  const isDownbeat = currentBeat === 0;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* ======================================================== */}
      {/* HEADER COMPACT TOGGLE PILL BUTTON */}
      {/* ======================================================== */}
      <div
        className={`flex items-center rounded-xl transition-all duration-200 border shadow-sm ${
          isRunning
            ? 'bg-gradient-to-r from-emerald-950/90 to-cyan-950/80 border-emerald-500/80 ring-2 ring-emerald-400/30 shadow-emerald-950/50'
            : 'bg-slate-900 hover:bg-slate-800/90 border-slate-800 text-slate-300'
        }`}
      >
        {/* Quick Play/Stop Action Button */}
        <button
          onClick={handleToggle}
          className={`px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-bold transition active:scale-95 cursor-pointer rounded-l-xl ${
            isRunning
              ? 'text-emerald-300 hover:text-white'
              : 'text-slate-400 hover:text-white'
          }`}
          title={isRunning ? (isAr ? 'إيقاف المترونوم' : 'Stop Metronome') : (isAr ? 'تشغيل المترونوم' : 'Start Metronome')}
          aria-label={isRunning ? 'Stop Metronome' : 'Start Metronome'}
        >
          {/* Animated Beat Indicator / Pendulum Icon */}
          <div className="relative flex items-center justify-center w-4 h-4">
            {isRunning && currentBeat >= 0 ? (
              <>
                <span
                  key={`pulse-halo-${currentBeat}`}
                  className={`absolute inset-0 rounded-full animate-ping opacity-75 ${
                    isDownbeat ? 'bg-cyan-400' : 'bg-emerald-400'
                  }`}
                />
                <span
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center font-black text-[9px] text-slate-950 transition-transform ${
                    isDownbeat
                      ? 'bg-cyan-400 scale-125 shadow-[0_0_10px_#22d3ee]'
                      : 'bg-emerald-400 scale-110 shadow-[0_0_8px_#34d399]'
                  }`}
                >
                  {currentBeat + 1}
                </span>
              </>
            ) : (
              <span className="text-sm">⏱️</span>
            )}
          </div>

          {/* Status text or Play/Pause icon */}
          <div className="flex items-center gap-1">
            {isRunning ? (
              <Pause className="w-3 h-3 text-emerald-400 shrink-0" />
            ) : (
              <Play className="w-3 h-3 text-slate-400 shrink-0 fill-current" />
            )}
            <span className="hidden sm:inline font-mono text-[11px] font-bold">
              {bpm}
            </span>
            <span className="hidden sm:inline text-[9px] text-slate-400 font-sans">
              BPM
            </span>
          </div>
        </button>

        {/* Separator Line */}
        <div className="w-[1px] h-4 bg-slate-800" />

        {/* Popover Opener Trigger (Chevron & Beat info) */}
        <button
          onClick={() => {
            haptics.tap();
            setIsPopoverOpen((prev) => !prev);
          }}
          className={`px-1.5 py-1.5 flex items-center justify-center transition hover:bg-white/5 rounded-r-xl ${
            isPopoverOpen ? 'bg-white/10 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
          }`}
          title={isAr ? 'فتح إعدادات المترونوم والسرعة' : 'Open Metronome Controls'}
          aria-expanded={isPopoverOpen}
        >
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-200 ${
              isPopoverOpen ? 'rotate-180 text-cyan-400' : ''
            }`}
          />
        </button>
      </div>

      {/* ======================================================== */}
      {/* FLOATING DROPDOWN POPOVER PANEL */}
      {/* ======================================================== */}
      {isPopoverOpen && (
        <div
          className={`absolute top-full mt-2 z-50 w-72 sm:w-80 max-w-[calc(100vw-20px)] p-3.5 sm:p-4 rounded-2xl bg-[#0b111e]/98 backdrop-blur-xl border border-slate-700/80 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150 ${
            isAr ? 'right-auto -left-12 sm:left-auto sm:right-0' : 'left-auto -right-12 sm:right-0 sm:left-auto'
          }`}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-base">⏱️</span>
              <div>
                <h4 className="text-xs font-black text-white">{t.metronomeTitle}</h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  {isAr ? tempoMarking.ar : tempoMarking.en}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsPopoverOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Real-time Visual Measure Dots (e.g. 4/4) */}
          <div className="mt-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-center gap-3">
            {Array.from({ length: timeSignature }).map((_, idx) => {
              const isThisBeat = isRunning && currentBeat === idx;
              const isDown = idx === 0;
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-4 h-4 rounded-full transition-all duration-75 flex items-center justify-center text-[9px] font-black ${
                      isThisBeat
                        ? isDown
                          ? 'bg-cyan-400 text-slate-950 scale-125 shadow-[0_0_12px_#22d3ee]'
                          : 'bg-emerald-400 text-slate-950 scale-125 shadow-[0_0_10px_#34d399]'
                        : isDown
                        ? 'bg-slate-700 border border-cyan-500/40 text-cyan-300'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-[8px] font-mono text-slate-400">
                    {idx === 0 ? (isAr ? 'قوي' : 'Down') : ''}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Primary Play / Stop Large Action Button */}
          <button
            onClick={handleToggle}
            className={`mt-3.5 w-full py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition shadow-lg active:scale-98 cursor-pointer ${
              isRunning
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-950/40'
                : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black shadow-emerald-950/40'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>{t.stopMetronome}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{t.startMetronome}</span>
              </>
            )}
          </button>

          {/* Main BPM Display & Quick Adjust +/- Buttons */}
          <div className="mt-3.5 flex items-center justify-between gap-1">
            <button
              onClick={() => handleAdjustBpm(-5)}
              className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-mono font-bold transition active:scale-95"
              title="-5 BPM"
            >
              -5
            </button>
            <button
              onClick={() => handleAdjustBpm(-1)}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition active:scale-95"
              title="-1 BPM"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            {/* Central Big BPM readout */}
            <div className="flex-1 text-center py-1 bg-slate-950/80 rounded-xl border border-slate-800">
              <div className="font-mono text-2xl font-black text-white leading-none">
                {bpm}
              </div>
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                BPM
              </span>
            </div>

            <button
              onClick={() => handleAdjustBpm(1)}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition active:scale-95"
              title="+1 BPM"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleAdjustBpm(5)}
              className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-mono font-bold transition active:scale-95"
              title="+5 BPM"
            >
              +5
            </button>
          </div>

          {/* Range Slider for Fluid BPM Adjustment */}
          <div className="mt-3">
            <input
              type="range"
              min={30}
              max={240}
              step={1}
              value={bpm}
              onChange={(e) => handleSetBpm(Number(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
              <span>30 (Largo)</span>
              <span>120 (Allegro)</span>
              <span>240 (Presto)</span>
            </div>
          </div>

          {/* Tap Tempo & Mute Audio Buttons Row */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {/* Tap Tempo Button */}
            <button
              onClick={handleTapTempo}
              className={`py-2 px-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                tapActive
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 scale-95 shadow-md shadow-cyan-500/50'
                  : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{t.tapTempo}</span>
            </button>

            {/* Mute Audio (Visual Only) Toggle */}
            <button
              onClick={handleToggleMute}
              className={`py-2 px-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                isMuted
                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/50'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.silentVisual}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.soundClick}</span>
                </>
              )}
            </button>
          </div>

          {/* Time Signature Buttons: 2/4, 3/4, 4/4, 6/8 */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1.5">
              <span>{t.timeSignature}</span>
              <span className="font-mono text-cyan-400">{timeSignature}/4</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[2, 3, 4, 6].map((beats) => (
                <button
                  key={beats}
                  onClick={() => handleSetTimeSignature(beats)}
                  className={`py-1 text-xs font-mono font-bold rounded-lg border transition ${
                    timeSignature === beats
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                  }`}
                >
                  {beats}/4
                </button>
              ))}
            </div>
          </div>

          {/* Quick Musical Presets */}
          <div className="mt-2.5 grid grid-cols-4 gap-1 text-[10px] font-mono">
            {[
              { label: '60', name: 'Slow' },
              { label: '80', name: 'Walk' },
              { label: '100', name: 'Mod' },
              { label: '120', name: 'Fast' },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => handleSetBpm(Number(p.label))}
                className={`py-1 rounded-md border text-center transition ${
                  bpm === Number(p.label)
                    ? 'bg-slate-800 text-cyan-300 border-cyan-500/50 font-bold'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800/60 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
