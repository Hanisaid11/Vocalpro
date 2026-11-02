import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  RotateCcw,
  Target,
  Flame,
  Gauge,
  CheckCircle2,
  Sparkles,
  Activity,
  Brain,
  Loader2,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  NoteInfo,
  PitchDetectionResult,
  VocalRangeProfile,
  PracticeSessionRecord,
  AppLanguage,
  NotationSystem,
  VibratoAnalysis,
} from '../../types/vocal';
import { midiToNoteInfo, generateNotesRange, formatNoteName } from '../../utils/noteUtils';
import { audioEngine } from '../../audio/audioEngine';
import { haptics } from '../../utils/haptics';
import { translations } from '../../utils/i18n';
import { VisualMetronomePulse } from '../Audio/VisualMetronomePulse';

interface PitchTrainerProps {
  profile: VocalRangeProfile;
  currentPitch: PitchDetectionResult | null;
  language?: AppLanguage;
  notation?: NotationSystem;
  onRecordSession: (session: PracticeSessionRecord) => void;
}

interface PitchAccuracySample {
  timestamp: number;
  centsDeviation: number;
  matchScore: number;
  clarity: number;
  isInTune: boolean;
}

export interface NoteSessionMetrics {
  targetNote: string;
  sungNote: string;
  cents: number;
  avgCentsDev: number;
  stabilityScore: number;
  clarity: number;
  rms: number;
  spectralCentroid: number;
  durationSec: number;
  sampleCount: number;
  vibrato: VibratoAnalysis | null;
  timestamp: number;
}

/**
 * Calculates a smooth, continuous percentage match score (0-100%)
 * based on cents deviation from the pitch target.
 * 0 cents = 100%, 8 cents = 95%, 20 cents = 77%, 35 cents = 48%, >90 cents = 0%
 */
const calculateMatchPercent = (centsDev: number): number => {
  const abs = Math.abs(centsDev);
  if (abs > 120) return 0;
  const score = 100 * Math.exp(-Math.pow(abs / 38, 1.7));
  return Math.max(0, Math.min(100, Math.round(score)));
};

