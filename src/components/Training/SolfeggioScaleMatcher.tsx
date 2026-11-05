import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Square,
  Volume2,
  Mic,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Clock,
  Target,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';
import {
  NoteInfo,
  VocalRangeProfile,
  PitchDetectionResult,
  PracticeSessionRecord,
  AppLanguage,
  NotationSystem,
} from '../../types/vocal';
import { midiToNoteInfo, formatNoteName } from '../../utils/noteUtils';
import { audioEngine } from '../../audio/audioEngine';
import { haptics } from '../../utils/haptics';
import { translations } from '../../utils/i18n';
import { fire3StarCelebration } from '../../utils/confetti';
import { VisualMetronomePulse } from '../Audio/VisualMetronomePulse';

export type ScaleDirection = 'ascending' | 'descending' | 'both';

export type NoteDurationInterval = 'short' | 'medium' | 'long' | 'custom';

export interface DurationIntervalConfig {
  id: NoteDurationInterval;
  seconds: number;
  labelAr: string;
  labelEn: string;
  tempoBpm: number;
  tempoItalian: string;
  tempoNameAr: string;
  tempoNameEn: string;
  descAr: string;
  descEn: string;
  icon: string;
  colorScheme: {
    borderActive: string;
    bgActive: string;
    textActive: string;
    badge: string;
  };
}

export const DURATION_INTERVALS: DurationIntervalConfig[] = [
  {
    id: 'short',
    seconds: 1.2,
    labelAr: 'فاصل قصير (سريع)',
    labelEn: 'Short (Fast)',
    tempoBpm: 120,
    tempoItalian: 'Allegro',
    tempoNameAr: 'أليجرو (سريع 120 BPM)',
    tempoNameEn: 'Allegro (Fast 120 BPM)',
    descAr: '1.2 ثانية / نغمة · للرشاقة الصوتية والانتقال السريع والتمارين الإيقاعية الحركية',
    descEn: '1.2s per note · Vocal agility, fast register reflex & rhythmic agility',
    icon: '⚡',
    colorScheme: {
      borderActive: 'border-amber-400 ring-2 ring-amber-400/40',
      bgActive: 'bg-amber-500/20',
      textActive: 'text-amber-300',
      badge: 'bg-amber-500/25 text-amber-300 border-amber-500/40',
    },
  },
  {
    id: 'medium',
    seconds: 2.2,
    labelAr: 'فاصل متوسط (معتدل)',
    labelEn: 'Medium (Balanced)',
    tempoBpm: 80,
    tempoItalian: 'Andante',
    tempoNameAr: 'أندانتيه (معتدل 80 BPM)',
    tempoNameEn: 'Andante (Moderate 80 BPM)',
    descAr: '2.2 ثانية / نغمة · زمن غنائي متوازن قياسي للتركيز ودقة التطابق النغمي',
    descEn: '2.2s per note · Balanced cantabile phrasing & steady pitch stability',
    icon: '🎵',
    colorScheme: {
      borderActive: 'border-cyan-400 ring-2 ring-cyan-400/40',
      bgActive: 'bg-cyan-500/20',
      textActive: 'text-cyan-300',
      badge: 'bg-cyan-500/25 text-cyan-300 border-cyan-500/40',
    },
  },
  {
    id: 'long',
    seconds: 3.8,
    labelAr: 'فاصل طويل (مديد)',
    labelEn: 'Long (Sustained)',
    tempoBpm: 50,
    tempoItalian: 'Adagio',
    tempoNameAr: 'أداجيو (هادئ 50 BPM)',
    tempoNameEn: 'Adagio (Slow 50 BPM)',
    descAr: '3.8 ثانية / نغمة · لتثبيت النفس وتمرين دعم الحجاب الحاجز واستقرار الطبقة',
    descEn: '3.8s per note · Deep breath support, sustained lung capacity & pitch hold',
    icon: '🧘',
    colorScheme: {
      borderActive: 'border-purple-400 ring-2 ring-purple-400/40',
      bgActive: 'bg-purple-500/20',
      textActive: 'text-purple-300',
      badge: 'bg-purple-500/25 text-purple-300 border-purple-500/40',
    },
  },
];

export interface SolfeggioNoteStep {
  index: number;
  solfege: string;
  arabic: string;
  midi: number;
  frequency: number;
  noteName: string;
}

export interface NoteEvaluationResult {
  step: SolfeggioNoteStep;
  accuracy: number; // 0 - 100%
  avgCents: number;
  inTuneSamples: number;
  totalSamples: number;
  status: 'perfect' | 'good' | 'sharp' | 'flat' | 'missed';
}

