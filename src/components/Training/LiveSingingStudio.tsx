import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Activity,
  Flame,
  Zap,
  RotateCcw,
  Piano as PianoIcon,
  Award,
  Layers,
  ChevronRight,
  ChevronLeft,
  Info,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { DetailedGuideModal } from '../Common/DetailedGuideModal';
import { InfoGuideButton } from '../Common/InfoGuideButton';
import {
  PitchDetectionResult,
  VocalRangeProfile,
  AppLanguage,
  NotationSystem,
  PracticeSessionRecord,
} from '../../types/vocal';
import { midiToNoteInfo, formatNoteName } from '../../utils/noteUtils';
import { audioEngine } from '../../audio/audioEngine';
import { haptics } from '../../utils/haptics';
import { translations } from '../../utils/i18n';

interface LiveSingingStudioProps {
  currentPitch: PitchDetectionResult | null;
  profile: VocalRangeProfile;
  language?: AppLanguage;
  notation?: NotationSystem;
  onRecordSession?: (session: PracticeSessionRecord) => void;
  onOpenLadderTrainer?: () => void;
}

export const LiveSingingStudio: React.FC<LiveSingingStudioProps> = ({
  currentPitch,
  profile,
  language = 'ar',
  notation = 'arabic',
  onRecordSession,
  onOpenLadderTrainer,
}) => {
  const isAr = language === 'ar';
  const t = translations[language] || translations.en;

  // Studio Listening & Session State
  const [isMicActive, setIsMicActive] = useState<boolean>(true);
  const [targetMidi, setTargetMidi] = useState<number | null>(60); // Default C4 as reference target
  const [selectedOctave, setSelectedOctave] = useState<number>(4);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Real-time rolling metrics (over last 5 seconds)
  const [recentAccuracyPct, setRecentAccuracyPct] = useState<number>(92);
  const [sessionNotesHit, setSessionNotesHit] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);

  // History buffer for rolling accuracy
  const historyBufferRef = useRef<Array<{ inTune: boolean; cents: number; timestamp: number }>>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pitchTrailRef = useRef<Array<{ midi: number; cents: number; clarity: number }>>([]);

  // Start audio listening if not already active
  useEffect(() => {
    let mounted = true;
    async function startMic() {
      try {
        await audioEngine.startListening();
        if (mounted) setIsMicActive(true);
      } catch (e) {
        console.warn('Mic auto-start error:', e);
      }
    }
    startMic();
    return () => {
      mounted = false;
    };
  }, []);

  // Track real-time samples and calculate rolling accuracy
  useEffect(() => {
    if (!currentPitch?.note || (currentPitch.clarity ?? 0) < 0.5) return;

    const now = Date.now();
    const isTargetLocked = targetMidi !== null;
    let inTune = false;

    if (isTargetLocked) {
      const sungMidi = currentPitch.note.midi;
      const semitoneDiff = sungMidi - targetMidi;
      const totalDeviation = semitoneDiff * 100 + currentPitch.cents;
      inTune = Math.abs(totalDeviation) <= 25;
    } else {
      inTune = currentPitch.isInTune;
    }

    // Add to rolling history
    historyBufferRef.current.push({
      inTune,
      cents: currentPitch.cents,
      timestamp: now,
    });

    // Keep only last 5 seconds of voice samples
    historyBufferRef.current = historyBufferRef.current.filter((s) => now - s.timestamp < 5000);

    const totalSamples = historyBufferRef.current.length;
    if (totalSamples > 0) {
      const hits = historyBufferRef.current.filter((s) => s.inTune).length;
      const pct = Math.round((hits / totalSamples) * 100);
      setRecentAccuracyPct(Math.min(100, Math.max(10, pct)));
    }

    // Streak logic
    if (inTune) {
      setCurrentStreak((prev) => {
        const next = prev + 1;
        setBestStreak((b) => Math.max(b, next));
        if (next % 20 === 0) haptics.pitchMatch();
        return next;
      });
      setSessionNotesHit((prev) => prev + 1);
    } else {
      setCurrentStreak(0);
    }

    // Append to pitch trail ribbon
    pitchTrailRef.current.push({
      midi: currentPitch.note.midi,
      cents: currentPitch.cents,
      clarity: currentPitch.clarity,
    });
    if (pitchTrailRef.current.length > 70) {
      pitchTrailRef.current.shift();
    }
  }, [currentPitch, targetMidi]);

  // Live Canvas Waveform & Pitch Ribbon Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Grid background lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let y = 0; y < h; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Center reference line
      const centerY = h / 2;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(w, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      const points = pitchTrailRef.current;
      if (points.length > 1) {
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        for (let i = 0; i < points.length - 1; i++) {
          const x1 = (i / 70) * w;
          const x2 = ((i + 1) / 70) * w;

          // Normalized offset relative to targetMidi or average
          const refMidi = targetMidi || 60;
          const diff1 = points[i].midi - refMidi + points[i].cents / 100;
          const diff2 = points[i + 1].midi - refMidi + points[i + 1].cents / 100;

          const y1 = centerY - diff1 * 14;
          const y2 = centerY - diff2 * 14;

          const isNear = Math.abs(diff2) < 0.35;
          ctx.strokeStyle = isNear ? '#10b981' : Math.abs(diff2) < 0.75 ? '#06b6d4' : '#f43f5e';

          ctx.beginPath();
          ctx.moveTo(x1, Math.max(6, Math.min(h - 6, y1)));
          ctx.lineTo(x2, Math.max(6, Math.min(h - 6, y2)));
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [targetMidi]);

  // Target Note Info
  const targetNoteInfo = useMemo(() => {
    return targetMidi ? midiToNoteInfo(targetMidi) : null;
  }, [targetMidi]);

  // Cents needle angle (-50 cents = -75 deg, +50 cents = +75 deg)
  const centsDeviation = currentPitch?.cents || 0;
  const needleRotation = Math.max(-75, Math.min(75, centsDeviation * 1.5));

  // Determine singing intonation state
  const intonationState = useMemo(() => {
    if (!currentPitch?.note || (currentPitch.clarity ?? 0) < 0.5) {
      return { status: 'idle', labelAr: 'في انتظار صوتك...', labelEn: 'Waiting for voice...', color: 'text-slate-500', glow: '' };
    }
    if (Math.abs(centsDeviation) <= 10) {
      return { status: 'perfect', labelAr: 'دوزان مثالي ممتاز ★', labelEn: 'Perfect In-Tune ★', color: 'text-emerald-400', glow: 'shadow-emerald-500/50 ring-emerald-400' };
    }
    if (Math.abs(centsDeviation) <= 22) {
      return { status: 'good', labelAr: 'نغمة جيدة ومقبولة', labelEn: 'Good Pitch Match', color: 'text-cyan-400', glow: 'shadow-cyan-500/40 ring-cyan-400' };
    }
    if (centsDeviation > 22) {
      return { status: 'sharp', labelAr: 'حاد (+Sharp) · اخفض نبرتك قليلاً', labelEn: 'Sharp (Too High)', color: 'text-amber-400', glow: 'shadow-amber-500/40 ring-amber-400' };
    }
    return { status: 'flat', labelAr: 'هابط (-Flat) · ارفع نبرتك قليلاً', labelEn: 'Flat (Too Low)', color: 'text-rose-400', glow: 'shadow-rose-500/40 ring-rose-400' };
  }, [currentPitch, centsDeviation]);

  // Tap piano reference key
  const handleTapPianoKey = (midi: number) => {
    haptics.tap();
    setTargetMidi(midi);
    audioEngine.playNote(midi, 1.4, 'piano');
  };

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full select-none pb-16 animate-in fade-in">
      {/* 
        ========================================================================
        HEADER & TOP BAR
        ========================================================================
      */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-cyan-950 border border-cyan-500/40 p-4 sm:p-5 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-cyan-950/60 shrink-0">
            <Activity className="w-6 h-6 text-cyan-200 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">
                {isAr ? 'استوديو الغناء ومؤشر النغمات اللحظي' : 'Live Singing & Pitch Intonation Studio'}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>LIVE</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isAr
                ? 'غنِّ بحرية أمام الميكروفون مع قياس فوري لأي نغمة تؤديها ومدى إتقانها ودقة الدوزان'
                : 'Sing freely into the mic with real-time note identification and accuracy gauge'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
          <InfoGuideButton
            onClick={() => setIsGuideOpen(true)}
            title={isAr ? 'معلومات استوديو الغناء ومؤشر النغمات' : 'Live Note Studio Guide'}
            size="md"
          />

          {onOpenLadderTrainer && (
            <button
              onClick={onOpenLadderTrainer}
              className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 justify-center"
            >
              <span>🪜</span>
              <span>{isAr ? 'تمرين تدرج الطبقات' : 'Vocal Ladder'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 
        ========================================================================
        CENTRAL DISPLAY: DYNAMIC PITCH GAUGE & ACCURACY DIAL
        ========================================================================
      */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Left Card: Live Accuracy & Stability Gauges */}
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between gap-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">{isAr ? 'مدى الإتقان اللحظي (5 ثوانٍ):' : 'Rolling Accuracy (5s):'}</span>
            <span className="text-xs font-mono font-bold text-cyan-400">{recentAccuracyPct}%</span>
          </div>

          {/* Large Accuracy Radial Progress */}
          <div className="flex items-center justify-center my-2">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle cx="64" cy="64" r="54" className="stroke-slate-800 fill-none" strokeWidth="8" />
                <circle
                  cx="64"
                  cy="64"
                  r="54"
                  className="stroke-cyan-400 fill-none transition-all duration-150"
                  strokeWidth="8"
                  strokeDasharray={339}
                  strokeDashoffset={339 - (339 * recentAccuracyPct) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black font-mono text-white">{recentAccuracyPct}%</span>
                <span className="text-[10px] text-slate-400 font-bold">{isAr ? 'إتقان' : 'Match'}</span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-2 text-center text-xs pt-2 border-t border-slate-800">
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">{isAr ? 'أطول ثبات:' : 'Best Streak:'}</span>
              <span className="font-mono font-bold text-amber-400 text-sm">{bestStreak} pts</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">{isAr ? 'ثبات النغمة:' : 'Stability:'}</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {currentPitch?.stability ? Math.round(currentPitch.stability * 100) : 85}%
              </span>
            </div>
          </div>
        </div>

        {/* Center Card: The Main Glowing Pitch Dial & Cents Needle */}
        <div className="md:col-span-2 p-5 rounded-3xl bg-[#070a12] border border-cyan-500/40 flex flex-col items-center justify-between shadow-2xl relative overflow-hidden">
          {/* Status guidance pill */}
          <div className="w-full flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold">
              <Mic className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className={intonationState.color}>{intonationState.labelAr}</span>
            </div>

            {targetNoteInfo && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                {isAr ? 'النغمة المستهدفة:' : 'Target:'} {formatNoteName(targetNoteInfo, notation)}
              </span>
            )}
          </div>

          {/* Glowing Note Sphere & Cents Arc */}
          <div className="relative my-4 flex flex-col items-center justify-center">
            {/* Outer Cents Meter Arc (-50 to +50 cents) */}
            <div className="relative w-56 h-36 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 200 120" className="w-full h-full">
                {/* Arc track */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                {/* Center Green In-Tune Zone */}
                <path
                  d="M 80 23 A 80 80 0 0 1 120 23"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                {/* Needle */}
                <line
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="28"
                  stroke={centsDeviation > 0 ? '#f59e0b' : '#06b6d4'}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  transform={`rotate(${needleRotation} 100 100)`}
                  className="transition-transform duration-100 origin-[100px_100px]"
                />
                <circle cx="100" cy="100" r="6" fill="#38bdf8" />
              </svg>

              {/* Arc labels */}
              <div className="absolute bottom-1 w-full flex items-center justify-between px-6 text-[10px] font-mono text-slate-500 font-bold">
                <span>-50¢ (Flat)</span>
                <span className="text-emerald-400 font-black">0¢ (In-Tune)</span>
                <span>+50¢ (Sharp)</span>
              </div>
            </div>

            {/* Giant Sung Note Display */}
            <div className={`mt-1 px-8 py-3 rounded-3xl bg-slate-900/90 border border-slate-700/80 text-center shadow-xl transition-all duration-150 ${intonationState.glow}`}>
              {currentPitch?.note ? (
                <>
                  <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                    {formatNoteName(currentPitch.note, notation)}
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-1 font-mono text-xs font-bold">
                    <span className="text-cyan-300">{Math.round(currentPitch.frequency || 0)} Hz</span>
                    <span>·</span>
                    <span className={Math.abs(centsDeviation) <= 10 ? 'text-emerald-400' : 'text-amber-400'}>
                      {centsDeviation > 0 ? `+${centsDeviation}` : centsDeviation}¢
                    </span>
                  </div>
                </>
              ) : (
                <div className="py-2 text-slate-500 text-xs italic">
                  {isAr ? 'غنِّ في الميكروفون الآن...' : 'Sing into the mic now...'}
                </div>
              )}
            </div>
          </div>

          {/* Quick Guidance Tip */}
          <div className="w-full text-center text-[11px] text-slate-400 font-mono">
            {currentPitch?.note && targetNoteInfo ? (
              <span>
                {Math.abs(currentPitch.note.midi - targetNoteInfo.midi) === 0 && Math.abs(centsDeviation) <= 12
                  ? (isAr ? 'أنت على النغمة المستهدفة بالضبط! استمر في تثبيت النفس' : 'Locked on target pitch! Keep holding breath')
                  : (isAr ? `المسافة عن النغمة المستهدفة: ${(currentPitch.note.midi - targetNoteInfo.midi) * 100 + centsDeviation} سنت` : `Distance to target: ${(currentPitch.note.midi - targetNoteInfo.midi) * 100 + centsDeviation} cents`)}
              </span>
            ) : (
              <span>{isAr ? 'المس أي مفتاح على البيانو بالأسفل لسماع النغمة وتقليدها' : 'Tap any piano key below to hear reference note'}</span>
            )}
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        SCROLLING LIVE PITCH RIBBON / TRAJECTORY CANVAS
        ========================================================================
      */}
      <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-black text-white">
              {isAr ? 'مسار النغمات الغنائية الحي (Melodic Ribbon):' : 'Live Melodic Trajectory Ribbon:'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">{isAr ? 'تتبع لحظي مستمر' : 'Continuous pitch trail'}</span>
        </div>

        <canvas
          ref={canvasRef}
          width={700}
          height={110}
          className="w-full h-28 rounded-2xl bg-slate-950 border border-slate-800/90"
        />
      </div>

      {/* 
        ========================================================================
        INTERACTIVE PIANO REFERENCE BAR: ONE-TOUCH NOTE TARGETING
        ========================================================================
      */}
      <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PianoIcon className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black text-white">
              {isAr ? 'اعزف أي نغمة على البيانو لتقليدها بصوتك مباشرة:' : 'Tap any piano note to match with your voice:'}
            </span>
          </div>

          {/* Octave switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono font-bold">
            {[2, 3, 4, 5].map((oct) => (
              <button
                key={oct}
                onClick={() => {
                  haptics.tap();
                  setSelectedOctave(oct);
                  handleTapPianoKey((oct + 1) * 12);
                }}
                className={`px-2 py-0.5 rounded-lg transition ${
                  selectedOctave === oct ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                C{oct}
              </button>
            ))}
          </div>
        </div>

        {/* 12-TET Chromatic Keyboard Strip */}
        <div className="grid grid-cols-7 sm:grid-cols-12 gap-1" dir="ltr">
          {[
            { semitone: 0, solfege: 'Do', ar: 'دو', isBlack: false },
            { semitone: 1, solfege: 'Do#', ar: 'دو#', isBlack: true },
            { semitone: 2, solfege: 'Re', ar: 'ري', isBlack: false },
            { semitone: 3, solfege: 'Re#', ar: 'ري#', isBlack: true },
            { semitone: 4, solfege: 'Mi', ar: 'مي', isBlack: false },
            { semitone: 5, solfege: 'Fa', ar: 'فا', isBlack: false },
            { semitone: 6, solfege: 'Fa#', ar: 'فا#', isBlack: true },
            { semitone: 7, solfege: 'Sol', ar: 'صول', isBlack: false },
            { semitone: 8, solfege: 'Sol#', ar: 'صول#', isBlack: true },
            { semitone: 9, solfege: 'La', ar: 'لا', isBlack: false },
            { semitone: 10, solfege: 'La#', ar: 'لا#', isBlack: true },
            { semitone: 11, solfege: 'Si', ar: 'سي', isBlack: false },
          ].map((keyItem) => {
            const keyMidi = (selectedOctave + 1) * 12 + keyItem.semitone;
            const isTarget = targetMidi === keyMidi;
            const isCurrentlySingingThis = currentPitch?.note?.midi === keyMidi;

            let keyStyle = keyItem.isBlack
              ? 'bg-slate-950 border-slate-800 text-slate-300'
              : 'bg-slate-800 border-slate-700 text-white';

            if (isTarget) {
              keyStyle = 'bg-cyan-500 border-cyan-400 text-slate-950 font-black ring-2 ring-cyan-400/50 shadow-md';
            } else if (isCurrentlySingingThis) {
              keyStyle = 'bg-emerald-500 border-emerald-400 text-slate-950 font-black ring-2 ring-emerald-400/50';
            }

            return (
              <button
                key={keyMidi}
                onClick={() => handleTapPianoKey(keyMidi)}
                className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-between transition-all duration-150 active:scale-95 ${keyStyle}`}
              >
                <span className="text-[10px] font-mono font-bold">{keyItem.solfege}</span>
                <span className="text-xs font-black my-0.5">{isAr ? keyItem.ar : keyItem.solfege}</span>
                <span className="text-[8px] font-mono opacity-75">{keyMidi}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed Physiological & Acoustic Guide Modal */}
      <DetailedGuideModal
        guideId="section_live_studio"
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        language={language}
      />
    </div>
  );
};
