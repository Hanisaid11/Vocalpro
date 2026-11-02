import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Volume2,
  Mic,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Music,
  Zap,
  Flame,
  Award,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Play,
  Activity,
  Layers,
} from 'lucide-react';
import {
  NoteInfo,
  VocalRangeProfile,
  PitchDetectionResult,
  AppLanguage,
  NotationSystem,
  PitchGameRecord,
  AppTheme,
  InstrumentType,
} from '../../types/vocal';
import { midiToNoteInfo, formatNoteName, generateNotesRange } from '../../utils/noteUtils';
import { audioEngine } from '../../audio/audioEngine';
import { translations, INSTRUMENT_NAMES } from '../../utils/i18n';
import { THEMES } from '../../utils/theme';
import { haptics } from '../../utils/haptics';
import { fire3StarCelebration } from '../../utils/confetti';

interface HearGuessMimicStudioProps {
  profile: VocalRangeProfile;
  currentPitch: PitchDetectionResult | null;
  language: AppLanguage;
  notation: NotationSystem;
  theme?: AppTheme;
  onRecordGameSession: (record: PitchGameRecord) => void;
  onBackToHub: () => void;
}

export type PlaybackTarget = 'piano' | 'oud';
export type StudioSubMode = 'dual' | 'guess_only' | 'mimic_only';