interface SolfeggioScaleMatcherProps {
  profile: VocalRangeProfile;
  currentPitch: PitchDetectionResult | null;
  language?: AppLanguage;
  notation?: NotationSystem;
  onRecordSession?: (session: PracticeSessionRecord) => void;
  onBackToPiano?: () => void;
}

export const SolfeggioScaleMatcher: React.FC<SolfeggioScaleMatcherProps> = ({
  profile,
  currentPitch,
  language = 'ar',
  notation = 'arabic',
  onRecordSession,
  onBackToPiano,
}) => {
  const isAr = language === 'ar';
  const t = translations[language] || translations.en;

  // Configuration States
  const [selectedOctave, setSelectedOctave] = useState<number>(() => {
    // Default to octave matching user's middle register, or Octave 4
    const midOctave = profile.middleRegisterNote?.octave || 4;
    return Math.max(2, Math.min(5, midOctave));
  });

  // Duration Interval Selector State: 'short' (1.2s), 'medium' (2.2s), 'long' (3.8s)
  const [durationInterval, setDurationInterval] = useState<NoteDurationInterval>('medium');
  const [noteDurationSec, setNoteDurationSec] = useState<number>(2.2);
  const [scaleDirection, setScaleDirection] = useState<ScaleDirection>('ascending');
  const [playGuideTone, setPlayGuideTone] = useState<boolean>(true); // Piano plays reference before/during singing

  // Scale Playback Preview State (معاينة عزف السلم الموسيقي بالبيانو)
  const [isPreviewScaleActive, setIsPreviewScaleActive] = useState<boolean>(false);
  const [previewStepIdx, setPreviewStepIdx] = useState<number | null>(null);
  const previewTimeoutsRef = useRef<number[]>([]);
  const cancelPreviewRef = useRef<(() => void) | null>(null);

  // Session Running State
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [stepProgress, setStepProgress] = useState<number>(0); // 0 to 1 for current note duration
  const [liveNoteAccuracy, setLiveNoteAccuracy] = useState<number>(100);

  // Evaluated notes results
  const [evaluatedNotes, setEvaluatedNotes] = useState<NoteEvaluationResult[]>([]);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [overallScore, setOverallScore] = useState<number>(0);

  // Buffer for pitch samples during current note
  const currentNoteSamplesRef = useRef<Array<{ cents: number; inTune: boolean; clarity: number }>>([]);
  const stepTimerRef = useRef<number | null>(null);
  const sessionStartTimeRef = useRef<number>(Date.now());

  // Diatonic scale offsets from C (Tonic) in semitones:
  // C (0), D (2), E (4), F (5), G (7), A (9), B (11), C (+12)
  const solfegeScaleData = useMemo(() => {
    const rootC_Midi = (selectedOctave + 1) * 12; // C2=36, C3=48, C4=60, C5=72
    const diatonicOffsets = [
      { solfege: 'Do', arabic: 'دو', semitones: 0 },
      { solfege: 'Re', arabic: 'ري', semitones: 2 },
      { solfege: 'Mi', arabic: 'مي', semitones: 4 },
      { solfege: 'Fa', arabic: 'فا', semitones: 5 },
      { solfege: 'Sol', arabic: 'صول', semitones: 7 },
      { solfege: 'La', arabic: 'لا', semitones: 9 },
      { solfege: 'Si', arabic: 'سي', semitones: 11 },
      { solfege: 'Do', arabic: 'دو (جواب)', semitones: 12 },
    ];

    let fullList: typeof diatonicOffsets = [];
    if (scaleDirection === 'ascending') {
      fullList = diatonicOffsets;
    } else if (scaleDirection === 'descending') {
      fullList = [...diatonicOffsets].reverse();
    } else {
      // Both: Do to High Do then back to Do (15 steps)
      const descendingTail = [...diatonicOffsets].reverse().slice(1);
      fullList = [...diatonicOffsets, ...descendingTail];
    }

    return fullList.map((item, idx) => {
      const midi = rootC_Midi + item.semitones;
      const info = midiToNoteInfo(midi);
      return {
        index: idx,
        solfege: item.solfege,
        arabic: item.arabic,
        midi,
        frequency: info.frequency,
        noteName: info.fullName,
      };
    });
  }, [selectedOctave, scaleDirection]);

  const activeStep = solfegeScaleData[currentStepIdx] || solfegeScaleData[0];

  // Scaled Playback Tempo in BPM corresponding to note duration
  const currentTempoBpm = useMemo(() => {
    const matched = DURATION_INTERVALS.find((d) => d.id === durationInterval);
    if (matched) return matched.tempoBpm;
    const matchedSec = DURATION_INTERVALS.find((d) => Math.abs(d.seconds - noteDurationSec) < 0.15);
    if (matchedSec) return matchedSec.tempoBpm;
    return Math.round(Math.min(140, Math.max(45, 60 / (noteDurationSec * 0.65))));
  }, [durationInterval, noteDurationSec]);

  // Sync tempo and duration with audio engine on mount & clean up on unmount
  useEffect(() => {
    audioEngine.setNoteDuration(noteDurationSec, currentTempoBpm);
    audioEngine.setTempoBpm(currentTempoBpm);

    return () => {
      if (cancelPreviewRef.current) cancelPreviewRef.current();
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
      previewTimeoutsRef.current.forEach((t) => clearTimeout(t));
      previewTimeoutsRef.current = [];
    };
  }, []);

  // Stop scale preview playback
  const stopScalePreview = () => {
    if (cancelPreviewRef.current) {
      cancelPreviewRef.current();
      cancelPreviewRef.current = null;
    }
    previewTimeoutsRef.current.forEach((t) => clearTimeout(t));
    previewTimeoutsRef.current = [];
    setIsPreviewScaleActive(false);
    setPreviewStepIdx(null);
  };

  // Change duration preset and scale audio engine tempo
  const handleSelectDurationInterval = (interval: NoteDurationInterval, seconds: number) => {
    haptics.tap();
    const config = DURATION_INTERVALS.find((d) => d.id === interval);
    const bpm = config ? config.tempoBpm : Math.round(Math.min(140, Math.max(45, 60 / (seconds * 0.65))));
    setDurationInterval(interval);
    setNoteDurationSec(seconds);
    audioEngine.setNoteDuration(seconds, bpm);
    audioEngine.setTempoBpm(bpm);
    stopScalePreview();
  };

  // Play full scale preview with piano scaled to current interval & tempo
  const handlePreviewScale = () => {
    haptics.tap();
    if (isPreviewScaleActive) {
      stopScalePreview();
      return;
    }

    stopScalePreview();
    setIsPreviewScaleActive(true);

    const midiList = solfegeScaleData.map((step) => step.midi);
    // Use audioEngine.playScale which calculates and adjusts setTimeout intervals for each note according to durationInterval
    cancelPreviewRef.current = audioEngine.playScale(
      midiList,
      durationInterval,
      'piano',
      (idx) => setPreviewStepIdx(idx),
      () => {
        setIsPreviewScaleActive(false);
        setPreviewStepIdx(null);
        cancelPreviewRef.current = null;
      }
    );
  };

  // Collect singing pitch data in real-time during active session
  useEffect(() => {
    if (!isActive || !activeStep) return;

    if (currentPitch?.note && (currentPitch.clarity ?? 0) > 0.55) {
      const sungMidi = currentPitch.note.midi;
      const targetMidi = activeStep.midi;
      const semitoneDiff = sungMidi - targetMidi;
      const totalCentsDeviation = semitoneDiff * 100 + currentPitch.cents;
      const inTune = Math.abs(totalCentsDeviation) <= 22; // In-tune tolerance for vocal solfege

      currentNoteSamplesRef.current.push({
        cents: totalCentsDeviation,
        inTune,
        clarity: currentPitch.clarity,
      });

      // Update live note accuracy
      const total = currentNoteSamplesRef.current.length;
      if (total > 0) {
        const inTuneCount = currentNoteSamplesRef.current.filter((s) => s.inTune).length;
        setLiveNoteAccuracy(Math.min(100, Math.max(10, Math.round((inTuneCount / total) * 100))));
      }
    }
  }, [currentPitch, isActive, activeStep]);

  // Start the Solfeggio Scale Test
  const handleStartTest = async () => {
    haptics.tap();
    stopScalePreview();
    try {
      await audioEngine.startListening();
    } catch (e) {
      console.warn('Microphone start error:', e);
    }

    setEvaluatedNotes([]);
    setCurrentStepIdx(0);
    setStepProgress(0);
    setLiveNoteAccuracy(100);
    setShowSummaryModal(false);
    setIsActive(true);
    sessionStartTimeRef.current = Date.now();

    startNoteCycle(0);
  };

  // Stop / Cancel Test
  const handleStopTest = () => {
    haptics.tap();
    stopScalePreview();
    if (stepTimerRef.current) {
      clearInterval(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    setIsActive(false);
    setStepProgress(0);
  };

  // Run the timed cycle for each individual note in the scale with scaled engine tempo
  const startNoteCycle = (stepIndex: number) => {
    const stepData = solfegeScaleData[stepIndex];
    if (!stepData) return;

    currentNoteSamplesRef.current = [];
    setStepProgress(0);
    setLiveNoteAccuracy(100);

    // Sync note duration and tempo with audio engine
    audioEngine.setNoteDuration(noteDurationSec, currentTempoBpm);
    audioEngine.setTempoBpm(currentTempoBpm);

    // If guide tone is enabled, play the reference note on the concert grand piano scaled to duration
    if (playGuideTone) {
      const guideToneDuration = Math.max(0.65, noteDurationSec * 0.88);
      audioEngine.playNote(stepData.midi, guideToneDuration);
    }

    const startTime = performance.now();
    const durationMs = noteDurationSec * 1000;

    if (stepTimerRef.current) clearInterval(stepTimerRef.current);

    stepTimerRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      setStepProgress(progress);

      if (progress >= 1) {
        // Note time elapsed! Evaluate this note
        if (stepTimerRef.current) clearInterval(stepTimerRef.current);
        finishSingleNote(stepIndex);
      }
    }, 35);
  };

  // Evaluate the note and transition to next note or finish scale
  const finishSingleNote = (stepIndex: number) => {
    const stepData = solfegeScaleData[stepIndex];
    const samples = currentNoteSamplesRef.current;
    const totalSamples = samples.length;

    let accuracy = 0;
    let avgCents = 0;
    let status: NoteEvaluationResult['status'] = 'missed';

    if (totalSamples > 0) {
      const inTuneCount = samples.filter((s) => s.inTune).length;
      avgCents = Math.round(samples.reduce((acc, s) => acc + s.cents, 0) / totalSamples);
      accuracy = Math.min(100, Math.max(0, Math.round((inTuneCount / totalSamples) * 100)));

      if (accuracy >= 85) {
        status = 'perfect';
      } else if (accuracy >= 65) {
        status = 'good';
      } else if (avgCents > 25) {
        status = 'sharp';
      } else {
        status = 'flat';
      }
    } else {
      accuracy = 0;
      status = 'missed';
    }

    const noteResult: NoteEvaluationResult = {
      step: stepData,
      accuracy,
      avgCents,
      inTuneSamples: samples.filter((s) => s.inTune).length,
      totalSamples,
      status,
    };

    setEvaluatedNotes((prev) => [...prev, noteResult]);

    if (status === 'perfect' || status === 'good') {
      haptics.pitchMatch();
    } else {
      haptics.streakLost();
    }

    // Check if more notes remain in the scale - scale breath transition gap with tempo
    const nextIdx = stepIndex + 1;
    if (nextIdx < solfegeScaleData.length) {
      setCurrentStepIdx(nextIdx);
      const breathGapMs = Math.round(Math.min(420, Math.max(160, noteDurationSec * 100)));
      setTimeout(() => {
        startNoteCycle(nextIdx);
      }, breathGapMs);
    } else {
      // Completed the entire Solfeggio Scale!
      completeScaleSession([...evaluatedNotes, noteResult]);
    }
  };

  // Complete the entire scale session and compute total match percentage
  const completeScaleSession = (allResults: NoteEvaluationResult[]) => {
    setIsActive(false);
    setStepProgress(0);

    const totalNotes = allResults.length;
    const totalAccuracySum = allResults.reduce((acc, r) => acc + r.accuracy, 0);
    const finalScaleAccuracy = totalNotes > 0 ? Math.round(totalAccuracySum / totalNotes) : 0;
    setOverallScore(finalScaleAccuracy);

    setShowSummaryModal(true);

    if (finalScaleAccuracy >= 80) {
      fire3StarCelebration();
      haptics.streakWon();
    }

    // Record session
    if (onRecordSession) {
      const durationSeconds = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
      const passedCount = allResults.filter((r) => r.accuracy >= 70).length;

      onRecordSession({
        id: `solfege-${Date.now()}`,
        timestamp: Date.now(),
        exerciseTitle: `سلم الصولفيج (دو-ري-مي) - أوكتاف ${selectedOctave}`,
        durationSeconds: Math.max(10, durationSeconds),
        notesAttempted: totalNotes,
        notesHitInTune: passedCount,
        accuracyPercentage: finalScaleAccuracy,
        averageCentsError: Math.round(
          allResults.reduce((acc, r) => acc + Math.abs(r.avgCents), 0) / Math.max(1, totalNotes)
        ),
        dateString: new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US'),
      });
    }
  };

  return (
    <div className="flex flex-col gap-3.5 max-w-2xl mx-auto w-full select-none pb-8 animate-in fade-in">
      {/* Top Header Card */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/40 p-4 sm:p-5 rounded-3xl shadow-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-950/60 shrink-0">
            <Zap className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>{t.solfeggioTitle}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                {selectedOctave} {t.octave}
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {t.solfeggioDesc}
            </p>
          </div>
        </div>

        {onBackToPiano && (
          <button
            onClick={onBackToPiano}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition shrink-0"
          >
            {isAr ? 'البيانو' : 'Piano'}
          </button>
        )}
      </div>

      {/* 
        ========================================================================
        CONTROLS PANEL: 1. SELECT OCTAVE (أوكتاف 2، 3، 4، 5) | 2. DURATION | 3. DIRECTION
        ========================================================================
      */}
      {!isActive && (
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col gap-3.5">
          {/* 1. Octave Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t.selectOctave}</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                C{selectedOctave} – C{selectedOctave + 1}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { oct: 2, label: isAr ? 'أوكتاف 2 (قرار عميق)' : 'Octave 2 (Deep Bass)', range: 'C2 – C3 (65 - 131 Hz)' },
                { oct: 3, label: isAr ? 'أوكتاف 3 (قرار متوسط)' : 'Octave 3 (Baritone / Tenor)', range: 'C3 – C4 (131 - 262 Hz)' },
                { oct: 4, label: isAr ? 'أوكتاف 4 (طبقة الوسط)' : 'Octave 4 (Mid / Soprano)', range: 'C4 – C5 (262 - 523 Hz)' },
                { oct: 5, label: isAr ? 'أوكتاف 5 (جوابات حادة)' : 'Octave 5 (High Treble)', range: 'C5 – C6 (523 - 1046 Hz)' },
              ].map((item) => {
                const isSelected = selectedOctave === item.oct;
                return (
                  <button
                    key={item.oct}
                    onClick={() => {
                      haptics.tap();
                      setSelectedOctave(item.oct);
                      // Play reference C of this octave
                      audioEngine.playNote((item.oct + 1) * 12, 0.8);
                    }}
                    className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition active:scale-95 ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-950/40 ring-2 ring-cyan-400/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-black">{item.label}</span>
                      <span className="font-mono text-[10px] font-bold text-cyan-300">C{item.oct}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono mt-1">{item.range}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Note Duration & Scaled Tempo Selector (فواصل زمنية: قصير، متوسط، طويل + تحجيم السرعة) */}
          <div className="space-y-2.5 pt-2.5 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.noteDuration}</span>
              </label>
              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  {noteDurationSec}s {isAr ? 'لكل نغمة' : '/ note'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold flex items-center gap-1">
                  <Activity className="w-2.5 h-2.5 animate-pulse text-cyan-400" />
                  <span>{currentTempoBpm} BPM</span>
                </span>
              </div>
            </div>

            {/* Dedicated Set of Buttons to Toggle Note Duration (Short / Medium / Long) */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner">
              {(['short', 'medium', 'long'] as const).map((durationId) => {
                const isSelected = durationInterval === durationId;
                const config = DURATION_INTERVALS.find((d) => d.id === durationId)!;
                return (
                  <button
                    key={durationId}
                    type="button"
                    onClick={() => handleSelectDurationInterval(durationId, config.seconds)}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${
                      isSelected
                        ? durationId === 'short'
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md shadow-amber-950/40 ring-1 ring-amber-300'
                          : durationId === 'medium'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md shadow-cyan-950/40 ring-1 ring-cyan-300'
                          : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white font-black shadow-md shadow-purple-950/40 ring-1 ring-purple-300'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <span className="text-sm">{config.icon}</span>
                    <span>
                      {durationId === 'short'
                        ? (isAr ? 'قصير (Short)' : 'Short')
                        : durationId === 'medium'
                        ? (isAr ? 'متوسط (Medium)' : 'Medium')
                        : (isAr ? 'طويل (Long)' : 'Long')}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isSelected
                          ? durationId === 'long'
                            ? 'bg-white/20 text-white'
                            : 'bg-black/25 text-slate-950 font-extrabold'
                          : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {config.seconds}s
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Three Primary Intervals Detailed Cards: Short, Medium, Long */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {DURATION_INTERVALS.map((item) => {
                const isSelected = durationInterval === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectDurationInterval(item.id, item.seconds)}
                    className={`p-3 rounded-2xl border flex flex-col justify-between transition-all duration-150 active:scale-97 ${
                      isAr ? 'text-right' : 'text-left'
                    } ${
                      isSelected
                        ? `${item.colorScheme.borderActive} ${item.colorScheme.bgActive} shadow-lg shadow-black/40`
                        : 'bg-slate-950/80 border-slate-800/90 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <span className="text-base">{item.icon}</span>
                        <span className={isSelected ? 'text-white font-black' : 'text-slate-300'}>
                          {isAr ? item.labelAr : item.labelEn}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        isSelected ? item.colorScheme.badge : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}>
                        {item.tempoBpm} BPM
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-baseline justify-between text-[11px] font-mono">
                      <span className={isSelected ? item.colorScheme.textActive : 'text-slate-400'}>
                        {item.seconds} {isAr ? 'ثانية' : 'sec'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-sans opacity-90 font-medium">
                        {isAr ? item.tempoNameAr : item.tempoNameEn}
                      </span>
                    </div>

                    <p className="text-[9px] text-slate-400 leading-tight mt-1 line-clamp-2">
                      {isAr ? item.descAr : item.descEn}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Fine Duration Quick Adjust (1s, 2s, 3s, 4s) */}
            <div className="flex items-center justify-between gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-medium">
                {isAr ? 'تخصيص يدوي سريع:' : 'Custom Seconds:'}
              </span>
              <div className="flex items-center gap-1">
                {[
                  { sec: 1.0, label: '1s' },
                  { sec: 2.0, label: '2s' },
                  { sec: 3.0, label: '3s' },
                  { sec: 4.0, label: '4s' },
                ].map((item) => {
                  const isExact = Math.abs(noteDurationSec - item.sec) < 0.05;
                  return (
                    <button
                      key={item.sec}
                      onClick={() => handleSelectDurationInterval('custom', item.sec)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition ${
                        isExact
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scale Preview Playback Button with Scaled Tempo */}
            <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800/90 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${isPreviewScaleActive ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`} />
                  <span className="text-xs font-bold text-slate-300">
                    {t.previewScalePlayback}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handlePreviewScale}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition active:scale-95 ${
                    isPreviewScaleActive
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                      : 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/40 hover:text-white'
                  }`}
                >
                  {isPreviewScaleActive ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>{t.stopScalePreview}</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'عزف السلم كمعاينة' : 'Preview Scale'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Inactive Mini Scale Preview Ladder */}
              <div className="grid grid-cols-8 gap-1 pt-1" dir="ltr">
                {solfegeScaleData.map((step, idx) => {
                  const isCurrentPreview = isPreviewScaleActive && previewStepIdx === idx;
                  return (
                    <div
                      key={`preview-step-${idx}`}
                      className={`p-1 rounded-xl border text-center transition-all duration-150 ${
                        isCurrentPreview
                          ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 scale-105 shadow-md shadow-cyan-900/40 ring-1 ring-cyan-400'
                          : 'bg-slate-900/60 border-slate-800/60 text-slate-400'
                      }`}
                    >
                      <div className="text-[10px] font-black truncate">{isAr ? step.arabic : step.solfege}</div>
                      <div className="text-[8px] font-mono text-slate-400">{formatNoteName(midiToNoteInfo(step.midi), notation)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Scale Direction & Guide Tone Options */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            {/* Direction */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => {
                  haptics.tap();
                  setScaleDirection('ascending');
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  scaleDirection === 'ascending'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowUp className="w-3.5 h-3.5 text-cyan-300" />
                <span>{isAr ? 'صعوداً ↗' : 'Ascending'}</span>
              </button>
              <button
                onClick={() => {
                  haptics.tap();
                  setScaleDirection('descending');
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  scaleDirection === 'descending'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowDown className="w-3.5 h-3.5 text-pink-300" />
                <span>{isAr ? 'هبوطاً ↘' : 'Descending'}</span>
              </button>
              <button
                onClick={() => {
                  haptics.tap();
                  setScaleDirection('both');
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  scaleDirection === 'both'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{isAr ? 'صعوداً وهبوطاً' : 'Both'}</span>
              </button>
            </div>

            {/* Guide Tone Toggle */}
            <button
              onClick={() => {
                haptics.tap();
                setPlayGuideTone(!playGuideTone);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                playGuideTone
                  ? 'bg-cyan-950 border-cyan-700 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
              title="Play piano guide note before/during singing"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'عزف مرجعي بالبيانو' : 'Piano Guide'}</span>
            </button>
          </div>

          {/* Start Test CTA */}
          <button
            onClick={handleStartTest}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-950/60 active:scale-98 transition"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{t.startSolfeggio}</span>
          </button>
        </div>
      )}

      {/* 
        ========================================================================
        ACTIVE TEST STAGE: LIVE NOTE MONITOR + PITCH WHEEL + SOLFEGE LADDER
        ========================================================================
      */}
      {isActive && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#070a12] border border-cyan-500/40 shadow-2xl flex flex-col gap-4 relative overflow-hidden">
          {/* Top Session Progress Bar */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold font-mono">
                {currentStepIdx + 1} / {solfegeScaleData.length}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold flex items-center gap-1.5">
                <span className="capitalize">{durationInterval}</span>
                <span>·</span>
                <span>{noteDurationSec}s</span>
                <span>·</span>
                <span>{currentTempoBpm} BPM</span>
              </span>
              <span className="font-bold text-white hidden sm:inline">
                {isAr ? 'النغمة الحالية:' : 'Current Step:'}
              </span>
            </div>

            {/* Live Note Accuracy Pill */}
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 font-mono font-black text-xs flex items-center gap-1.5 shadow">
                <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>{liveNoteAccuracy}%</span>
                <span className="text-[10px] font-sans font-normal text-slate-400">{isAr ? 'دقة' : 'acc'}</span>
              </div>

              <button
                onClick={handleStopTest}
                className="px-3 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>{t.stopSolfeggio}</span>
              </button>
            </div>
          </div>

          {/* Central Pitch Target Sphere & Countdown Ring */}
          <div className="relative flex flex-col items-center justify-center py-6 px-4 bg-slate-950/80 rounded-3xl border border-slate-800/80 my-1 overflow-hidden">
            {/* Circular Progress Ring */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r="78"
                  className="stroke-slate-800 fill-none"
                  strokeWidth="8"
                />
                <circle
                  cx="88"
                  cy="88"
                  r="78"
                  className="stroke-cyan-400 fill-none transition-all duration-75"
                  strokeWidth="8"
                  strokeDasharray={490}
                  strokeDashoffset={490 - (490 * stepProgress)}
                  strokeLinecap="round"
                />
              </svg>

              {/* Inside Center: Solfege Name & Note Info */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-400">
                  {activeStep.solfege}
                </span>
                <span className="text-4xl font-black text-white font-mono my-0.5">
                  {isAr ? activeStep.arabic : activeStep.solfege}
                </span>
                <span className="text-xs font-bold text-amber-400 font-mono">
                  {formatNoteName(midiToNoteInfo(activeStep.midi), notation)} ({Math.round(activeStep.frequency)} {t.hzUnit})
                </span>
              </div>
            </div>

            {/* Time Remaining Bar */}
            <div className="w-full max-w-xs mt-3 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>{Math.max(0, (noteDurationSec * (1 - stepProgress))).toFixed(1)}s remaining</span>
              <span className="text-cyan-300 font-bold">{Math.round(stepProgress * 100)}%</span>
            </div>

            {/* Live Sung Pitch Comparison Pill */}
            <div className="mt-3 flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/60 border border-white/10 text-xs">
              <Mic className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
              <span className="text-slate-400">{isAr ? 'صوتك المكتشف:' : 'Your voice:'}</span>
              {currentPitch?.note ? (
                <div className="flex items-center gap-1.5 font-mono font-bold">
                  <span className="text-white">{formatNoteName(currentPitch.note, notation)}</span>
                  <span className={currentPitch.isInTune ? 'text-emerald-400' : 'text-amber-400'}>
                    ({currentPitch.cents > 0 ? `+${currentPitch.cents}` : currentPitch.cents}¢)
                  </span>
                </div>
              ) : (
                <span className="text-slate-500 italic">{isAr ? 'غنِّ في الميكروفون الآن...' : 'Sing into mic now...'}</span>
              )}
            </div>

            {/* Replay Reference Tone button scaled to duration */}
            <button
              onClick={() => audioEngine.playNote(activeStep.midi, Math.max(0.8, noteDurationSec * 0.88))}
              className="mt-3 flex items-center gap-1 text-[11px] text-cyan-300 hover:text-cyan-200 transition bg-slate-900 px-3 py-1 rounded-full border border-slate-800"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'إعادة سماع النغمة' : 'Replay Tone'}</span>
            </button>
          </div>

          {/* 8-Note Interactive Solfege Ladder */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-400 px-1">
              {isAr ? 'سلّم الصولفيج المكتمل والمتبقي:' : 'Scale Ladder Progress:'}
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5" dir="ltr">
              {solfegeScaleData.map((step, idx) => {
                const isCurrent = idx === currentStepIdx;
                const evalItem = evaluatedNotes[idx];
                const isCompleted = !!evalItem;

                let cardStyle = 'bg-slate-950 border-slate-800/80 text-slate-500';
                if (isCurrent) {
                  cardStyle = 'bg-cyan-500/20 border-cyan-400 text-white ring-2 ring-cyan-400/40 scale-105 shadow-lg';
                } else if (isCompleted) {
                  if (evalItem.status === 'perfect') cardStyle = 'bg-emerald-950/70 border-emerald-500/70 text-emerald-300';
                  else if (evalItem.status === 'good') cardStyle = 'bg-cyan-950/70 border-cyan-500/70 text-cyan-300';
                  else cardStyle = 'bg-amber-950/70 border-amber-500/70 text-amber-300';
                }

                return (
                  <div
                    key={`ladder-${idx}`}
                    className={`p-2 rounded-2xl border flex flex-col items-center justify-between text-center transition-all ${cardStyle}`}
                  >
                    <span className="text-[9px] font-mono text-slate-400">#{idx + 1}</span>
                    <span className="text-xs font-black my-0.5 truncate w-full">
                      {isAr ? step.arabic : step.solfege}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      {formatNoteName(midiToNoteInfo(step.midi), notation)}
                    </span>
                    {isCompleted && (
                      <span className="text-[9px] font-bold font-mono mt-1 text-emerald-400">
                        {evalItem.accuracy}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        SUMMARY & FULL ACCURACY PERCENTAGE MODAL (% نسبة التطابق الإجمالية)
        ========================================================================
      */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in select-none">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">{t.solfeggioAccuracy}</h3>
                  <p className="text-xs text-slate-400">
                    {isAr ? `سلم الصولفيج - أوكتاف ${selectedOctave} (${noteDurationSec} ثوانٍ)` : `Scale Accuracy - Octave ${selectedOctave}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Overall Percentage Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950 via-slate-900 to-indigo-950 border border-cyan-500/40 flex items-center justify-between shadow-xl">
              <div>
                <span className="text-xs text-slate-300 font-bold block">
                  {isAr ? 'نسبة التطابق المئوية للسلم كاملاً:' : 'Overall Scale Match Percentage:'}
                </span>
                <div className="text-5xl font-black text-cyan-300 font-mono mt-1">
                  {overallScore}%
                </div>
                <span className="text-[11px] text-emerald-400 font-medium">
                  {overallScore >= 90
                    ? (isAr ? 'أداء احترافي فائق الدقة!' : 'Virtuoso Master Accuracy!')
                    : overallScore >= 75
                    ? (isAr ? 'أداء ممتاز وثبات نغمي جيد جداً' : 'Great pitch stability!')
                    : (isAr ? 'جيد - ركّز على دعم النفس ودقة مخارج الحروف' : 'Good effort, keep practicing!')}
                </span>
              </div>
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 font-black text-2xl shadow-lg">
                {overallScore >= 90 ? '⭐⭐⭐' : overallScore >= 75 ? '⭐⭐' : '⭐'}
              </div>
            </div>

            {/* Per-Note Breakdown Grid */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-white px-1">
                {isAr ? 'تفاصيل تطابق كل نغمة في السلم:' : 'Per-Note Accuracy Breakdown:'}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {evaluatedNotes.map((item, idx) => (
                  <div
                    key={`res-${idx}`}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">
                        {isAr ? item.step.arabic : item.step.solfege}
                      </span>
                      <span
                        className={`text-xs font-mono font-black ${
                          item.accuracy >= 85
                            ? 'text-emerald-400'
                            : item.accuracy >= 65
                            ? 'text-cyan-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {item.accuracy}%
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center justify-between">
                      <span>{formatNoteName(midiToNoteInfo(item.step.midi), notation)}</span>
                      <span>
                        {item.avgCents > 0 ? `+${item.avgCents}¢` : `${item.avgCents}¢`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setShowSummaryModal(false);
                  handleStartTest();
                }}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-2xl text-xs font-black shadow-lg transition active:scale-95"
              >
                {isAr ? 'إعادة الاختبار' : 'Retry Test'}
              </button>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold transition"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
