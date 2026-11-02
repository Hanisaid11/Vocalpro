import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Plus, Minus, Zap } from 'lucide-react';
import { metronome } from '../../audio/metronome';
import { haptics } from '../../utils/haptics';
import { AppLanguage } from '../../types/vocal';

export type MetronomeVariant = 'badge' | 'banner' | 'orb-standalone' | 'full';

export interface VisualMetronomePulseProps {
  bpm?: number;
  timeSignature?: number; // 2, 3, 4, 6
  variant?: MetronomeVariant;
  isActive?: boolean;
  isMuted?: boolean;
  onToggleActive?: (active: boolean) => void;
  onToggleMute?: (muted: boolean) => void;
  onBpmChange?: (newBpm: number) => void;
  language?: AppLanguage;
  label?: string;
  showControls?: boolean;
  className?: string;
}

export const VisualMetronomePulse: React.FC<VisualMetronomePulseProps> = ({
  bpm = 60,
  timeSignature = 4,
  variant = 'banner',
  isActive: externalIsActive,
  isMuted: externalIsMuted,
  onToggleActive,
  onToggleMute,
  onBpmChange,
  language = 'ar',
  label,
  showControls = true,
  className = '',
}) => {
  const isAr = language === 'ar';

  // Local state for self-contained or synchronized mode
  const [internalActive, setInternalActive] = useState<boolean>(metronome.getIsRunning());
  const [internalMuted, setInternalMuted] = useState<boolean>(metronome.isSoundMuted());
  const [internalBpm, setInternalBpm] = useState<number>(bpm);
  const [currentBeat, setCurrentBeat] = useState<number>(-1); // 0-indexed: 0 is beat 1
  const [pulseKey, setPulseKey] = useState<number>(0);
  const [measureCount, setMeasureCount] = useState<number>(1);
  const measureBeatRef = useRef<number>(0);

  const active = externalIsActive !== undefined ? externalIsActive : internalActive;
  const muted = externalIsMuted !== undefined ? externalIsMuted : internalMuted;
  const currentBpm = internalBpm;

  // Sync external props with metronome engine
  useEffect(() => {
    if (bpm && bpm !== internalBpm) {
      setInternalBpm(bpm);
      metronome.setBpm(bpm);
    }
  }, [bpm]);

  useEffect(() => {
    metronome.setTimeSignature(timeSignature);
  }, [timeSignature]);

  useEffect(() => {
    metronome.setMuted(muted);
  }, [muted]);

  // Synchronize running state if externally controlled
  useEffect(() => {
    if (externalIsActive !== undefined) {
      if (externalIsActive && !metronome.getIsRunning()) {
        metronome.start(bpm);
      } else if (!externalIsActive && metronome.getIsRunning()) {
        metronome.stop();
      }
    }
  }, [externalIsActive, bpm]);

  // Subscribe to audio engine beat events
  useEffect(() => {
    const unsubscribe = metronome.subscribe((beat, totalBeats) => {
      setCurrentBeat(beat);
      if (beat >= 0) {
        setPulseKey((prev) => prev + 1);
        if (beat === 0) {
          measureBeatRef.current += 1;
          setMeasureCount(measureBeatRef.current);
        }
      } else {
        measureBeatRef.current = 0;
        setMeasureCount(1);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleToggleActive = useCallback(() => {
    haptics.tap();
    const nextState = !active;
    if (nextState) {
      metronome.start(currentBpm);
      setInternalActive(true);
    } else {
      metronome.stop();
      setInternalActive(false);
      setCurrentBeat(-1);
    }
    onToggleActive?.(nextState);
  }, [active, currentBpm, onToggleActive]);

  const handleToggleMute = useCallback(() => {
    haptics.tap();
    const nextMuted = !muted;
    metronome.setMuted(nextMuted);
    setInternalMuted(nextMuted);
    onToggleMute?.(nextMuted);
  }, [muted, onToggleMute]);

  const handleBpmAdjust = useCallback(
    (delta: number) => {
      haptics.tap();
      const nextBpm = Math.max(30, Math.min(240, currentBpm + delta));
      setInternalBpm(nextBpm);
      metronome.setBpm(nextBpm);
      onBpmChange?.(nextBpm);
    },
    [currentBpm, onBpmChange]
  );

  const isDownbeat = currentBeat === 0;
  const isBeating = active && currentBeat >= 0;

  // ---------------------------------------------------------------------------
  // VARIANT 1: BADGE (Compact inline HUD indicator for active stages and headers)
  // ---------------------------------------------------------------------------
  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-md ${className}`}
        dir="ltr"
      >
        {/* Glowing Orb */}
        <div className="relative flex items-center justify-center w-5 h-5">
          {/* Outward ripple ring */}
          {isBeating && (
            <span
              key={`badge-ring-${pulseKey}`}
              className={`absolute inset-0 rounded-full animate-ping opacity-60 ${
                isDownbeat ? 'bg-cyan-400' : 'bg-amber-400'
              }`}
            />
          )}
          {/* Main glowing dot */}
          <span
            className={`w-3.5 h-3.5 rounded-full transition-all duration-75 flex items-center justify-center font-black text-[9px] ${
              !active
                ? 'bg-slate-700 text-slate-400'
                : isDownbeat
                ? 'bg-cyan-400 text-slate-950 scale-125 shadow-[0_0_12px_#22d3ee]'
                : 'bg-amber-400 text-slate-950 scale-110 shadow-[0_0_8px_#fbbf24]'
            }`}
          >
            {active && currentBeat >= 0 ? currentBeat + 1 : '•'}
          </span>
        </div>

        {/* BPM & Beat Status */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="font-bold text-white">{currentBpm}</span>
          <span className="text-[10px] text-slate-400 font-sans">BPM</span>
          <span className="text-slate-600">|</span>
          <span className="text-[10px] font-bold text-cyan-300">
            {timeSignature}/4
          </span>
        </div>

        {/* Silent vs Click icon */}
        <button
          onClick={handleToggleMute}
          title={
            muted
              ? isAr
                ? 'النبض بصري صامت (اضغط لتفعيل الصوت)'
                : 'Silent visual pulse (Click for audio)'
              : isAr
              ? 'صوت الخشب مفعل (اضغط لكتم الصوت)'
              : 'Woodblock click active (Click to mute)'
          }
          className={`p-1 rounded-lg transition ${
            muted ? 'text-amber-400/80 hover:text-amber-300' : 'text-cyan-400 hover:text-cyan-300'
          }`}
        >
          {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {showControls && (
          <button
            onClick={handleToggleActive}
            className={`p-1 rounded-lg transition ${
              active ? 'text-rose-400 hover:text-rose-300' : 'text-emerald-400 hover:text-emerald-300'
            }`}
            title={active ? (isAr ? 'إيقاف المترونوم' : 'Stop') : isAr ? 'تشغيل المترونوم' : 'Start'}
          >
            {active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VARIANT 2: ORB-STANDALONE (Dedicated sight-reading rhythmic pulse hero)
  // ---------------------------------------------------------------------------
  if (variant === 'orb-standalone') {
    return (
      <div
        className={`flex flex-col items-center justify-center p-4 rounded-3xl bg-gradient-to-b from-slate-900 to-[#070b14] border border-cyan-500/20 shadow-xl relative overflow-hidden ${className}`}
      >
        {/* Background glow ambiance */}
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
            active && isDownbeat
              ? 'opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500 via-transparent to-transparent'
              : active
              ? 'opacity-15 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500 via-transparent to-transparent'
              : 'opacity-0'
          }`}
        />

        {/* Top Header info */}
        <div className="flex items-center justify-between w-full mb-3 text-xs z-10">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <Zap className={`w-3.5 h-3.5 ${active ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
            <span>{label || (isAr ? 'المترونوم البصري التفاعلي' : 'Visual Rhythm Pulse')}</span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300 bg-black/40 px-2.5 py-0.5 rounded-full border border-white/5">
            <span>{isAr ? `المازورة ${measureCount}` : `Bar ${measureCount}`}</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400 font-bold">{currentBpm} BPM</span>
          </div>
        </div>

        {/* The Central Glowing Orb with Multi-Layer Concentric Rings */}
        <div className="relative flex items-center justify-center my-4 w-32 h-32 z-10">
          {/* Layer 3: Giant outer aura on beat */}
          {isBeating && (
            <div
              key={`ring3-${pulseKey}`}
              className={`absolute inset-0 rounded-full animate-ping opacity-25 ${
                isDownbeat ? 'bg-cyan-400 ring-8 ring-cyan-300/40' : 'bg-amber-400 ring-4 ring-amber-300/30'
              }`}
              style={{ animationDuration: '0.8s' }}
            />
          )}

          {/* Layer 2: Medium pulsating halo */}
          <div
            className={`absolute w-24 h-24 rounded-full transition-all duration-100 ${
              !active
                ? 'bg-slate-800/40 border border-slate-700/50 scale-90'
                : isDownbeat
                ? 'bg-cyan-500/25 border-2 border-cyan-400 scale-125 shadow-[0_0_30px_rgba(6,182,212,0.6)]'
                : 'bg-amber-500/20 border border-amber-400 scale-110 shadow-[0_0_18px_rgba(245,158,11,0.5)]'
            }`}
          />

          {/* Layer 1: Core glowing pulsating sphere */}
          <div
            className={`w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all duration-75 select-none ${
              !active
                ? 'bg-slate-800 text-slate-500 border border-slate-700'
                : isDownbeat
                ? 'bg-gradient-to-tr from-cyan-500 to-teal-300 text-slate-950 font-black shadow-[0_0_24px_#22d3ee] scale-110'
                : 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black shadow-[0_0_16px_#fbbf24] scale-100'
            }`}
          >
            {active && currentBeat >= 0 ? (
              <>
                <span className="text-2xl font-black leading-none font-mono">
                  {currentBeat + 1}
                </span>
                <span className="text-[9px] font-sans font-bold uppercase tracking-tight opacity-80">
                  {isDownbeat ? (isAr ? 'الضربة 1' : 'Downbeat') : (isAr ? 'نبضة' : 'Beat')}
                </span>
              </>
            ) : (
              <Zap className="w-6 h-6 text-slate-500" />
            )}
          </div>
        </div>

        {/* 4-Beat LED Dots strip */}
        <div className="flex items-center gap-2 mb-3 z-10" dir="ltr">
          {Array.from({ length: timeSignature }).map((_, idx) => {
            const isCurrent = active && currentBeat === idx;
            const isFirst = idx === 0;

            return (
              <div
                key={idx}
                className={`flex flex-col items-center gap-1 transition-all duration-75 ${
                  isCurrent ? 'scale-110' : 'scale-100'
                }`}
              >
                <div
                  className={`w-7 h-2.5 rounded-full transition-all duration-75 ${
                    isCurrent
                      ? isFirst
                        ? 'bg-cyan-400 shadow-[0_0_12px_#22d3ee]'
                        : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                      : 'bg-slate-800/80 border border-slate-700/60'
                  }`}
                />
                <span
                  className={`text-[9px] font-mono font-bold ${
                    isCurrent
                      ? isFirst
                        ? 'text-cyan-300'
                        : 'text-amber-300'
                      : 'text-slate-500'
                  }`}
                >
                  {idx + 1}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer controls: BPM + Play/Stop + Mute/Sound */}
        {showControls && (
          <div className="flex flex-wrap items-center justify-between w-full gap-2 pt-2 border-t border-slate-800/80 z-10">
            {/* BPM Adjuster */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800" dir="ltr">
              <button
                onClick={() => handleBpmAdjust(-5)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs"
                title="-5 BPM"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <div className="px-2 text-center min-w-[54px]">
                <div className="text-xs font-mono font-bold text-white">{currentBpm}</div>
                <div className="text-[8px] text-slate-400 uppercase font-sans">BPM</div>
              </div>
              <button
                onClick={() => handleBpmAdjust(+5)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs"
                title="+5 BPM"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleMute}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  muted
                    ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title={muted ? (isAr ? 'الصوت مكتوم (نبض ضوئي فقط)' : 'Muted (visual only)') : (isAr ? 'صوت نقر الخشب مفعل' : 'Audible click')}
              >
                {muted ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
                <span className="hidden sm:inline">
                  {muted ? (isAr ? 'ضوئي فقط' : 'Visual Only') : (isAr ? 'صوت' : 'Click On')}
                </span>
              </button>

              <button
                onClick={handleToggleActive}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow ${
                  active
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_14px_rgba(244,63,94,0.5)]'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                }`}
              >
                {active ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>{isAr ? 'إيقاف النبض' : 'Pause'}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isAr ? 'بدء الإيقاع' : 'Start Pulse'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VARIANT 3: BANNER / FULL (Balanced horizontal control bar with glowing orb)
  // ---------------------------------------------------------------------------
  return (
    <div
      className={`p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-[#0a0f1d] via-[#090d18] to-[#0a0f1d] border border-cyan-500/25 shadow-lg flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      {/* Left: Glowing Pulse Orb & Indicator */}
      <div className="flex items-center gap-3">
        {/* Pulsing Core */}
        <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
          {/* Ripple rings on beat */}
          {isBeating && (
            <span
              key={`banner-ring-${pulseKey}`}
              className={`absolute inset-0 rounded-full animate-ping opacity-50 ${
                isDownbeat ? 'bg-cyan-400' : 'bg-amber-400'
              }`}
              style={{ animationDuration: '0.6s' }}
            />
          )}

          {/* Center glowing circle */}
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center font-black font-mono text-sm transition-all duration-75 select-none ${
              !active
                ? 'bg-slate-800 text-slate-500 border border-slate-700'
                : isDownbeat
                ? 'bg-gradient-to-br from-cyan-400 to-teal-400 text-slate-950 scale-110 shadow-[0_0_18px_#22d3ee]'
                : 'bg-gradient-to-br from-amber-400 to-yellow-400 text-slate-950 scale-100 shadow-[0_0_12px_#fbbf24]'
            }`}
          >
            {active && currentBeat >= 0 ? currentBeat + 1 : '♪'}
          </div>
        </div>

        {/* Labels & 4-Beat LED Dots */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-white">
              {label || (isAr ? 'المترونوم البصري' : 'Visual Metronome')}
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-cyan-950/80 border border-cyan-800 text-cyan-300">
              {timeSignature}/4
            </span>
            {muted && (
              <span className="text-[9px] font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/60">
                {isAr ? 'ضوئي صامت' : 'Silent'}
              </span>
            )}
          </div>

          {/* LED Step Dots */}
          <div className="flex items-center gap-1.5" dir="ltr">
            {Array.from({ length: timeSignature }).map((_, idx) => {
              const isCurrent = active && currentBeat === idx;
              const isFirst = idx === 0;

              return (
                <div
                  key={idx}
                  className={`w-5 h-1.5 rounded-full transition-all duration-75 ${
                    isCurrent
                      ? isFirst
                        ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee] scale-110'
                        : 'bg-amber-400 shadow-[0_0_8px_#fbbf24] scale-105'
                      : 'bg-slate-800 border border-slate-700/60'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Controls (BPM stepper, Sound toggle, Play/Pause) */}
      <div className="flex items-center gap-2">
        {showControls && (
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5" dir="ltr">
            <button
              onClick={() => handleBpmAdjust(-4)}
              className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs"
              title="-4 BPM"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="px-2 font-mono font-bold text-xs text-white min-w-[42px] text-center">
              {currentBpm}
            </span>
            <button
              onClick={() => handleBpmAdjust(+4)}
              className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs"
              title="+4 BPM"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Audio Mute / Unmute Button */}
        <button
          onClick={handleToggleMute}
          className={`p-1.5 rounded-xl border transition ${
            muted
              ? 'bg-amber-950/50 border-amber-700/60 text-amber-300 hover:bg-amber-900/50'
              : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
          }`}
          title={
            muted
              ? isAr
                ? 'النبض بصري صامت (اضغط لتفعيل الصوت)'
                : 'Muted visual pulse (Click to unmute sound)'
              : isAr
              ? 'صوت النقر مفعل (اضغط للوضع الصامت لمنع التداخل مع المايكروفون)'
              : 'Audible click active (Click to mute for singing)'
          }
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Play / Stop Button */}
        {showControls && (
          <button
            onClick={handleToggleActive}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow ${
              active
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
            }`}
          >
            {active ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>{isAr ? 'إيقاف' : 'Stop'}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isAr ? 'تشغيل' : 'Start'}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