export const PitchTrainer: React.FC<PitchTrainerProps> = ({
  profile,
  currentPitch,
  language = 'ar',
  notation = 'arabic',
  onRecordSession,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pitchHistoryRef = useRef<Array<{ freq: number | null; cents: number; isInTune: boolean }>>([]);

  const isAr = language === 'ar';
  const t = translations[language] || translations.en;

  // Training mode: 'free_tuner' | 'target_match'
  const [mode, setMode] = useState<'free_tuner' | 'target_match'>('target_match');

  // Target note state
  const [targetMidi, setTargetMidi] = useState<number>(profile.middleRegisterNote.midi);
  const targetNote = midiToNoteInfo(targetMidi);

  // Target match sustained score
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 1
  const [scoreStreak, setScoreStreak] = useState(0);
  const [notesCompleted, setNotesCompleted] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [isPlayingReference, setIsPlayingReference] = useState(false);
  const sessionStartTime = useRef(Date.now());

  // 5-Second Rolling Accuracy Sliding Window
  const recentSamplesRef = useRef<PitchAccuracySample[]>([]);
  const [fiveSecAccuracy, setFiveSecAccuracy] = useState<{
    avgMatchScore: number;
    avgCentsDev: number;
    sampleCount: number;
    stabilityScore: number;
    activeSinging: boolean;
  }>({
    avgMatchScore: 0,
    avgCentsDev: 0,
    sampleCount: 0,
    stabilityScore: 0,
    activeSinging: false,
  });

  // AI Voice Analysis States (Tone, Vocal Fold Closure, and Pitch Stability Critique)
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiCritique, setAiCritique] = useState<string | null>(null);
  const [aiMetrics, setAiMetrics] = useState<{
    tone: string;
    closure: string;
    stabilityScore: number;
    clarityPercent: number;
    avgCentsDev: number;
    durationSec: number;
  } | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showCritiqueModal, setShowCritiqueModal] = useState(false);
  const [noNoteWarning, setNoNoteWarning] = useState(false);

  // Note episode tracking refs for AI analysis
  const currentNoteEpisodeRef = useRef<{
    startTime: number;
    lastTime: number;
    samples: Array<{
      cents: number;
      clarity: number;
      rms: number;
      spectralCentroid: number;
      isInTune: boolean;
      vibrato: VibratoAnalysis | null;
    }>;
    targetNote: string;
    sungNote: string;
  }>({
    startTime: 0,
    lastTime: 0,
    samples: [],
    targetNote: '',
    sungNote: '',
  });

  const lastCompletedNoteRef = useRef<NoteSessionMetrics | null>(null);

  // Available notes for trainer (restricted within vocal range)
  const availableNotes = React.useMemo(() => {
    return generateNotesRange(profile.lowestNote.midi, profile.highestNote.midi);
  }, [profile]);

  // Instantaneous real-time pitch match calculation
  const liveMatchInfo = React.useMemo(() => {
    if (!currentPitch?.frequency || (currentPitch.clarity ?? 0) <= 0.45) {
      return null;
    }
    let centsDev = 0;
    if (mode === 'target_match') {
      const semitoneDiff = 12 * Math.log2(currentPitch.frequency / targetNote.frequency);
      centsDev = semitoneDiff * 100;
    } else {
      centsDev = currentPitch.cents;
    }
    const matchPercent = calculateMatchPercent(centsDev);
    return {
      matchPercent,
      centsDev: Math.round(centsDev * 10) / 10,
      absCentsDev: Math.round(Math.abs(centsDev) * 10) / 10,
      isInTune: Math.abs(centsDev) <= 15,
    };
  }, [currentPitch, targetNote, mode]);

  // Rolling 5-Second Accuracy Aggregator & Note Episode Tracking
  useEffect(() => {
    const now = Date.now();
    const isVoiceActive = !!(currentPitch?.frequency && (currentPitch.clarity ?? 0) > 0.45);

    if (isVoiceActive) {
      let centsDev = 0;
      if (mode === 'target_match') {
        const semitoneDiff = 12 * Math.log2(currentPitch.frequency! / targetNote.frequency);
        centsDev = semitoneDiff * 100;
      } else {
        centsDev = currentPitch.cents;
      }

      const match = calculateMatchPercent(centsDev);

      recentSamplesRef.current.push({
        timestamp: now,
        centsDeviation: Math.abs(centsDev),
        matchScore: match,
        clarity: currentPitch.clarity ?? 0.5,
        isInTune: Math.abs(centsDev) <= 15,
      });

      // Manage continuous note episode tracking
      if (
        currentNoteEpisodeRef.current.samples.length === 0 ||
        now - currentNoteEpisodeRef.current.lastTime > 750
      ) {
        currentNoteEpisodeRef.current = {
          startTime: now,
          lastTime: now,
          samples: [],
          targetNote: formatNoteName(targetNote, notation),
          sungNote: currentPitch.note ? formatNoteName(currentPitch.note, notation) : 'Note',
        };
      }

      currentNoteEpisodeRef.current.lastTime = now;
      currentNoteEpisodeRef.current.samples.push({
        cents: centsDev,
        clarity: currentPitch.clarity ?? 0.8,
        rms: currentPitch.rms ?? 0.12,
        spectralCentroid: currentPitch.spectralCentroid ?? 1500,
        isInTune: Math.abs(centsDev) <= 15,
        vibrato: currentPitch.vibrato || null,
      });

      const ep = currentNoteEpisodeRef.current;
      const count = ep.samples.length;
      if (count >= 2) {
        const sumCents = ep.samples.reduce((acc, s) => acc + Math.abs(s.cents), 0);
        const sumClarity = ep.samples.reduce((acc, s) => acc + s.clarity, 0);
        const sumRms = ep.samples.reduce((acc, s) => acc + s.rms, 0);
        const sumCentroid = ep.samples.reduce((acc, s) => acc + s.spectralCentroid, 0);
        const inTuneCount = ep.samples.filter((s) => s.isInTune).length;
        const lastSample = ep.samples[ep.samples.length - 1];

        lastCompletedNoteRef.current = {
          targetNote: ep.targetNote,
          sungNote: currentPitch.note ? formatNoteName(currentPitch.note, notation) : ep.sungNote,
          cents: Math.round(centsDev),
          avgCentsDev: Math.round((sumCents / count) * 10) / 10,
          stabilityScore: Math.round((inTuneCount / count) * 100),
          clarity: sumClarity / count,
          rms: sumRms / count,
          spectralCentroid: sumCentroid / count,
          durationSec: Math.max(0.5, (now - ep.startTime) / 1000),
          sampleCount: count,
          vibrato: lastSample?.vibrato || null,
          timestamp: now,
        };
      }
    }

    // Retain only samples within the last 5 seconds (5000 ms)
    const cutoff = now - 5000;
    recentSamplesRef.current = recentSamplesRef.current.filter((s) => s.timestamp >= cutoff);

    const samples = recentSamplesRef.current;
    if (samples.length > 0) {
      const sumMatch = samples.reduce((acc, s) => acc + s.matchScore, 0);
      const sumDev = samples.reduce((acc, s) => acc + s.centsDeviation, 0);
      const inTuneCount = samples.filter((s) => s.isInTune).length;

      const avgMatch = Math.round(sumMatch / samples.length);
      const avgDev = Math.round((sumDev / samples.length) * 10) / 10;
      const stability = Math.round((inTuneCount / samples.length) * 100);

      setFiveSecAccuracy({
        avgMatchScore: avgMatch,
        avgCentsDev: avgDev,
        sampleCount: samples.length,
        stabilityScore: stability,
        activeSinging: isVoiceActive,
      });
    } else {
      setFiveSecAccuracy((prev) => ({
        ...prev,
        activeSinging: isVoiceActive,
      }));
    }
  }, [currentPitch, targetNote, mode, notation]);

  // Target match detection logic
  useEffect(() => {
    if (mode !== 'target_match') return;

    const isCurrentInTune =
      currentPitch?.note?.midi === targetMidi &&
      Math.abs(currentPitch?.cents ?? 100) <= 14 &&
      (currentPitch?.clarity ?? 0) > 0.65;

    if (isCurrentInTune) {
      setHoldProgress((prev) => {
        const next = prev + 0.05;
        if (next >= 1) {
          // Success! Target completed
          haptics.pitchMatch();
          audioEngine.playSuccessChime();
          setScoreStreak((s) => s + 1);
          setNotesCompleted((c) => c + 1);
          setTotalAttempts((a) => a + 1);

          // Pick next random note within range
          setTimeout(() => {
            const nextIdx = Math.floor(Math.random() * availableNotes.length);
            setTargetMidi(availableNotes[nextIdx].midi);
            setHoldProgress(0);
          }, 350);

          return 0;
        }
        return next;
      });
    } else {
      setHoldProgress((prev) => Math.max(0, prev - 0.03));
    }
  }, [currentPitch, targetMidi, mode, availableNotes]);

  // Canvas Scrolling Pitch Ribbon Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const renderRibbon = () => {
      // Add current pitch to history
      pitchHistoryRef.current.push({
        freq: currentPitch?.frequency || null,
        cents: currentPitch?.cents || 0,
        isInTune: currentPitch?.isInTune || false,
      });

      if (pitchHistoryRef.current.length > 150) {
        pitchHistoryRef.current.shift();
      }

      const width = canvas.width;
      const height = canvas.height;
      const midY = height / 2;

      // Clear background
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Target zone horizontal band
      ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.fillRect(0, midY - 14, width, 28);

      // Center reference zero-line
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw pitch trail
      const history = pitchHistoryRef.current;
      const stepX = width / 150;

      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 1; i < history.length; i++) {
        const prev = history[i - 1];
        const curr = history[i];

        if (prev.freq === null || curr.freq === null) continue;

        const x1 = (i - 1) * stepX;
        const x2 = i * stepX;

        // Cents mapped from -50 to +50
        const y1 = midY - (prev.cents / 50) * (height / 2.4);
        const y2 = midY - (curr.cents / 50) * (height / 2.4);

        ctx.strokeStyle = curr.isInTune ? '#10b981' : '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Live head orb
      if (history.length > 0) {
        const last = history[history.length - 1];
        if (last.freq !== null) {
          const x = (history.length - 1) * stepX;
          const y = midY - (last.cents / 50) * (height / 2.4);

          ctx.fillStyle = last.isInTune ? '#34d399' : '#fbbf24';
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(renderRibbon);
    };

    animId = requestAnimationFrame(renderRibbon);
    return () => cancelAnimationFrame(animId);
  }, [currentPitch]);

  const playReferenceTone = () => {
    setIsPlayingReference(true);
    audioEngine.playTone(targetNote.frequency, 1.2);
    setTimeout(() => {
      setIsPlayingReference(false);
    }, 1200);
  };

  const nextRandomNote = () => {
    haptics.tap();
    const nextIdx = Math.floor(Math.random() * availableNotes.length);
    setTargetMidi(availableNotes[nextIdx].midi);
    setHoldProgress(0);
  };

  const getFeedbackTip = (score: number, active: boolean, isArabic: boolean) => {
    if (!active && fiveSecAccuracy.sampleCount === 0) {
      return isArabic
        ? '🎤 ابدأ بالغناء لمشاهدة نسبة التطابق اللحظية ومؤشر دقة النغمة لآخر 5 ثوانٍ.'
        : '🎤 Start singing to view your live match percentage and 5-second accuracy gauge.';
    }
    if (score >= 90) {
      return isArabic
        ? '🎯 ثبات نغمي استثنائي ودقة عالية جداً! حافظ على وضعية الفم ونَفَس الحجاب الحاجز المستقر.'
        : '🎯 Exceptional pitch stability! Maintain your vowel shaping and steady diaphragmatic support.';
    }
    if (score >= 75) {
      return isArabic
        ? '✨ أداء جيد جداً! انتبه للتلاشي الطفيف في نهاية النغمة وثبّت تدفق الهواء بتوازن.'
        : '✨ Very good accuracy! Sustain a continuous, balanced air flow to prevent end-of-note pitch droop.';
    }
    if (score >= 55) {
      return isArabic
        ? '💡 اقتربت من النغمة. حاول إرخاء الفك قليلاً ودعم الصوت من الحجاب الحاجز للوصول للمركز.'
        : '💡 Getting close! Relax your jaw slightly and engage core breath support to center the tone.';
    }
    return isArabic
      ? '👂 استمع جيداً للنغمة المرجعية بالضغط على زر الصوت، وتخيل رنين النغمة في رأسك قبل إخراجها.'
      : '👂 Listen to the reference tone first; audiate the pitch mentally before singing.';
  };

  /**
   * Request AI voice critique of tone, vocal fold closure, and pitch stability
   * based on the current pitch history and recent note attempt.
   */
  const handleRequestAIAnalysis = async () => {
    haptics.tap();
    setNoNoteWarning(false);
    setAnalysisError(null);

    const noteData = lastCompletedNoteRef.current;
    const recentCount = recentSamplesRef.current.length;

    // If singer hasn't sung any note yet, display a helpful hint
    if (!noteData && recentCount === 0) {
      setNoNoteWarning(true);
      setTimeout(() => setNoNoteWarning(false), 4500);
      return;
    }

    setIsAnalyzing(true);
    setShowCritiqueModal(true);

    try {
      const payload = {
        targetNote: noteData?.targetNote || formatNoteName(targetNote, notation),
        sungNote:
          noteData?.sungNote ||
          (currentPitch?.note ? formatNoteName(currentPitch.note, notation) : 'Sustained Pitch'),
        cents: noteData?.cents ?? (currentPitch?.cents || 0),
        avgCentsDev: noteData?.avgCentsDev ?? fiveSecAccuracy.avgCentsDev,
        stabilityScore: noteData?.stabilityScore ?? Math.max(10, fiveSecAccuracy.stabilityScore),
        clarity: noteData?.clarity ?? (currentPitch?.clarity || 0.82),
        rms: noteData?.rms ?? (currentPitch?.rms || 0.14),
        spectralCentroid: noteData?.spectralCentroid ?? (currentPitch?.spectralCentroid || 1550),
        durationSec: noteData?.durationSec ?? Math.max(1.2, recentCount * 0.08),
        sampleCount: noteData?.sampleCount ?? Math.max(15, recentCount),
        vibrato: noteData?.vibrato ?? currentPitch?.vibrato ?? null,
        language,
      };

      const res = await fetch('/api/coach/analyze-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      setAiCritique(data.critique || data.analysis || data.feedback);
      setAiMetrics(data.metrics || null);
      haptics.pitchMatch();
    } catch (err: any) {
      console.error('AI Analysis failed:', err);
      setAnalysisError(
        isAr
          ? 'تعذر إتمام التحليل الذكي في الوقت الحالي، يرجى إعادة المحاولة بعد لحظات.'
          : 'Could not complete AI analysis at this moment, please try again shortly.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-6 shadow-2xl flex flex-col gap-4 max-w-xl mx-auto">
      {/* Header & Mode Switch */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              {isAr ? 'محرك ضبط وتدريب النغمة التفاعلي' : 'Interactive Pitch Engine'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr ? 'كشف النغمات اللحظي بالخوارزمية وضابط النغمات الدقيق' : 'Real-time YIN pitch detection & precision tuner'}
            </p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setMode('target_match')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              mode === 'target_match' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            {isAr ? 'مطابقة الهدف' : 'Target Match'}
          </button>
          <button
            onClick={() => setMode('free_tuner')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              mode === 'free_tuner' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            {isAr ? 'ضابط النغمات' : 'Chromatic Tuner'}
          </button>
        </div>
      </div>

      {/* Visual Metronome Pulse (Breath Pacing & Pitch Hold Rhythm) */}
      <VisualMetronomePulse
        bpm={60}
        timeSignature={4}
        variant="banner"
        language={language}
        label={isAr ? 'إيقاع التنفس وثبات النغمة' : 'Breath & Pitch Sustain Pulse'}
        className="border-indigo-500/20"
      />

      {/* Target Note Banner (in Target Match mode) */}
      {mode === 'target_match' && (
        <div className="bg-gradient-to-r from-indigo-950 via-slate-950 to-slate-900 p-4 rounded-2xl border border-indigo-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={playReferenceTone}
              disabled={isPlayingReference}
              className="w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-950/60 transition active:scale-95 shrink-0"
              aria-label="Play reference audio tone"
            >
              <Volume2 className={`w-5 h-5 ${isPlayingReference ? 'animate-pulse' : ''}`} />
            </button>
            <div>
              <div className="text-[10px] uppercase font-bold text-indigo-400">
                {isAr ? 'النغمة المستهدفة' : 'Target Note'}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white font-mono">
                  {formatNoteName(targetNote, notation)}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ({Math.round(targetNote.frequency)} {t.hzUnit})
                </span>
              </div>
            </div>
          </div>

          {/* Quick Note Selector Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={targetMidi}
              onChange={(e) => {
                setTargetMidi(Number(e.target.value));
                setHoldProgress(0);
              }}
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono"
            >
              {availableNotes.map((n) => (
                <option key={n.midi} value={n.midi}>
                  {formatNoteName(n, notation)} ({Math.round(n.frequency)} {t.hzUnit})
                </option>
              ))}
            </select>
            <button
              onClick={nextRandomNote}
              title={isAr ? 'النغمة التالية العشوائية' : 'Next Random Note'}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Real-Time Pitch Ribbon Canvas Visualizer */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
        <canvas
          ref={canvasRef}
          width={480}
          height={160}
          className="w-full h-40 block"
        />

        {/* Live Centered Note Overlay */}
        <div className="absolute top-2 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${currentPitch?.note ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
          <span className="font-mono text-slate-300">
            {currentPitch?.note
              ? `${formatNoteName(currentPitch.note, notation)} (${currentPitch.frequency} ${t.hzUnit})`
              : (isAr ? 'غنِّ لتتبع نغمتك بدقة' : 'Sing to track pitch')}
          </span>
        </div>

        {/* Live Match & Cents deviation indicators top right */}
        <div className="absolute top-2 right-3 flex items-center gap-1.5">
          {liveMatchInfo && (
            <div
              className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border backdrop-blur-md transition-all ${
                liveMatchInfo.matchPercent >= 85
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-900/30'
                  : liveMatchInfo.matchPercent >= 60
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50'
                  : 'bg-amber-950/80 text-amber-300 border-amber-500/50'
              }`}
            >
              <span className="text-[10px] opacity-75 mr-1">{isAr ? 'تطابق' : 'Match'}:</span>
              {liveMatchInfo.matchPercent}%
            </div>
          )}
          {currentPitch?.note && (
            <div
              className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border backdrop-blur-md ${
                currentPitch.isInTune
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                  : 'bg-amber-950/80 text-amber-300 border-amber-500/50'
              }`}
            >
              {currentPitch.cents > 0 ? `+${currentPitch.cents}` : currentPitch.cents} {isAr ? 'سنت' : 'cents'}
            </div>
          )}
        </div>
      </div>

      {/* Real-time Percentage Match & 5-Second Rolling Accuracy Gauge */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-col gap-3">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>{isAr ? 'مؤشر الدقة ومطابقة النغمة' : 'Pitch Accuracy & Match Gauge'}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 lowercase">
                  {isAr ? 'لحظي + 5 ثوانٍ' : 'real-time & 5s avg'}
                </span>
              </h3>
            </div>
          </div>
          {/* Live Voice Indicator */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <span className={`w-2 h-2 rounded-full ${fiveSecAccuracy.activeSinging ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <span className={fiveSecAccuracy.activeSinging ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
              {fiveSecAccuracy.activeSinging ? (isAr ? 'صوت نشط' : 'Singing Active') : (isAr ? 'في انتظار الغناء' : 'Listening...')}
            </span>
          </div>
        </div>

        {/* Main Stats Grid: Live Match + 5-Second Circular Gauge */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          {/* Left Column: Real-Time Instant Match */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">
                {isAr ? 'نسبة التطابق اللحظية' : 'Live Match Score'}
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-3xl font-black font-mono transition-colors duration-150 ${
                    !liveMatchInfo
                      ? 'text-slate-500'
                      : liveMatchInfo.matchPercent >= 85
                      ? 'text-emerald-400'
                      : liveMatchInfo.matchPercent >= 60
                      ? 'text-cyan-400'
                      : 'text-amber-400'
                  }`}
                >
                  {liveMatchInfo ? `${liveMatchInfo.matchPercent}%` : '— %'}
                </span>
                {liveMatchInfo && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    ({liveMatchInfo.centsDev > 0 ? `+${liveMatchInfo.centsDev}` : liveMatchInfo.centsDev}¢)
                  </span>
                )}
              </div>
              {/* Dynamic Status Tag */}
              <div className="text-[10px] font-medium">
                {!liveMatchInfo ? (
                  <span className="text-slate-400">{isAr ? 'غنِّ باتجاه النغمة' : 'Sing towards note'}</span>
                ) : liveMatchInfo.isInTune ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 inline" /> {isAr ? 'متطابق بدقة تامة 🎯' : 'Perfect Match 🎯'}
                  </span>
                ) : liveMatchInfo.centsDev > 0 ? (
                  <span className="text-amber-400">{isAr ? 'مرتفع قليلاً (حاد ♯)' : 'Slightly Sharp ♯'}</span>
                ) : (
                  <span className="text-amber-400">{isAr ? 'منخفض قليلاً (هابط ♭)' : 'Slightly Flat ♭'}</span>
                )}
              </div>
            </div>

            {/* Mini Visual Match Progress Bar */}
            <div className="w-20 flex flex-col items-end gap-1.5">
              <div className="w-full bg-slate-900 rounded-full h-2 border border-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-100 ${
                    !liveMatchInfo
                      ? 'w-0'
                      : liveMatchInfo.matchPercent >= 85
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                      : liveMatchInfo.matchPercent >= 60
                      ? 'bg-cyan-400'
                      : 'bg-amber-400'
                  }`}
                  style={{ width: `${liveMatchInfo?.matchPercent || 0}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-400 font-mono">
                {mode === 'target_match'
                  ? (isAr ? 'مع الهدف' : 'vs Target')
                  : (isAr ? 'مع النغمة' : 'vs Pitch')}
              </span>
            </div>
          </div>

          {/* Right Column: 5-Second Accuracy Rolling Gauge */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center gap-3.5">
            {/* Circular SVG Gauge */}
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg className="w-16 h-16 -rotate-90 transform" viewBox="0 0 72 72">
                {/* Background Track */}
                <circle
                  cx="36"
                  cy="36"
                  r="28"
                  className="stroke-slate-800"
                  strokeWidth="5"
                  fill="none"
                />
                {/* Progress Ring */}
                <circle
                  cx="36"
                  cy="36"
                  r="28"
                  stroke={
                    fiveSecAccuracy.sampleCount === 0
                      ? '#334155'
                      : fiveSecAccuracy.avgMatchScore >= 85
                      ? '#10b981'
                      : fiveSecAccuracy.avgMatchScore >= 65
                      ? '#06b6d4'
                      : '#f59e0b'
                  }
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={175.9}
                  strokeDashoffset={
                    fiveSecAccuracy.sampleCount === 0
                      ? 175.9
                      : 175.9 * (1 - Math.min(100, Math.max(0, fiveSecAccuracy.avgMatchScore)) / 100)
                  }
                  fill="none"
                  className="transition-all duration-300 ease-out"
                />
              </svg>

              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-sm font-extrabold font-mono text-white leading-none">
                  {fiveSecAccuracy.sampleCount > 0 ? `${fiveSecAccuracy.avgMatchScore}%` : '—'}
                </span>
                <span className="text-[8px] uppercase font-bold text-slate-400 tracking-tighter mt-0.5">
                  5s Avg
                </span>
              </div>
            </div>

            {/* 5-Second Breakdown Metrics */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">{isAr ? 'معدل الدقة (5 ثوانٍ):' : 'Accuracy (last 5s):'}</span>
                <span className="font-bold text-white font-mono">
                  {fiveSecAccuracy.sampleCount > 0 ? `${fiveSecAccuracy.avgMatchScore}%` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">{isAr ? 'متوسط الانحراف:' : 'Avg Deviation:'}</span>
                <span className="font-mono text-cyan-300 font-semibold text-[10px]">
                  {fiveSecAccuracy.sampleCount > 0 ? `±${fiveSecAccuracy.avgCentsDev}¢` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">{isAr ? 'ثبات النغمة:' : 'Pitch Stability:'}</span>
                <span className="font-mono text-emerald-300 font-semibold text-[10px]">
                  {fiveSecAccuracy.sampleCount > 0 ? `${fiveSecAccuracy.stabilityScore}%` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Constructive Instant Coaching Feedback Bar */}
        <div className="bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-slate-300 text-[11px] leading-relaxed">
            {getFeedbackTip(fiveSecAccuracy.avgMatchScore, fiveSecAccuracy.activeSinging, isAr)}
          </span>
        </div>

        {/* AI Analysis Button: Critiques Tone, Closure, and Stability */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
          <button
            onClick={handleRequestAIAnalysis}
            disabled={isAnalyzing}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-black text-xs sm:text-sm flex items-center justify-between shadow-lg shadow-indigo-950/60 active:scale-98 transition duration-150 disabled:opacity-60 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 text-cyan-300 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
              )}
              <span>
                {isAnalyzing
                  ? (isAr ? 'جاري تحليل النبرة والإطباق والثبات...' : 'Analyzing Tone, Closure & Stability...')
                  : (isAr ? 'تحليل النغمة بالذكاء الاصطناعي (AI Analysis) ✨' : 'AI Analysis (Tone, Closure & Stability) ✨')}
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-mono uppercase tracking-wider hidden sm:inline-block">
              {isAr ? 'نبرة · إطباق · ثبات' : 'Tone · Closure · Stability'}
            </span>
          </button>

          {noNoteWarning && (
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {isAr
                  ? 'غنِّ نغمة في الميكروفون أولاً (أو اثبت على النغمة المستهدفة)، ثم اضغط للتحليل!'
                  : 'Sing a note into your mic first (or hold the target note), then press AI Analysis!'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Target Match Hold Progress (when in target mode) */}
      {mode === 'target_match' && (
        <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">
              {isAr ? 'طابق واثبت على النغمة المستهدفة:' : 'Match & Sustain Target Pitch:'}
            </span>
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <Flame className="w-3.5 h-3.5" />
              <span>{isAr ? 'التتابع' : 'Streak'}: {scoreStreak}</span>
            </div>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-2.5 rounded-full transition-all duration-100 ease-out"
              style={{ width: `${Math.min(100, Math.round(holdProgress * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* Precision Tuner Gauge (-50 to +50 cents) */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col items-center">
        {/* Note display */}
        <div className="text-4xl font-black text-white font-mono-numbers">
          {currentPitch?.note ? formatNoteName(currentPitch.note, notation) : '—'}
        </div>

        {/* Cents meter bar */}
        <div className="w-full max-w-xs mt-3">
          <div className="relative h-6 bg-slate-900 rounded-full border border-slate-800 flex items-center px-1 overflow-hidden">
            {/* Center target zone (+/- 10 cents) */}
            <div className="absolute left-1/2 -translate-x-1/2 w-8 h-full bg-emerald-500/20 border-x border-emerald-500/40" />
            <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-full bg-indigo-500" />

            {/* Needle / Ball */}
            {currentPitch?.note && (
              <div
                className={`absolute w-4 h-4 rounded-full shadow-lg transition-all duration-75 -translate-x-1/2 ${
                  currentPitch.isInTune
                    ? 'bg-emerald-400 ring-4 ring-emerald-500/30'
                    : 'bg-amber-400 ring-2 ring-amber-500/30'
                }`}
                style={{
                  left: `${Math.max(5, Math.min(95, 50 + (currentPitch.cents / 50) * 45))}%`,
                }}
              />
            )}
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1 px-1">
            <span>{isAr ? '-50 سنت (هابط ♭)' : '-50¢ (Flat)'}</span>
            <span className="text-emerald-400 font-bold">{isAr ? '0 نغمة صحيحة' : '0¢ In-Tune'}</span>
            <span>{isAr ? '+50 سنت (حاد ♯)' : '+50¢ (Sharp)'}</span>
          </div>
        </div>
      </div>

      {/* AI Voice Critique Modal */}
      {showCritiqueModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in select-none">
          <div className={`w-full max-w-lg bg-slate-900 border border-indigo-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto ${
            isAr ? 'text-right' : 'text-left'
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shrink-0">
                  <Brain className="w-5 h-5 text-cyan-200" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>{isAr ? 'التقرير الصوتي الذكي' : 'AI Vocal Critique'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                      Gemini Voice AI
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isAr
                      ? 'تقييم فوري ومفصل للنبرة، إطباق الحبال الصوتية، وثبات التردد'
                      : 'Textual critique of tone, vocal fold closure, and pitch stability'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCritiqueModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Loading State */}
            {isAnalyzing && (
              <div className="py-10 flex flex-col items-center justify-center gap-3 text-center">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-cyan-300 animate-spin" />
                  </div>
                  <div className="absolute inset-0 rounded-2xl border border-cyan-400 animate-ping opacity-25" />
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-bold text-white block">
                    {isAr ? 'يقوم خبير الصوت بفحص النغمة...' : 'Analyzing vocal performance...'}
                  </span>
                  <span className="text-xs text-slate-400 block max-w-xs">
                    {isAr
                      ? 'تحليل التردد، نقاء الرنين الهارموني، إطباق الحبال الصوتية، وثبات النفس'
                      : 'Evaluating pitch history, closure adduction, and resonance timbre'}
                  </span>
                </div>
              </div>
            )}

            {/* Error State */}
            {analysisError && !isAnalyzing && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-700/50 text-rose-300 text-xs flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4" />
                  <span>{isAr ? 'تنبيه الاتصال' : 'Connection Notice'}</span>
                </div>
                <p>{analysisError}</p>
                <button
                  onClick={handleRequestAIAnalysis}
                  className="self-end px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition flex items-center gap-1.5 text-xs cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{isAr ? 'إعادة المحاولة' : 'Try Again'}</span>
                </button>
              </div>
            )}

            {/* Critique Result Card */}
            {aiCritique && !isAnalyzing && (
              <div className="flex flex-col gap-3.5 animate-in fade-in">
                {/* Note summary banner */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      {isAr ? 'النغمة التي تم تقييمها' : 'Evaluated Pitch'}
                    </span>
                    <span className="text-lg font-black text-white font-mono">
                      {lastCompletedNoteRef.current?.sungNote || (currentPitch?.note ? formatNoteName(currentPitch.note, notation) : formatNoteName(targetNote, notation))}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      {aiMetrics?.stabilityScore ?? fiveSecAccuracy.stabilityScore}% {isAr ? 'ثبات' : 'Stability'}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                      ±{Math.abs(aiMetrics?.avgCentsDev ?? fiveSecAccuracy.avgCentsDev)}¢ {isAr ? 'انحراف' : 'error'}
                    </span>
                  </div>
                </div>

                {/* 3 Core Vocal Dimensions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {/* 1. Tone & Resonance */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/30 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px]">
                      <span>🎙️</span>
                      <span>{isAr ? 'النبرة والرنين' : 'Tone & Resonance'}</span>
                    </div>
                    <span className="text-[10px] text-slate-300 leading-tight">
                      {aiMetrics?.tone || (isAr ? 'رنين دافئ متوازن' : 'Balanced resonance')}
                    </span>
                  </div>

                  {/* 2. Vocal Fold Closure */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-cyan-500/30 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-[11px]">
                      <span>🧬</span>
                      <span>{isAr ? 'إطباق الحبال' : 'Vocal Fold Closure'}</span>
                    </div>
                    <span className="text-[10px] text-slate-300 leading-tight">
                      {aiMetrics?.closure || (isAr ? 'إطباق محكم نقي' : 'Clean adduction')}
                    </span>
                  </div>

                  {/* 3. Pitch Stability */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/30 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[11px]">
                      <span>🎯</span>
                      <span>{isAr ? 'ثبات النغمة' : 'Pitch Stability'}</span>
                    </div>
                    <span className="text-[10px] text-slate-300 leading-tight">
                      {aiMetrics?.stabilityScore ?? fiveSecAccuracy.stabilityScore}% {isAr ? 'استقرار ممتاز' : 'Solid consistency'}
                    </span>
                  </div>
                </div>

                {/* Full Textual Critique from Gemini */}
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-indigo-500/30 text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-inner">
                  {aiCritique}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={handleRequestAIAnalysis}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إعادة التحليل' : 'Re-Analyze'}</span>
                  </button>

                  <button
                    onClick={() => setShowCritiqueModal(false)}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    {isAr ? 'إغلاق ومتابعة التدريب' : 'Done & Continue Practice'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
