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
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Clock,
  Target,
  Zap,
  Activity,
  Layers,
  Flame,
  VolumeX,
} from 'lucide-react';
import { DetailedGuideModal } from '../Common/DetailedGuideModal';
import { InfoGuideButton } from '../Common/InfoGuideButton';
import {
  NoteInfo,
  VocalRangeProfile,
  PitchDetectionResult,
  PracticeSessionRecord,
  AppLanguage,
  NotationSystem,
  VocalSampleVowel,
} from '../../types/vocal';
import { midiToNoteInfo, formatNoteName } from '../../utils/noteUtils';
import { audioEngine } from '../../audio/audioEngine';
import { haptics } from '../../utils/haptics';
import { fire3StarCelebration } from '../../utils/confetti';
import { translations } from '../../utils/i18n';

export type LadderVocalPrompt = 'solfege' | 'aah' | 'mmm' | 'brrr' | 'ooh' | 'eee';
export type LadderDirection = 'both' | 'ascending' | 'descending';

export interface VocalPromptOption {
  id: LadderVocalPrompt;
  vowelKey: VocalSampleVowel;
  nameAr: string;
  nameEn: string;
  promptWordAr: string;
  promptWordEn: string;
  descAr: string;
  descEn: string;
  icon: string;
  badge: string;
}