export const HearGuessMimicStudio: React.FC<HearGuessMimicStudioProps> = ({
  profile,
  currentPitch,
  language,
  notation,
  theme = 'classic-piano',
  onRecordGameSession,
  onBackToHub,
}) => {
  const t = translations[language] || translations.en;
  const isAr = language === 'ar';
  const themeConfig = THEMES[theme] || THEMES['classic-piano'];

  // Instrument choice: Grand Piano or Arabic Oud
  const [instrument, setInstrument] = useState<PlaybackTarget>('piano');
  const [subMode, setSubMode] = useState<StudioSubMode>('dual');

  // Octave Range for the mystery tone
  const [octaveFilter, setOctaveFilter] = useState<'my_range' | 3 | 4 | 5>('my_range');

  // Target mystery note
  const [targetNote, setTargetNote] = useState<NoteInfo>(() => {
    return profile.middleRegisterNote || midiToNoteInfo(60);
  });

  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  // Guess feedback state
  const [lastGuessedNote, setLastGuessedNote] = useState<NoteInfo | null>(null);
  const [guessFeedback, setGuessFeedback] = useState<'correct' | 'higher' | 'lower' | null>(null);
  const [semitonesOff, setSemitonesOff] = useState<number | null>(null);

  // Vocal Mimic state
  const [mimicHoldProgress, setMimicHoldProgress] = useState<number>(0); // 0 to 1
  const [hasVoiceMatched, setHasVoiceMatched] = useState<boolean>(false);
  const [voiceSimilarityPct, setVoiceSimilarityPct] = useState<number>(0);

  // Stats
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [highestStreak, setHighestStreak] = useState<number>(0);
  const [roundsCount, setRoundsCount] = useState<number>(1);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [correctHits, setCorrectHits] = useState<number>(0);

  // Available notes pool
  const candidateNotes = useMemo(() => {
    if (octaveFilter === 'my_range') {
      const min = Math.max(36, profile.lowestNote.midi);
      const max = Math.min(84, profile.highestNote.midi);
      return generateNotesRange(min, max);
    }
    const rootMidi = (octaveFilter + 1) * 12; // C3=48, C4=60, C5=72
    return generateNotesRange(rootMidi, rootMidi + 12);
  }, [octaveFilter, profile]);

  // Keys to display on the mini piano (spanning the active pool)
  const displayWhiteKeys = useMemo(() => {
    return candidateNotes.filter((n) => !n.name.includes('#'));
  }, [candidateNotes]);

  // Play target sound
  const playTargetSound = async (note = targetNote, inst = instrument) => {
    setIsPlayingAudio(true);
    try {
      await audioEngine.playTone(note.frequency, 1.4, inst, note.midi);
    } finally {
      setTimeout(() => {
        setIsPlayingAudio(false);
      }, 1000);
    }
  };

  // Spawn new mystery tone
  const spawnNewTarget = (excludeMidi?: number) => {
    if (candidateNotes.length === 0) return;
    let next = candidateNotes[Math.floor(Math.random() * candidateNotes.length)];
    if (candidateNotes.length > 2 && excludeMidi && next.midi === excludeMidi) {
      const filtered = candidateNotes.filter((n) => n.midi !== excludeMidi);
      next = filtered[Math.floor(Math.random() * filtered.length)];
    }

    setTargetNote(next);
    setIsRevealed(false);
    setLastGuessedNote(null);
    setGuessFeedback(null);
    setSemitonesOff(null);
    setMimicHoldProgress(0);
    setHasVoiceMatched(false);
    setVoiceSimilarityPct(0);

    setTimeout(() => {
      playTargetSound(next);
    }, 350);
  };

  // On mount or octave change, pick new target
  useEffect(() => {
    spawnNewTarget();
  }, [octaveFilter]);

  // Handle Piano Key Guess (Mode 1)
  const handleKeyGuess = (guessedNote: NoteInfo) => {
    if (hasVoiceMatched || (isRevealed && guessFeedback === 'correct')) return;
    haptics.tap();

    // Play guessed tone so user's ear immediately registers the pitch
    audioEngine.playTone(guessedNote.frequency, 0.7, instrument, guessedNote.midi);
    setLastGuessedNote(guessedNote);
    setTotalAttempts((prev) => prev + 1);

    const isCorrect = guessedNote.midi === targetNote.midi;
    if (isCorrect) {
      // Correct guess!
      haptics.pitchMatch();
      audioEngine.playSuccessChime();
      setIsRevealed(true);
      setGuessFeedback('correct');
      setSemitonesOff(0);

      const pts = 100 + streak * 25;
      setScore((s) => s + pts);
      setStreak((st) => {
        const next = st + 1;
        setHighestStreak((h) => Math.max(h, next));
        return next;
      });
      setCorrectHits((c) => c + 1);

      // Auto-advance after 1.3s
      setTimeout(() => {
        setRoundsCount((r) => r + 1);
        spawnNewTarget(targetNote.midi);
      }, 1300);
    } else {
      // Wrong guess: indicate too high or too low
      haptics.streakLost();
      setStreak(0);
      const diff = guessedNote.midi - targetNote.midi;
      setSemitonesOff(diff);
      setGuessFeedback(diff > 0 ? 'higher' : 'lower');
    }
  };

  // Real-time Vocal Mimic Tracking (Mode 2: User sings into microphone to imitate)
  useEffect(() => {
    if (hasVoiceMatched || isRevealed) return;
    if (!currentPitch?.note || (currentPitch.clarity ?? 0) < 0.55) {
      setVoiceSimilarityPct(0);
      setMimicHoldProgress((prev) => Math.max(0, prev - 0.05));
      return;
    }

    const sungMidi = currentPitch.note.midi;
    const targetMidi = targetNote.midi;
    const semitoneDiff = Math.abs(sungMidi - targetMidi);
    const centsError = Math.abs((sungMidi - targetMidi) * 100 + currentPitch.cents);

    // Calculate live vocal similarity match (0 - 100%)
    const sim = Math.max(0, Math.min(100, Math.round(100 - (centsError / 100) * 45)));
    setVoiceSimilarityPct(sim);

    // Check if voice matches within +/- 20 cents
    const isInTune = semitoneDiff === 0 && Math.abs(currentPitch.cents) <= 20;

    if (isInTune) {
      setMimicHoldProgress((prev) => {
        const next = prev + 0.08;
        if (next >= 1) {
          // Success! Vocal Mimic Match!
          haptics.pitchMatch();
          audioEngine.playSuccessChime();
          fire3StarCelebration();
          setHasVoiceMatched(true);
          setIsRevealed(true);

          const bonusPts = 150 + streak * 30;
          setScore((s) => s + bonusPts);
          setStreak((st) => {
            const nextSt = st + 1;
            setHighestStreak((h) => Math.max(h, nextSt));
            return nextSt;
          });
          setCorrectHits((c) => c + 1);
          setTotalAttempts((a) => a + 1);

          setTimeout(() => {
            setRoundsCount((r) => r + 1);
            spawnNewTarget(targetNote.midi);
          }, 1500);

          return 1;
        }
        return next;
      });
    } else {
      setMimicHoldProgress((prev) => Math.max(0, prev - 0.04));
    }
  }, [currentPitch, targetNote, hasVoiceMatched, isRevealed, streak]);

  // Compare Piano Tone vs Voice (Plays piano note followed by user's target frequency)
  const handleCompareSounds = async () => {
    haptics.tap();
    setIsPlayingAudio(true);
    // 1. Play target piano note
    await audioEngine.playTone(targetNote.frequency, 1.2, instrument, targetNote.midi);
    // 2. Play subtle vocal timbre representation
    setTimeout(async () => {
      await audioEngine.playTone(targetNote.frequency, 1.2, 'vocal', targetNote.midi);
      setIsPlayingAudio(false);
    }, 1300);
  };

  const handleFinishSession = () => {
    const accuracy = totalAttempts > 0 ? Math.round((correctHits / totalAttempts) * 100) : 0;
    const record: PitchGameRecord = {
      id: `guess-mimic-${Date.now()}`,
      gameType: 'hear_guess_mimic',
      score,
      highestStreak,
      accuracyPercentage: Math.min(100, accuracy),
      totalNotes: totalAttempts,
      notesHit: correctHits,
      date: new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US'),
      timestamp: Date.now(),
    };
    onRecordGameSession(record);
    onBackToHub();
  };

  return (
    <div className="flex flex-col gap-3.5 max-w-2xl mx-auto w-full select-none pb-8 animate-in fade-in">
      {/* Top Header Bar */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/40 p-4 rounded-3xl shadow-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0">
            <Music className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>{t.hearGuessMimicTitle}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                Round #{roundsCount}
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              {t.hearGuessMimicDesc}
            </p>
          </div>
        </div>

        <button
          onClick={handleFinishSession}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition shrink-0"
        >
          {isAr ? 'حفظ وخروج' : 'Exit'}
        </button>
      </div>

      {/* HUD: Score, Streak, Accuracy */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl flex flex-col justify-center">
          <span className="text-[10px] text-slate-400 block">{t.score}</span>
          <span className="text-base font-black text-amber-400 font-mono">{score}</span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl flex flex-col justify-center">
          <div className="flex items-center justify-center gap-1 text-[10px] text-pink-400">
            <Flame className="w-3.5 h-3.5 fill-pink-500" />
            <span>{t.streak}</span>
          </div>
          <span className="text-base font-black text-pink-400 font-mono">{streak}x</span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl flex flex-col justify-center">
          <span className="text-[10px] text-slate-400 block">{isAr ? 'الدقة' : 'Accuracy'}</span>
          <span className="text-base font-black text-cyan-400 font-mono">
            {totalAttempts > 0 ? Math.round((correctHits / totalAttempts) * 100) : 100}%
          </span>
        </div>
      </div>

      {/* Mode Controls: Instrument Choice (Piano vs Oud) & Octave */}
      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Instrument Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              haptics.tap();
              setInstrument('piano');
              audioEngine.setInstrument('piano');
              playTargetSound(targetNote, 'piano');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              instrument === 'piano'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🎹</span>
            <span>{isAr ? 'بيانو' : 'Piano'}</span>
          </button>
          <button
            onClick={() => {
              haptics.tap();
              setInstrument('oud');
              audioEngine.setInstrument('oud');
              playTargetSound(targetNote, 'oud');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              instrument === 'oud'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🪕</span>
            <span>{isAr ? 'عود عربي' : 'Oud'}</span>
          </button>
        </div>

        {/* Octave Range Filter */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 font-mono">
          <span className="text-[10px] text-slate-400 px-1 font-sans">{isAr ? 'النطاق:' : 'Range:'}</span>
          <button
            onClick={() => {
              haptics.tap();
              setOctaveFilter('my_range');
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
              octaveFilter === 'my_range' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            {isAr ? 'طبقتي' : 'My Range'}
          </button>
          {[3, 4, 5].map((oct) => (
            <button
              key={oct}
              onClick={() => {
                haptics.tap();
                setOctaveFilter(oct as 3 | 4 | 5);
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                octaveFilter === oct ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              C{oct}
            </button>
          ))}
        </div>
      </div>

      {/* 
        ========================================================================
        CENTRAL SOUND STAGE: MYSTERY NOTE PLAY + DUAL INPUT
        ========================================================================
      */}
      <div className="p-5 rounded-3xl bg-[#060912] border border-slate-800 shadow-2xl flex flex-col items-center text-center gap-4 relative overflow-hidden">
        {/* Glow halo */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
            hasVoiceMatched || guessFeedback === 'correct'
              ? 'opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500 via-transparent to-transparent'
              : 'opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500 via-transparent to-transparent'
          }`}
        />

        {/* Big Mystery Sound Replay Orb */}
        <div className="relative">
          <button
            onClick={() => playTargetSound()}
            disabled={isPlayingAudio}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-95 ${
              isPlayingAudio
                ? 'bg-gradient-to-tr from-amber-400 to-pink-500 text-slate-950 ring-8 ring-amber-400/30 scale-105 animate-pulse'
                : 'bg-gradient-to-tr from-amber-500 via-indigo-600 to-cyan-500 text-white shadow-indigo-950/60 hover:brightness-110'
            }`}
            title="Replay Mystery Tone"
          >
            <Volume2 className={`w-9 h-9 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
          </button>
          {isPlayingAudio && (
            <span className="absolute -inset-3 rounded-full border border-amber-400/60 animate-ping pointer-events-none" />
          )}
        </div>

        {/* Action Prompt */}
        <div className="space-y-1">
          <h3 className="text-sm font-extrabold text-white">
            {isRevealed
              ? (isAr ? `النغمة كانت: ${formatNoteName(targetNote, notation)} (${Math.round(targetNote.frequency)} ${t.hzUnit})` : `Note: ${formatNoteName(targetNote, notation)}`)
              : (isAr ? 'عزف البيانو نغمة مجهولة!' : 'Mystery Pitch Played!')}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm">
            {isAr
              ? 'يمكنك حزرها بالضغط على مفتاح البيانو بالأسفل، أو تقليدها بصوتك مباشرة في الميكروفون!'
              : 'Tap the matching piano key below, or imitate the tone with your voice into the mic!'}
          </p>
        </div>

        {/* Replay & Sound Comparison Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => playTargetSound()}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAr ? 'إعادة عزف النغمة' : 'Replay Tone'}</span>
          </button>

          <button
            onClick={handleCompareSounds}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 hover:text-cyan-200 text-xs font-bold flex items-center gap-1.5 transition"
            title="Hear both piano and human vocal timbre"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.compareSounds}</span>
          </button>
        </div>

        {/* 
          ======================================================================
          VOCAL MIMIC RADAR & LIVE PITCH TRACKER (تقليد النغمة بالصوت)
          ======================================================================
        */}
        <div className="w-full max-w-md p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-white flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>{isAr ? 'مستشعر تقليد النغمة بصوتك:' : 'Vocal Mimic Live Sensor:'}</span>
            </span>
            <span className="font-mono text-cyan-400 font-bold">
              {voiceSimilarityPct}% {isAr ? 'تطابق' : 'match'}
            </span>
          </div>

          {/* Hold Countdown Meter */}
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              style={{ width: `${mimicHoldProgress * 100}%` }}
              className={`h-full rounded-full transition-all duration-100 ${
                mimicHoldProgress >= 1
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-300 shadow-[0_0_12px_#10b981]'
                  : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
              }`}
            />
          </div>

          {/* Live Pitch Feedback readouts */}
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="text-slate-400">
              {currentPitch?.note ? (
                <span className="flex items-center gap-1 text-white">
                  <span>{formatNoteName(currentPitch.note, notation)}</span>
                  <span className="text-[10px] text-slate-400">({Math.round(currentPitch.frequency || 0)} Hz)</span>
                </span>
              ) : (
                <span className="text-slate-500 italic text-[11px]">{t.mimicPrompt}</span>
              )}
            </div>

            {currentPitch?.note && (
              <span
                className={`font-bold text-xs ${
                  Math.abs(currentPitch.cents) <= 20 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {currentPitch.cents > 0 ? `+${currentPitch.cents}` : currentPitch.cents}¢
              </span>
            )}
          </div>

          {/* Success Banner upon vocal mimic lock */}
          {hasVoiceMatched && (
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{t.voiceMatched} (+150 pts)</span>
            </div>
          )}
        </div>

        {/* Guess Feedback Alert (When clicking keys) */}
        {guessFeedback && !hasVoiceMatched && (
          <div
            className={`w-full max-w-md p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold animate-in zoom-in-95 ${
              guessFeedback === 'correct'
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                : 'bg-rose-950/80 border-rose-500 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {guessFeedback === 'correct' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>
                {guessFeedback === 'correct'
                  ? `${t.correct} ${formatNoteName(targetNote, notation)}`
                  : guessFeedback === 'higher'
                  ? (isAr ? `تخمينك كان أعلى بـ +${semitonesOff} نصف نغمة ↗` : `Your pick was too high (+${semitonesOff} st)`)
                  : (isAr ? `تخمينك كان أخفض بـ ${Math.abs(semitonesOff || 0)} نصف نغمة ↘` : `Your pick was too low (${semitonesOff} st)`)}
              </span>
            </div>
            {guessFeedback !== 'correct' && (
              <span className="text-[10px] text-amber-300 font-mono">حاول مجدداً أو قلّدها بصوتك</span>
            )}
          </div>
        )}
      </div>

      {/* 
        ========================================================================
        INTERACTIVE PIANO KEYBOARD TO GUESS (احزر بالضغط على المفاتيح)
        ========================================================================
      */}
      <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs text-slate-300 px-1">
          <span className="font-extrabold flex items-center gap-1.5">
            <span>🎹</span>
            <span>{isAr ? 'اضغط المفتاح الذي سمعته لتخمين النغمة:' : 'Tap key to submit your guess:'}</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {displayWhiteKeys[0]?.fullName} – {displayWhiteKeys[displayWhiteKeys.length - 1]?.fullName}
          </span>
        </div>

        {/* Piano Keys Viewport */}
        <div className="relative overflow-x-auto pb-2 select-none" dir="ltr">
          <div
            className="relative flex h-[175px] mx-auto"
            style={{ width: `${displayWhiteKeys.length * 48}px` }}
          >
            {/* White Keys */}
            {displayWhiteKeys.map((note, idx) => {
              const isTargetRevealed = isRevealed && targetNote.midi === note.midi;
              const isGuessedWrong = lastGuessedNote && lastGuessedNote.midi === note.midi && guessFeedback !== 'correct';

              return (
                <button
                  key={`white-${note.midi}`}
                  onClick={() => handleKeyGuess(note)}
                  style={{
                    left: `${idx * 48}px`,
                    width: '48px',
                  }}
                  className={`absolute top-0 h-[175px] rounded-b-xl flex flex-col justify-end items-center pb-3 border-r border-slate-300 transition-all active:scale-[0.98] ${
                    isTargetRevealed
                      ? 'bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/50 ring-4 ring-emerald-300 z-20'
                      : isGuessedWrong
                      ? 'bg-rose-400 text-slate-950 font-bold z-20'
                      : `${themeConfig.keyWhiteBg} ${themeConfig.keyWhiteText}`
                  }`}
                >
                  <span className="font-bold font-mono text-xs">
                    {formatNoteName(note, notation)}
                  </span>
                  <span className="text-[9px] opacity-60 font-mono">
                    {Math.round(note.frequency)}
                  </span>
                </button>
              );
            })}

            {/* Black Keys */}
            {displayWhiteKeys.map((whiteNote, idx) => {
              const blackMidi = whiteNote.midi + 1;
              const blackNote = candidateNotes.find((n) => n.midi === blackMidi && n.name.includes('#'));
              if (!blackNote) return null;

              const isTargetRevealed = isRevealed && targetNote.midi === blackNote.midi;
              const isGuessedWrong = lastGuessedNote && lastGuessedNote.midi === blackNote.midi && guessFeedback !== 'correct';
              const leftOffset = idx * 48 + 32;

              return (
                <button
                  key={`black-${blackNote.midi}`}
                  onClick={() => handleKeyGuess(blackNote)}
                  style={{
                    left: `${leftOffset}px`,
                    width: '32px',
                  }}
                  className={`absolute top-0 h-[110px] rounded-b-lg z-30 flex flex-col justify-end items-center pb-2.5 transition-all active:scale-[0.98] ${
                    isTargetRevealed
                      ? 'bg-emerald-400 text-slate-950 font-black shadow-xl ring-2 ring-emerald-300'
                      : isGuessedWrong
                      ? 'bg-rose-500 text-white font-bold'
                      : `${themeConfig.keyBlackBg} ${themeConfig.keyBlackText}`
                  }`}
                >
                  <span className="text-[9px] font-bold font-mono">
                    {formatNoteName(blackNote, notation)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Skip / Next Tone Button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={() => spawnNewTarget(targetNote.midi)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isAr ? 'تخطي لنغمة أخرى' : 'Skip / Next Note'}</span>
          </button>

          <span className="text-xs text-slate-400 font-mono">
            {correctHits} / {totalAttempts} {isAr ? 'تطابقات صحيحة' : 'correct hits'}
          </span>
        </div>
      </div>
    </div>
  );
};