export const VOCAL_PROMPTS: VocalPromptOption[] = [
  {
    id: 'solfege',
    vowelKey: 'aah',
    nameAr: 'دو - ري (صولفيج)',
    nameEn: 'Do - Re (Solfeggio)',
    promptWordAr: 'دو - ري - مي...',
    promptWordEn: 'Do - Re - Mi...',
    descAr: 'نطق أسماء النغمات بالترتيب لترسيخ الذاكرة السمعية واللفظية للسلّم.',
    descEn: 'Articulated solfege syllables for auditory scale mastery.',
    icon: '🎵',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  },
  {
    id: 'aah',
    vowelKey: 'aah',
    nameAr: 'آه - آه (Aaaah)',
    nameEn: 'Aaaah (Open Vowel)',
    promptWordAr: 'آآآآه [aː]',
    promptWordEn: 'Aaaah [aː]',
    descAr: 'رنين بل كانتو مفتوح ومسترسل لفتح التجويف الفمي وإطلاق الرنين.',
    descEn: 'Bel Canto open vowel release for pharyngeal space & resonance.',
    icon: '🗣️',
    badge: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
  },
  {
    id: 'mmm',
    vowelKey: 'mmm',
    nameAr: 'امممم (Humming)',
    nameEn: 'Mmmmm (Nasal Hum)',
    promptWordAr: 'امممممم [mː]',
    promptWordEn: 'Mmmmmmm [mː]',
    descAr: 'دندنة أنفية بشفاه مغلقة لتخفيف التوتر الصوتي وتنشيط رنين الجيوب.',
    descEn: 'Closed-lip gentle hum to activate sinus twang & release tension.',
    icon: '🧘',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  {
    id: 'brrr',
    vowelKey: 'lip-trill',
    nameAr: 'برررر (Lip Trill)',
    nameEn: 'Brrrrr (Lip Trill SOVT)',
    promptWordAr: 'برررررر [bː]',
    promptWordEn: 'Brrrrrrr [bː]',
    descAr: 'رفرفة الشفاه الهيدروديناميكية لحماية الحبال وموازنة ضغط النفس في الصعود.',
    descEn: 'SOVT lip flutter balancing air pressure for effortless high range climbing.',
    icon: '🌊',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  {
    id: 'ooh',
    vowelKey: 'ooh',
    nameAr: 'اوووو (Ooooh)',
    nameEn: 'Ooooh (Warm Rounded)',
    promptWordAr: 'اوووووو [uː]',
    promptWordEn: 'Ooooooo [uː]',
    descAr: 'رنين دائري دافئ لتثبيت الحنجرة في وضع مريح وطبقة مخملية.',
    descEn: 'Velvety rounded vowel anchoring comfortable relaxed larynx.',
    icon: '🎙️',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  {
    id: 'eee',
    vowelKey: 'eee',
    nameAr: 'إيييي (Eeeee)',
    nameEn: 'Eeeee (Bright Twang)',
    promptWordAr: 'إيييييي [iː]',
    promptWordEn: 'Eeeeeee [iː]',
    descAr: 'رنين أمامي في قناع الوجه للمرور السلس عبر الجسور الصوتية.',
    descEn: 'Forward mask projection for smooth bridge (passaggio) crossing.',
    icon: '✨',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  },
];

export interface LadderStepItem {
  index: number;
  solfege: string;
  arabic: string;
  midi: number;
  frequency: number;
  noteName: string;
  isHighDo?: boolean;
}

export interface LadderEvaluationResult {
  step: LadderStepItem;
  accuracy: number;
  avgCents: number;
  status: 'perfect' | 'good' | 'sharp' | 'flat' | 'missed';
}

interface VocalLadderTrainerProps {
  profile: VocalRangeProfile;
  currentPitch: PitchDetectionResult | null;
  language?: AppLanguage;
  notation?: NotationSystem;
  onRecordSession?: (session: PracticeSessionRecord) => void;
  onOpenLiveStudio?: () => void;
  onBackToHub?: () => void;
}

export const VocalLadderTrainer: React.FC<VocalLadderTrainerProps> = ({
  profile,
  currentPitch,
  language = 'ar',
  notation = 'arabic',
  onRecordSession,
  onOpenLiveStudio,
  onBackToHub,
}) => {
  const isAr = language === 'ar';
  const t = translations[language] || translations.en;

  // Configuration States
  const [selectedPrompt, setSelectedPrompt] = useState<LadderVocalPrompt>('solfege');
  const [selectedOctave, setSelectedOctave] = useState<number>(() => {
    const mid = profile.middleRegisterNote?.octave || 4;
    return Math.max(2, Math.min(5, mid));
  });
  const [direction, setDirection] = useState<LadderDirection>('both');
  const [noteDurationSec, setNoteDurationSec] = useState<number>(2.2);
  const [guideSound, setGuideSound] = useState<'piano' | 'vocal'>('piano');
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);

  // Exercise Running States
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [stepProgress, setStepProgress] = useState<number>(0);
  const [liveAccuracy, setLiveAccuracy] = useState<number>(100);

  // Evaluated results
  const [evaluatedSteps, setEvaluatedSteps] = useState<LadderEvaluationResult[]>([]);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [overallScore, setOverallScore] = useState<number>(0);

  // Buffers & Timers
  const stepSamplesRef = useRef<Array<{ cents: number; inTune: boolean }>>([]);
  const timerRef = useRef<number | null>(null);
  const sessionStartRef = useRef<number>(Date.now());

  // Diatonic scale steps from Root Do to High Do (Octave)
  const ladderSteps = useMemo(() => {
    const rootC_Midi = (selectedOctave + 1) * 12; // C3=48, C4=60, C5=72
    const diatonic = [
      { solfege: 'Do', arabic: 'دو (القرار)', semitones: 0, isHighDo: false },
      { solfege: 'Re', arabic: 'ري', semitones: 2, isHighDo: false },
      { solfege: 'Mi', arabic: 'مي', semitones: 4, isHighDo: false },
      { solfege: 'Fa', arabic: 'فا', semitones: 5, isHighDo: false },
      { solfege: 'Sol', arabic: 'صول', semitones: 7, isHighDo: false },
      { solfege: 'La', arabic: 'لا', semitones: 9, isHighDo: false },
      { solfege: 'Si', arabic: 'سي', semitones: 11, isHighDo: false },
      { solfege: 'Do', arabic: 'دو (الجواب)', semitones: 12, isHighDo: true },
    ];

    let stepsSequence: typeof diatonic = [];
    if (direction === 'ascending') {
      stepsSequence = diatonic;
    } else if (direction === 'descending') {
      stepsSequence = [...diatonic].reverse();
    } else {
      // Both: Do -> High Do -> back to Do
      const tail = [...diatonic].reverse().slice(1);
      stepsSequence = [...diatonic, ...tail];
    }

    return stepsSequence.map((item, idx) => {
      const midi = rootC_Midi + item.semitones;
      const info = midiToNoteInfo(midi);
      return {
        index: idx,
        solfege: item.solfege,
        arabic: item.arabic,
        midi,
        frequency: info.frequency,
        noteName: info.fullName,
        isHighDo: item.isHighDo,
      };
    });
  }, [selectedOctave, direction]);

  const activeStep = ladderSteps[currentStepIdx] || ladderSteps[0];
  const activePromptObj = VOCAL_PROMPTS.find((p) => p.id === selectedPrompt) || VOCAL_PROMPTS[0];

  // Stop & Clean up
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Collect singer pitch samples during step
  useEffect(() => {
    if (!isActive || !activeStep) return;

    if (currentPitch?.note && (currentPitch.clarity ?? 0) > 0.55) {
      const sungMidi = currentPitch.note.midi;
      const targetMidi = activeStep.midi;
      const diffSemitones = sungMidi - targetMidi;
      const totalCents = diffSemitones * 100 + currentPitch.cents;
      const inTune = Math.abs(totalCents) <= 24;

      stepSamplesRef.current.push({
        cents: totalCents,
        inTune,
      });

      const total = stepSamplesRef.current.length;
      if (total > 0) {
        const inTuneCount = stepSamplesRef.current.filter((s) => s.inTune).length;
        setLiveAccuracy(Math.min(100, Math.max(10, Math.round((inTuneCount / total) * 100))));
      }
    }
  }, [currentPitch, isActive, activeStep]);

  // Start the Ladder Progression Exercise
  const handleStartExercise = async () => {
    haptics.tap();
    try {
      await audioEngine.startListening();
    } catch (e) {
      console.warn('Microphone start error:', e);
    }

    setEvaluatedSteps([]);
    setCurrentStepIdx(0);
    setStepProgress(0);
    setLiveAccuracy(100);
    setShowSummaryModal(false);
    setIsActive(true);
    sessionStartRef.current = Date.now();

    startStepCycle(0);
  };

  const handleStopExercise = () => {
    haptics.tap();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsActive(false);
    setStepProgress(0);
  };

  // Run timed cycle for an individual note
  const startStepCycle = (stepIdx: number) => {
    const stepData = ladderSteps[stepIdx];
    if (!stepData) return;

    stepSamplesRef.current = [];
    setStepProgress(0);
    setLiveAccuracy(100);

    // Play guide tone using chosen timbre (piano or human vocal sample)
    if (guideSound === 'vocal') {
      audioEngine.playNote(stepData.midi, Math.max(0.7, noteDurationSec * 0.85), 'vocal', activePromptObj.vowelKey);
    } else {
      audioEngine.playNote(stepData.midi, Math.max(0.7, noteDurationSec * 0.85), 'piano');
    }

    const startTime = performance.now();
    const durationMs = noteDurationSec * 1000;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startTime;
      const prog = Math.min(1, elapsed / durationMs);
      setStepProgress(prog);

      if (prog >= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        finishStep(stepIdx);
      }
    }, 35);
  };

  // Evaluate note step and advance
  const finishStep = (stepIdx: number) => {
    const stepData = ladderSteps[stepIdx];
    const samples = stepSamplesRef.current;
    const total = samples.length;

    let accuracy = 0;
    let avgCents = 0;
    let status: LadderEvaluationResult['status'] = 'missed';

    if (total > 0) {
      const inTuneCount = samples.filter((s) => s.inTune).length;
      avgCents = Math.round(samples.reduce((acc, s) => acc + s.cents, 0) / total);
      accuracy = Math.min(100, Math.max(0, Math.round((inTuneCount / total) * 100)));

      if (accuracy >= 85) status = 'perfect';
      else if (accuracy >= 65) status = 'good';
      else if (avgCents > 25) status = 'sharp';
      else status = 'flat';
    } else {
      accuracy = 0;
      status = 'missed';
    }

    const result: LadderEvaluationResult = {
      step: stepData,
      accuracy,
      avgCents,
      status,
    };

    setEvaluatedSteps((prev) => [...prev, result]);

    if (status === 'perfect' || status === 'good') {
      haptics.pitchMatch();
    } else {
      haptics.streakLost();
    }

    const nextIdx = stepIdx + 1;
    if (nextIdx < ladderSteps.length) {
      setCurrentStepIdx(nextIdx);
      setTimeout(() => {
        startStepCycle(nextIdx);
      }, 250);
    } else {
      // Completed the full ladder!
      completeExercise([...evaluatedSteps, result]);
    }
  };

  const completeExercise = (allResults: LadderEvaluationResult[]) => {
    setIsActive(false);
    setStepProgress(0);

    const totalNotes = allResults.length;
    const totalAcc = allResults.reduce((acc, r) => acc + r.accuracy, 0);
    const finalScore = totalNotes > 0 ? Math.round(totalAcc / totalNotes) : 0;
    setOverallScore(finalScore);
    setShowSummaryModal(true);

    if (finalScore >= 80) {
      fire3StarCelebration();
      haptics.streakWon();
    }

    if (onRecordSession) {
      const durSec = Math.round((Date.now() - sessionStartRef.current) / 1000);
      onRecordSession({
        id: `ladder-${Date.now()}`,
        timestamp: Date.now(),
        exerciseTitle: `تدرج الطبقات (${activePromptObj.nameAr}) - C${selectedOctave}`,
        durationSeconds: Math.max(10, durSec),
        notesAttempted: totalNotes,
        notesHitInTune: allResults.filter((r) => r.accuracy >= 70).length,
        accuracyPercentage: finalScore,
        averageCentsError: Math.round(
          allResults.reduce((acc, r) => acc + Math.abs(r.avgCents), 0) / Math.max(1, totalNotes)
        ),
        dateString: new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US'),
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full select-none pb-12 animate-in fade-in">
      {/* 
        ========================================================================
        HERO & HEADER CARD
        ========================================================================
      */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-amber-950/70 border border-amber-500/40 p-4 sm:p-5 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-pink-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-amber-950/60 shrink-0">
            <span className="text-2xl">{activePromptObj.icon}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">
                {isAr ? 'تدرج الطبقات الصوتية (من الدو إلى دو الجواب)' : 'Vocal Range Ladder: Root C to High C'}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 font-mono">
                C{selectedOctave} – C{selectedOctave + 1}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isAr
                ? 'تدرج بالصوت نغمة تلو الأخرى صعوداً وهبوطاً لتمكين الأحبال الصوتية وإتقان الطبقات'
                : 'Climb note by note ascending & descending to master vocal registers'}
            </p>
          </div>
        </div>

        {/* Actions on hero card */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
          <InfoGuideButton
            onClick={() => setActiveGuideId('section_ladder')}
            title={isAr ? 'معلومات تدرج الطبقات الصوتية' : 'Vocal Ladder Guide'}
            size="md"
          />

          {/* Action button to switch to live singing studio */}
          {onOpenLiveStudio && (
            <button
              onClick={onOpenLiveStudio}
              className="px-3.5 py-2 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-cyan-950/50 justify-center"
            >
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>{isAr ? 'استوديو الغناء الحر' : 'Live Tuner Studio'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 
        ========================================================================
        SETUP CONTROLS PANEL: PROMPTS + OCTAVE + DIRECTION + GUIDE SOUND
        ========================================================================
      */}
      {!isActive && (
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col gap-4">
          {/* 1. Vocal Syllable / Prompt Selector (دو ري / آه آه / امممم / برررر) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-white flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? 'اختر نمط الصوت والغناء المطلوب:' : 'Select Vocal Timbre / Exercise Sound:'}</span>
              </label>
              <span className="text-[10px] font-mono text-cyan-300 font-bold">
                {activePromptObj.nameAr}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VOCAL_PROMPTS.map((item) => {
                const isSelected = selectedPrompt === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      haptics.tap();
                      setSelectedPrompt(item.id);
                      // Play reference vowel sound
                      audioEngine.playNote((selectedOctave + 1) * 12, 1.0, 'vocal', item.vowelKey);
                    }}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-97 ${
                      isAr ? 'text-right' : 'text-left'
                    } ${
                      isSelected
                        ? 'bg-gradient-to-br from-amber-500/20 via-slate-900 to-indigo-950 border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl">{item.icon}</span>
                        <InfoGuideButton
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveGuideId(`vocal_${item.id}`);
                          }}
                          size="sm"
                          title={isAr ? `شرح تفصيلي لتمرين ${item.nameAr} وهدفه الفسيولوجي` : `Detailed Guide for ${item.nameEn}`}
                        />
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${item.badge}`}>
                        {item.promptWordAr}
                      </span>
                    </div>

                    <div className="mt-2">
                      <span className={`text-xs font-black block ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {isAr ? item.nameAr : item.nameEn}
                      </span>
                      <p className="text-[9px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                        {isAr ? item.descAr : item.descEn}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Octave & Range Selection */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-white flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isAr ? 'أوكتاف البداية (طبقة الدو الأساسية):' : 'Starting Octave (Root C):'}</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                C{selectedOctave} ({Math.round(440 * Math.pow(2, ((selectedOctave + 1) * 12 - 69) / 12))} Hz)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { oct: 2, labelAr: 'أوكتاف 2 (قرار عميق للرجال)', labelEn: 'Octave 2 (Deep Bass)', range: 'C2 – C3' },
                { oct: 3, labelAr: 'أوكتاف 3 (باريتون وتينور)', labelEn: 'Octave 3 (Baritone / Tenor)', range: 'C3 – C4' },
                { oct: 4, labelAr: 'أوكتاف 4 (طبقة الوسط وسوبرانو)', labelEn: 'Octave 4 (Mid / Soprano)', range: 'C4 – C5' },
                { oct: 5, labelAr: 'أوكتاف 5 (جوابات عالية حادة)', labelEn: 'Octave 5 (High Treble)', range: 'C5 – C6' },
              ].map((octItem) => {
                const isSelected = selectedOctave === octItem.oct;
                return (
                  <button
                    key={octItem.oct}
                    onClick={() => {
                      haptics.tap();
                      setSelectedOctave(octItem.oct);
                      audioEngine.playNote((octItem.oct + 1) * 12, 0.8);
                    }}
                    className={`p-2.5 rounded-2xl border flex flex-col justify-between transition active:scale-95 text-right ${
                      isAr ? 'text-right' : 'text-left'
                    } ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-white ring-2 ring-cyan-400/40 shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">{isAr ? `C${octItem.oct}` : `Octave ${octItem.oct}`}</span>
                      <span className="text-[10px] font-mono font-bold text-cyan-300">{octItem.range}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1">{isAr ? octItem.labelAr : octItem.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Direction & Guide Tone Timbre */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            {/* Direction */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-white flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-pink-400" />
                <span>{isAr ? 'اتجاه التدرج:' : 'Ladder Direction:'}</span>
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                <button
                  onClick={() => {
                    haptics.tap();
                    setDirection('both');
                  }}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold transition ${
                    direction === 'both' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'صعوداً وهبوطاً' : 'Both (15)'}
                </button>
                <button
                  onClick={() => {
                    haptics.tap();
                    setDirection('ascending');
                  }}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                    direction === 'ascending' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowUp className="w-3 h-3 text-cyan-300" />
                  <span>{isAr ? 'صعوداً' : 'Up (8)'}</span>
                </button>
                <button
                  onClick={() => {
                    haptics.tap();
                    setDirection('descending');
                  }}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                    direction === 'descending' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowDown className="w-3 h-3 text-pink-300" />
                  <span>{isAr ? 'هبوطاً' : 'Down (8)'}</span>
                </button>
              </div>
            </div>

            {/* Guide Sound Timbre (Piano vs Human Voice) */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-white flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isAr ? 'صوت العزف المرجعي المساعد:' : 'Reference Guide Sound:'}</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                <button
                  onClick={() => {
                    haptics.tap();
                    setGuideSound('piano');
                    audioEngine.playNote((selectedOctave + 1) * 12, 0.8, 'piano');
                  }}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    guideSound === 'piano' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🎹</span>
                  <span>{isAr ? 'بيانو الحفلات' : 'Grand Piano'}</span>
                </button>

                <button
                  onClick={() => {
                    haptics.tap();
                    setGuideSound('vocal');
                    audioEngine.playNote((selectedOctave + 1) * 12, 0.8, 'vocal', activePromptObj.vowelKey);
                  }}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    guideSound === 'vocal' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🗣️</span>
                  <span>{isAr ? 'صوت بشري طبيعي' : 'Human Timbre'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Start Exercise Button */}
          <button
            onClick={handleStartExercise}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-pink-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-950/60 active:scale-98 transition mt-1"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{isAr ? `بدء تمرين تدرج الطبقات (${activePromptObj.nameAr})` : `Start Ladder Exercise (${activePromptObj.nameEn})`}</span>
          </button>
        </div>
      )}

      {/* 
        ========================================================================
        ACTIVE LADDER EXERCISE STAGE: LIVE NOTE TARGET & COUNTDOWN
        ========================================================================
      */}
      {isActive && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#070a12] border border-amber-500/40 shadow-2xl flex flex-col gap-4 relative overflow-hidden animate-in fade-in">
          {/* Top Stage Bar */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-950 border border-amber-700 text-amber-300 font-bold font-mono">
                {currentStepIdx + 1} / {ladderSteps.length}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-cyan-300 text-xs font-bold font-mono flex items-center gap-1.5">
                <span>{activePromptObj.icon}</span>
                <span>{activePromptObj.promptWordAr}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-mono font-black text-xs flex items-center gap-1.5 shadow">
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>{liveAccuracy}%</span>
                <span className="text-[10px] text-slate-400 font-sans font-normal">{isAr ? 'إتقان' : 'acc'}</span>
              </div>

              <button
                onClick={handleStopExercise}
                className="px-3 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>{isAr ? 'إيقاف' : 'Stop'}</span>
              </button>
            </div>
          </div>

          {/* Central Pitch Target Sphere & Countdown Ring */}
          <div className="relative flex flex-col items-center justify-center py-6 px-4 bg-slate-950/90 rounded-3xl border border-slate-800/80 my-1 overflow-hidden">
            {/* Circular Progress Ring */}
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="84"
                  className="stroke-slate-800 fill-none"
                  strokeWidth="8"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="84"
                  className="stroke-amber-400 fill-none transition-all duration-75"
                  strokeWidth="8"
                  strokeDasharray={528}
                  strokeDashoffset={528 - (528 * stepProgress)}
                  strokeLinecap="round"
                />
              </svg>

              {/* Inside Center: Solfege & Prompt Cue */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                  {activeStep.isHighDo ? (isAr ? 'دو الجواب ★' : 'High C ★') : activeStep.solfege}
                </span>
                <span className="text-4xl font-black text-white font-mono my-0.5">
                  {isAr ? activeStep.arabic : activeStep.solfege}
                </span>
                <span className="text-xs font-bold text-cyan-300 font-mono">
                  {activeStep.noteName} ({Math.round(activeStep.frequency)} Hz)
                </span>
                <span className="text-[10px] font-extrabold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full mt-1 border border-amber-700/60">
                  {isAr ? `ردّد: ${activePromptObj.promptWordAr}` : `Sing: ${activePromptObj.promptWordEn}`}
                </span>
              </div>
            </div>

            {/* Time remaining countdown */}
            <div className="w-full max-w-xs mt-3 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>{Math.max(0, (noteDurationSec * (1 - stepProgress))).toFixed(1)}s remaining</span>
              <span className="text-amber-400 font-bold">{Math.round(stepProgress * 100)}%</span>
            </div>

            {/* Live Detected Singer Note Pill */}
            <div className="mt-3 flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/70 border border-white/10 text-xs">
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
                <span className="text-slate-500 italic">
                  {isAr ? `غنِّ "${activePromptObj.promptWordAr}" في الميكروفون...` : `Sing "${activePromptObj.promptWordEn}" into mic...`}
                </span>
              )}
            </div>

            {/* Replay Tone Button */}
            <button
              onClick={() => {
                if (guideSound === 'vocal') {
                  audioEngine.playNote(activeStep.midi, 1.2, 'vocal', activePromptObj.vowelKey);
                } else {
                  audioEngine.playNote(activeStep.midi, 1.2, 'piano');
                }
              }}
              className="mt-3 flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 transition bg-slate-900 px-3.5 py-1.5 rounded-full border border-slate-800 active:scale-95"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'إعادة سماع النغمة المرجعية' : 'Replay Reference Tone'}</span>
            </button>
          </div>

          {/* Interactive Progress Ladder Strip */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-400 px-1">
              {isAr ? 'مسار السلّم الموسيقي صعوداً وهبوطاً:' : 'Vocal Ladder Progression Trail:'}
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5" dir="ltr">
              {ladderSteps.map((step, idx) => {
                const isCurrent = idx === currentStepIdx;
                const evalItem = evaluatedSteps[idx];
                const isCompleted = !!evalItem;

                let cardStyle = 'bg-slate-950 border-slate-800/80 text-slate-500';
                if (isCurrent) {
                  cardStyle = 'bg-amber-500/25 border-amber-400 text-white ring-2 ring-amber-400/40 scale-105 shadow-lg';
                } else if (isCompleted) {
                  if (evalItem.status === 'perfect') cardStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-300';
                  else if (evalItem.status === 'good') cardStyle = 'bg-cyan-950/80 border-cyan-500 text-cyan-300';
                  else cardStyle = 'bg-rose-950/70 border-rose-500/70 text-rose-300';
                }

                return (
                  <div
                    key={`ladder-step-${idx}`}
                    className={`p-2 rounded-2xl border flex flex-col items-center justify-between text-center transition-all ${cardStyle}`}
                  >
                    <span className="text-[9px] font-mono text-slate-400">#{idx + 1}</span>
                    <span className="text-xs font-black my-0.5 truncate w-full">
                      {isAr ? step.arabic : step.solfege}
                    </span>
                    <span className="text-[9px] font-mono opacity-80">{step.noteName}</span>
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
        SUMMARY MODAL: TOTAL LADDER MASTERY EVALUATION
        ========================================================================
      */}
      {showSummaryModal && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col items-center text-center gap-4 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 via-pink-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-amber-950/60">
            <Award className="w-8 h-8 text-amber-200" />
          </div>

          <div>
            <h3 className="text-xl font-black text-white">
              {isAr ? 'اكتمل تمرين تدرج الطبقات بنجاح!' : 'Vocal Ladder Completed!'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isAr
                ? `تم التدرج من طبقة الدو C${selectedOctave} إلى دو الجواب C${selectedOctave + 1} بنمط (${activePromptObj.nameAr})`
                : `Completed vocal ascent & descent across octave C${selectedOctave} using ${activePromptObj.nameEn}`}
            </p>
          </div>

          <div className="px-5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
            <span className="text-xs text-slate-400">{isAr ? 'نسبة التطابق وإتقان الطبقات:' : 'Scale Match Accuracy:'}</span>
            <span className="text-2xl font-black font-mono text-amber-400">
              {overallScore}%
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <button
              onClick={handleStartExercise}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isAr ? 'إعادة التمرين' : 'Repeat Exercise'}</span>
            </button>

            {onOpenLiveStudio && (
              <button
                onClick={onOpenLiveStudio}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg flex items-center gap-1.5"
              >
                <Activity className="w-4 h-4" />
                <span>{isAr ? 'الانتقال لمؤشر الغناء اللحظي' : 'Go to Live Singing Studio'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Detailed Physiological & Acoustic Guide Modal */}
      <DetailedGuideModal
        guideId={activeGuideId}
        isOpen={Boolean(activeGuideId)}
        onClose={() => setActiveGuideId(null)}
        language={language}
      />
    </div>
  );
};
