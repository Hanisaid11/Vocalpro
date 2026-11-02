import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Upload,
  Link as LinkIcon,
  Play,
  Square,
  Mic,
  Award,
  AlertCircle,
  CheckCircle2,
  Volume2,
  RefreshCw,
  TrendingUp,
  Music,
  Clock,
  Sparkles,
  HelpCircle,
  FileAudio,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Activity,
  Target,
} from 'lucide-react';
import {
  NoteInfo,
  VocalRangeProfile,
  PitchDetectionResult,
  AppLanguage,
  NotationSystem,
  AppTheme,
} from '../../types/vocal';
import { midiToNoteInfo, formatNoteName } from '../../utils/noteUtils';
import { audioEngine } from '../../audio/audioEngine';
import { translations } from '../../utils/i18n';
import { haptics } from '../../utils/haptics';
import {
  SongProgressRecord,
  SongProgressSummary,
  SongErrorPoint,
  saveSongProgressRecord,
  loadAllSongProgress,
} from '../../utils/storage';
import { useMobileBackHandler } from '../../utils/useMobileBackButton';
import { fire3StarCelebration } from '../../utils/confetti';
import { VisualMetronomePulse } from '../Audio/VisualMetronomePulse';

export interface TargetMelodyNote {
  timeSec: number;
  durationSec: number;
  midi: number;
  noteName: string;
  lyric?: string;
}

export interface PresetSong {
  id: string;
  titleEn: string;
  titleAr: string;
  artistEn: string;
  artistAr: string;
  genre: string;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  notes: TargetMelodyNote[];
  bpm: number;
  totalDurationSec: number;
}

// Preset library of famous Arabic and international vocal standards
export const PRESET_SONGS: PresetSong[] = [
  {
    id: 'nassam_fairouz',
    titleEn: 'Nassam Alayna El Hawa',
    titleAr: 'نسم علينا الهوى',
    artistEn: 'Fairouz',
    artistAr: 'فيروز',
    genre: 'Classic Arabic',
    difficulty: 'Easy',
    bpm: 84,
    totalDurationSec: 24,
    notes: [
      { timeSec: 1.0, durationSec: 1.2, midi: 65, noteName: 'F4', lyric: 'نسّـ' },
      { timeSec: 2.3, durationSec: 1.1, midi: 64, noteName: 'E4', lyric: 'ـم' },
      { timeSec: 3.5, durationSec: 1.4, midi: 62, noteName: 'D4', lyric: 'عليـ' },
      { timeSec: 5.0, durationSec: 1.8, midi: 60, noteName: 'C4', lyric: 'ـنا' },
      { timeSec: 7.2, durationSec: 1.2, midi: 62, noteName: 'D4', lyric: 'الهـ' },
      { timeSec: 8.5, durationSec: 2.2, midi: 65, noteName: 'F4', lyric: 'ـوى' },
      { timeSec: 11.0, durationSec: 1.1, midi: 67, noteName: 'G4', lyric: 'من' },
      { timeSec: 12.2, durationSec: 1.3, midi: 65, noteName: 'F4', lyric: 'مفرق' },
      { timeSec: 13.6, durationSec: 1.8, midi: 64, noteName: 'E4', lyric: 'الوادي' },
      { timeSec: 16.0, durationSec: 1.2, midi: 62, noteName: 'D4', lyric: 'يا' },
      { timeSec: 17.3, durationSec: 2.0, midi: 60, noteName: 'C4', lyric: 'هوا' },
      { timeSec: 19.8, durationSec: 2.4, midi: 58, noteName: 'Bb3', lyric: 'دخل' },
      { timeSec: 22.4, durationSec: 1.6, midi: 60, noteName: 'C4', lyric: 'الهوا' },
    ],
  },
  {
    id: 'lamma_bada',
    titleEn: 'Lamma Bada Yatathanna',
    titleAr: 'لما بدا يتثنى',
    artistEn: 'Andalusian Muwashah',
    artistAr: 'موشح أندلسي',
    genre: 'Muwashah / Tarab',
    difficulty: 'Medium',
    bpm: 76,
    totalDurationSec: 22,
    notes: [
      { timeSec: 1.0, durationSec: 1.4, midi: 62, noteName: 'D4', lyric: 'لمّا' },
      { timeSec: 2.5, durationSec: 1.2, midi: 63, noteName: 'Eb4', lyric: 'بدا' },
      { timeSec: 3.8, durationSec: 1.8, midi: 66, noteName: 'F#4', lyric: 'يتـ' },
      { timeSec: 5.8, durationSec: 2.2, midi: 67, noteName: 'G4', lyric: 'ـثنّى' },
      { timeSec: 8.2, durationSec: 1.2, midi: 66, noteName: 'F#4', lyric: 'حبي' },
      { timeSec: 9.6, durationSec: 1.5, midi: 63, noteName: 'Eb4', lyric: 'جمالـ' },
      { timeSec: 11.2, durationSec: 2.2, midi: 62, noteName: 'D4', lyric: 'ـه' },
      { timeSec: 14.0, durationSec: 1.2, midi: 65, noteName: 'F4', lyric: 'فتنـ' },
      { timeSec: 15.4, durationSec: 1.8, midi: 63, noteName: 'Eb4', lyric: 'ـا' },
      { timeSec: 17.5, durationSec: 1.5, midi: 62, noteName: 'D4', lyric: 'أمر' },
      { timeSec: 19.2, durationSec: 2.4, midi: 60, noteName: 'C4', lyric: 'ما' },
    ],
  },
  {
    id: 'inta_omri',
    titleEn: 'Inta Omri (Intro Melody)',
    titleAr: 'أنت عمري (مطلع الأغنية)',
    artistEn: 'Umm Kulthum',
    artistAr: 'أم كلثوم',
    genre: 'Tarab',
    difficulty: 'Advanced',
    bpm: 68,
    totalDurationSec: 24,
    notes: [
      { timeSec: 1.2, durationSec: 1.5, midi: 58, noteName: 'Bb3', lyric: 'رجّـ' },
      { timeSec: 2.8, durationSec: 1.4, midi: 60, noteName: 'C4', lyric: 'ـعوني' },
      { timeSec: 4.4, durationSec: 2.0, midi: 61, noteName: 'C#4', lyric: 'عينيك' },
      { timeSec: 6.8, durationSec: 1.8, midi: 65, noteName: 'F4', lyric: 'لأيامي' },
      { timeSec: 9.0, durationSec: 2.5, midi: 63, noteName: 'Eb4', lyric: 'اللي' },
      { timeSec: 12.0, durationSec: 1.5, midi: 61, noteName: 'C#4', lyric: 'راحـ' },
      { timeSec: 13.8, durationSec: 2.2, midi: 60, noteName: 'C4', lyric: 'ـوا' },
      { timeSec: 16.5, durationSec: 2.0, midi: 58, noteName: 'Bb3', lyric: 'علموني' },
      { timeSec: 19.0, durationSec: 2.5, midi: 60, noteName: 'C4', lyric: 'أندم' },
      { timeSec: 22.0, durationSec: 2.0, midi: 58, noteName: 'Bb3', lyric: 'ع الماضي' },
    ],
  },
  {
    id: 'hallelujah_cohen',
    titleEn: 'Hallelujah',
    titleAr: 'هاليلويا',
    artistEn: 'Leonard Cohen',
    artistAr: 'ليونارد كوهين',
    genre: 'Ballad',
    difficulty: 'Easy',
    bpm: 72,
    totalDurationSec: 22,
    notes: [
      { timeSec: 1.0, durationSec: 1.2, midi: 60, noteName: 'C4', lyric: 'I' },
      { timeSec: 2.3, durationSec: 1.2, midi: 64, noteName: 'E4', lyric: 'heard' },
      { timeSec: 3.6, durationSec: 1.2, midi: 64, noteName: 'E4', lyric: 'there' },
      { timeSec: 4.9, durationSec: 1.2, midi: 64, noteName: 'E4', lyric: 'was' },
      { timeSec: 6.2, durationSec: 1.2, midi: 62, noteName: 'D4', lyric: 'a' },
      { timeSec: 7.5, durationSec: 1.5, midi: 64, noteName: 'E4', lyric: 'se-cret' },
      { timeSec: 9.2, durationSec: 2.2, midi: 65, noteName: 'F4', lyric: 'chord' },
      { timeSec: 12.0, durationSec: 1.4, midi: 65, noteName: 'F4', lyric: 'That' },
      { timeSec: 13.5, durationSec: 1.4, midi: 64, noteName: 'E4', lyric: 'Da-vid' },
      { timeSec: 15.0, durationSec: 1.6, midi: 62, noteName: 'D4', lyric: 'played' },
      { timeSec: 17.0, durationSec: 2.2, midi: 60, noteName: 'C4', lyric: 'and it' },
      { timeSec: 19.5, durationSec: 2.5, midi: 64, noteName: 'E4', lyric: 'pleased the Lord' },
    ],
  },
  {
    id: 'fly_me_to_moon',
    titleEn: 'Fly Me to the Moon',
    titleAr: 'حلّق بي للقمر',
    artistEn: 'Frank Sinatra',
    artistAr: 'فرانك سيناترا',
    genre: 'Jazz / Standard',
    difficulty: 'Medium',
    bpm: 110,
    totalDurationSec: 18,
    notes: [
      { timeSec: 0.8, durationSec: 1.0, midi: 64, noteName: 'E4', lyric: 'Fly' },
      { timeSec: 1.9, durationSec: 0.8, midi: 62, noteName: 'D4', lyric: 'me' },
      { timeSec: 2.8, durationSec: 0.8, midi: 60, noteName: 'C4', lyric: 'to' },
      { timeSec: 3.7, durationSec: 1.0, midi: 59, noteName: 'B3', lyric: 'the' },
      { timeSec: 4.8, durationSec: 2.0, midi: 57, noteName: 'A3', lyric: 'moon' },
      { timeSec: 7.0, durationSec: 0.9, midi: 59, noteName: 'B3', lyric: 'Let' },
      { timeSec: 8.0, durationSec: 0.9, midi: 60, noteName: 'C4', lyric: 'me' },
      { timeSec: 9.0, durationSec: 1.4, midi: 64, noteName: 'E4', lyric: 'play' },
      { timeSec: 10.6, durationSec: 1.0, midi: 62, noteName: 'D4', lyric: 'a-' },
      { timeSec: 11.7, durationSec: 1.6, midi: 60, noteName: 'C4', lyric: 'mong' },
      { timeSec: 13.5, durationSec: 2.2, midi: 59, noteName: 'B3', lyric: 'the stars' },
    ],
  },
  {
    id: 'someone_like_you',
    titleEn: 'Someone Like You',
    titleAr: 'شخص يشبهك',
    artistEn: 'Adele',
    artistAr: 'أديل',
    genre: 'Pop / Soul',
    difficulty: 'Advanced',
    bpm: 68,
    totalDurationSec: 22,
    notes: [
      { timeSec: 1.0, durationSec: 1.2, midi: 61, noteName: 'C#4', lyric: 'I' },
      { timeSec: 2.3, durationSec: 1.2, midi: 64, noteName: 'E4', lyric: 'heard' },
      { timeSec: 3.6, durationSec: 1.4, midi: 66, noteName: 'F#4', lyric: 'that' },
      { timeSec: 5.2, durationSec: 1.8, midi: 69, noteName: 'A4', lyric: 'you\'re' },
      { timeSec: 7.2, durationSec: 1.4, midi: 68, noteName: 'G#4', lyric: 'settled' },
      { timeSec: 8.8, durationSec: 2.0, midi: 66, noteName: 'F#4', lyric: 'down' },
      { timeSec: 11.2, durationSec: 1.2, midi: 64, noteName: 'E4', lyric: 'That' },
      { timeSec: 12.5, durationSec: 1.2, midi: 66, noteName: 'F#4', lyric: 'you' },
      { timeSec: 13.8, durationSec: 1.6, midi: 69, noteName: 'A4', lyric: 'found' },
      { timeSec: 15.6, durationSec: 1.2, midi: 68, noteName: 'G#4', lyric: 'a' },
      { timeSec: 17.0, durationSec: 2.2, midi: 66, noteName: 'F#4', lyric: 'girl' },
      { timeSec: 19.5, durationSec: 2.4, midi: 64, noteName: 'E4', lyric: 'and you\'re married now' },
    ],
  },
];

interface SongMatchStudioProps {
  profile: VocalRangeProfile;
  currentPitch: PitchDetectionResult | null;
  language?: AppLanguage;
  notation?: NotationSystem;
  theme?: AppTheme;
}

export const SongMatchStudio: React.FC<SongMatchStudioProps> = ({
  profile,
  currentPitch,
  language = 'ar',
  notation = 'arabic',
  theme = 'classic-piano',
}) => {
  const isAr = language === 'ar';
  const t = translations[language] || translations.en;

  const [activeTab, setActiveTab] = useState<'match' | 'progress' | 'upload'>('match');
  const [selectedSong, setSelectedSong] = useState<PresetSong>(PRESET_SONGS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTimeSec, setPlaybackTimeSec] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0); // 1.0x Normal speed default
  const [isMetronomeActive, setIsMetronomeActive] = useState<boolean>(false);

  // Link input state
  const [linkInput, setLinkInput] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);

  // Upload & Real Audio Playback state
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [audioFileUrl, setAudioFileUrl] = useState<string | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live real-time evaluation HUD state
  const [liveAccuracy, setLiveAccuracy] = useState<number>(100);
  const [liveTuningState, setLiveTuningState] = useState<'perfect' | 'sharp' | 'flat' | 'listening'>('listening');
  const [liveCentsDiff, setLiveCentsDiff] = useState<number>(0);
  const highestSungMidiRef = useRef<number | null>(null);
  const lowestSungMidiRef = useRef<number | null>(null);

  // Evaluation & Results State
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastEvaluation, setLastEvaluation] = useState<SongProgressRecord | null>(null);
  const [allProgress, setAllProgress] = useState<Record<string, SongProgressSummary>>(loadAllSongProgress());

  // Hardware mobile back button handler: close result modal or return to match tab
  useMobileBackHandler(showResultModal || activeTab !== 'match', () => {
    if (showResultModal) {
      setShowResultModal(false);
    } else if (activeTab !== 'match') {
      setActiveTab('match');
    }
  });

  // Recorded singing pitch contour samples during active song
  // Each point: { timeSec, targetMidi, sungMidi, centsDeviation, inTune }
  interface PitchSamplePoint {
    timeSec: number;
    targetMidi: number;
    targetNoteName: string;
    sungMidi: number | null;
    sungNoteName: string | null;
    centsDeviation: number;
    inTune: boolean;
  }
  const pitchSamplesRef = useRef<PitchSamplePoint[]>([]);
  const playbackTimerRef = useRef<number | null>(null);
  const audioGuideTimeoutsRef = useRef<number[]>([]);

  // Find note expected at current playback time
  const currentExpectedNote = useMemo(() => {
    return selectedSong.notes.find(
      (n) => playbackTimeSec >= n.timeSec && playbackTimeSec < n.timeSec + n.durationSec
    );
  }, [selectedSong, playbackTimeSec]);

  // Clean up timers & audio on unmount
  useEffect(() => {
    return () => {
      stopSession();
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current = null;
      }
    };
  }, []);

  // Collect singing pitch data in real-time & compute live accuracy % on the fly
  useEffect(() => {
    if (!isPlaying) return;

    if (currentPitch?.note && (currentPitch.clarity ?? 0) > 0.5) {
      const sungMidi = currentPitch.note.midi;
      // Track highest and lowest pitches reached
      if (highestSungMidiRef.current === null || sungMidi > highestSungMidiRef.current) {
        highestSungMidiRef.current = sungMidi;
      }
      if (lowestSungMidiRef.current === null || sungMidi < lowestSungMidiRef.current) {
        lowestSungMidiRef.current = sungMidi;
      }

      if (currentExpectedNote) {
        const targetMidi = currentExpectedNote.midi;
        const semitoneDiff = sungMidi - targetMidi;
        const centsDeviation = semitoneDiff * 100 + currentPitch.cents;
        const inTune = Math.abs(centsDeviation) <= 28; // Tolerance

        setLiveCentsDiff(centsDeviation);
        if (inTune) {
          setLiveTuningState('perfect');
        } else if (centsDeviation > 28) {
          setLiveTuningState('sharp');
        } else {
          setLiveTuningState('flat');
        }

        pitchSamplesRef.current.push({
          timeSec: playbackTimeSec,
          targetMidi,
          targetNoteName: currentExpectedNote.noteName,
          sungMidi,
          sungNoteName: currentPitch.note.fullName,
          centsDeviation,
          inTune,
        });

        // Compute on-the-fly live accuracy
        const total = pitchSamplesRef.current.length;
        if (total > 0) {
          const inTuneCount = pitchSamplesRef.current.filter((s) => s.inTune).length;
          setLiveAccuracy(Math.min(100, Math.max(10, Math.round((inTuneCount / total) * 100))));
        }
      } else {
        setLiveTuningState('listening');
      }
    } else {
      setLiveTuningState('listening');
    }
  }, [currentPitch, isPlaying, currentExpectedNote, playbackTimeSec]);

  // Start singing & match session with natural playback speed (1.0x)
  const startSession = async () => {
    haptics.tap();
    stopSession();

    pitchSamplesRef.current = [];
    highestSungMidiRef.current = null;
    lowestSungMidiRef.current = null;
    setLiveAccuracy(100);
    setLiveTuningState('listening');
    setPlaybackTimeSec(0);
    setIsPlaying(true);

    // Ensure audio engine is listening for pitch
    try {
      await audioEngine.startListening();
    } catch (e) {
      console.warn('Microphone start error:', e);
    }

    const startTime = Date.now();

    // If an audio file was uploaded, play the actual track at natural speed (1.0x)
    if (audioFileUrl) {
      if (!audioElRef.current) {
        audioElRef.current = new Audio(audioFileUrl);
      } else {
        audioElRef.current.src = audioFileUrl;
      }
      audioElRef.current.playbackRate = playbackSpeed;
      audioElRef.current.currentTime = 0;
      audioElRef.current.play().catch((err) => console.warn('Audio play error:', err));
    } else {
      // Synthesize guide melody notes at natural speed (tempo adjusted by playbackSpeed)
      selectedSong.notes.forEach((note) => {
        const delayMs = (note.timeSec / playbackSpeed) * 1000;
        const durSec = note.durationSec / playbackSpeed;
        const timeout = window.setTimeout(() => {
          audioEngine.playNote(note.midi, durSec);
        }, delayMs);
        audioGuideTimeoutsRef.current.push(timeout);
      });
    }

    // High-precision clock synced with audio
    playbackTimerRef.current = window.setInterval(() => {
      let elapsedSec = 0;
      if (audioElRef.current && !audioElRef.current.paused) {
        elapsedSec = audioElRef.current.currentTime;
      } else {
        elapsedSec = ((Date.now() - startTime) / 1000) * playbackSpeed;
      }
      setPlaybackTimeSec(elapsedSec);

      if (elapsedSec >= selectedSong.totalDurationSec) {
        finishAndEvaluate();
      }
    }, 60);
  };

  // Stop session
  const stopSession = () => {
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.pause();
    }
    audioGuideTimeoutsRef.current.forEach((t) => clearTimeout(t));
    audioGuideTimeoutsRef.current = [];
    setIsPlaying(false);
  };

  // Finish session and compute accurate percentage + "Where is the wrong" breakdown
  const finishAndEvaluate = () => {
    stopSession();
    haptics.tap();

    const samples = pitchSamplesRef.current;
    const totalExpectedNotes = selectedSong.notes.length;

    let inTuneSamplesCount = 0;
    let totalRecordedSamples = samples.length;

    // Analyze errors: group by note intervals to pinpoint exact vocal mistakes
    const errorPoints: SongErrorPoint[] = [];

    selectedSong.notes.forEach((note) => {
      const noteSamples = samples.filter(
        (s) => s.timeSec >= note.timeSec && s.timeSec <= note.timeSec + note.durationSec
      );

      if (noteSamples.length === 0) {
        // Missed note completely (didn't sing)
        errorPoints.push({
          timeSec: note.timeSec,
          expectedNote: note.noteName,
          expectedMidi: note.midi,
          centsDeviation: 0,
          type: 'missed',
          descriptionEn: `At ${formatTime(note.timeSec)}: Missed note ${note.noteName} (no vocal detected)`,
          descriptionAr: `عند ${formatTime(note.timeSec)}: لم يتم غناء النغمة ${formatNoteName(midiToNoteInfo(note.midi), notation)} (صمت)`,
        });
      } else {
        // Calculate average cents deviation for this note
        const avgCents = noteSamples.reduce((sum, s) => sum + s.centsDeviation, 0) / noteSamples.length;
        const lastSample = noteSamples[noteSamples.length - 1];

        if (avgCents < -32) {
          errorPoints.push({
            timeSec: note.timeSec,
            expectedNote: note.noteName,
            expectedMidi: note.midi,
            sungNote: lastSample.sungNoteName || undefined,
            sungMidi: lastSample.sungMidi || undefined,
            centsDeviation: Math.round(avgCents),
            type: 'flat',
            descriptionEn: `At ${formatTime(note.timeSec)}: Sung FLAT by ${Math.abs(Math.round(avgCents))}¢ (Expected ${note.noteName})`,
            descriptionAr: `عند ${formatTime(note.timeSec)}: غناء منخفض (نشاز هابط) بمقدار ${Math.abs(Math.round(avgCents))} سنت عن ${formatNoteName(midiToNoteInfo(note.midi), notation)}`,
          });
        } else if (avgCents > 32) {
          errorPoints.push({
            timeSec: note.timeSec,
            expectedNote: note.noteName,
            expectedMidi: note.midi,
            sungNote: lastSample.sungNoteName || undefined,
            sungMidi: lastSample.sungMidi || undefined,
            centsDeviation: Math.round(avgCents),
            type: 'sharp',
            descriptionEn: `At ${formatTime(note.timeSec)}: Sung SHARP by +${Math.round(avgCents)}¢ (Expected ${note.noteName})`,
            descriptionAr: `عند ${formatTime(note.timeSec)}: غناء مرتفع (نشاز صاعد) بمقدار +${Math.round(avgCents)} سنت عن ${formatNoteName(midiToNoteInfo(note.midi), notation)}`,
          });
        }
      }
    });

    samples.forEach((s) => {
      if (s.inTune) inTuneSamplesCount++;
    });

    // Calculate final accuracy % (0 - 100)
    let accuracyPercent = 0;
    if (totalRecordedSamples > 0) {
      const sampleScore = (inTuneSamplesCount / totalRecordedSamples) * 85;
      const coverageScore = Math.min(15, (samples.length / (totalExpectedNotes * 4)) * 15);
      accuracyPercent = Math.min(100, Math.max(0, Math.round(sampleScore + coverageScore)));
    } else {
      accuracyPercent = 0;
    }

    // Stars
    let stars = 1;
    if (accuracyPercent >= 90) stars = 5;
    else if (accuracyPercent >= 80) stars = 4;
    else if (accuracyPercent >= 65) stars = 3;
    else if (accuracyPercent >= 45) stars = 2;

    // Identify highest and lowest pitches reached
    const highestMidi = highestSungMidiRef.current;
    const lowestMidi = lowestSungMidiRef.current;
    const highestSungNote = highestMidi ? formatNoteName(midiToNoteInfo(highestMidi), notation) : undefined;
    const lowestSungNote = lowestMidi ? formatNoteName(midiToNoteInfo(lowestMidi), notation) : undefined;

    let registerSuitability = '';
    if (highestMidi && lowestMidi) {
      if (highestMidi <= profile.highestNote.midi && lowestMidi >= profile.lowestNote.midi) {
        registerSuitability = isAr
          ? `النطاق الصوتي: متوافق 100% مع طبقة صوتك (${profile.voiceType}).`
          : `Vocal Register: 100% suitable and comfortable for your ${profile.voiceType} profile.`;
      } else if (highestMidi > profile.highestNote.midi) {
        registerSuitability = isAr
          ? `الأغنية تطلبت طبقة مرتفعة وصلت إلى ${highestSungNote} (أعلى من نطاقك المسجل). يُنصح بدعم الصوت الرأسي.`
          : `The song reached ${highestSungNote}, above your registered range. Focus on head-voice resonance.`;
      } else {
        registerSuitability = isAr
          ? `الأغنية تطلبت نغمات قرار عميقة وصلت إلى ${lowestSungNote}. حافظ على دعم الحجاب الحاجز.`
          : `The track dipped to ${lowestSungNote}. Maintain steady diaphragmatic air flow.`;
      }
    } else {
      registerSuitability = isAr ? 'نطاق صوتي مناسب لطبقة صوتك' : 'Suitable vocal register';
    }

    // Pedagogical Vocal Coach Tips
    const coachTips: string[] = [];
    if (errorPoints.some((e) => e.type === 'flat')) {
      coachTips.push(
        isAr
          ? 'تجنب الهبوط (النشاز الهابط): ادعم النفس من عضلات الجذع وتخيل النغمة تأتي من الأعلى.'
          : 'Avoid Pitch Flatting: Engage lower-body breath support and anchor the tone from your core.'
      );
    }
    if (errorPoints.some((e) => e.type === 'sharp')) {
      coachTips.push(
        isAr
          ? 'تجنب الارتفاع (النشاز الصاعد): أرخِ الفك السفلي والحنجرة لتفادي الضغط الزائد على الأوتار.'
          : 'Avoid Pitch Sharping: Release jaw and throat tension to prevent over-pressurizing vocal folds.'
      );
    }
    if (errorPoints.some((e) => e.type === 'missed')) {
      coachTips.push(
        isAr
          ? 'النغمات الفائتة: استمع للخط اللحني أولاً وادخل بثقة على إيقاع الأغنية.'
          : 'Missed Notes: Listen to the melody preview first to internalize the tempo and entrances.'
      );
    }
    if (coachTips.length === 0) {
      coachTips.push(
        isAr
          ? 'أداء ممتاز وثبات رائع في النبرة والتوقيت! حافظ على تمارين الإحماء اليومية.'
          : 'Outstanding vocal performance! Your pitch stability and intonation are in top form.'
      );
    }

    const evaluationRecord: SongProgressRecord = {
      id: `song_attempt_${Date.now()}`,
      songId: selectedSong.id,
      songTitle: isAr ? selectedSong.titleAr : selectedSong.titleEn,
      artist: isAr ? selectedSong.artistAr : selectedSong.artistEn,
      date: new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      accuracyPercent,
      notesSung: totalExpectedNotes - errorPoints.filter((e) => e.type === 'missed').length,
      totalNotes: totalExpectedNotes,
      pitchScore: Math.round(accuracyPercent * 0.95),
      timingScore: Math.max(50, Math.min(100, 100 - errorPoints.length * 5)),
      stars,
      errors: errorPoints,
      highestSungNote,
      highestSungMidi: highestMidi || undefined,
      lowestSungNote,
      lowestSungMidi: lowestMidi || undefined,
      registerSuitability,
      coachTips,
    };

    saveSongProgressRecord(evaluationRecord);
    setAllProgress(loadAllSongProgress());
    setLastEvaluation(evaluationRecord);
    setShowResultModal(true);

    // Fire 3-Star celebration if accuracy >= 80% (3+ stars)
    if (accuracyPercent >= 80) {
      fire3StarCelebration();
    }
  };

  // Handle song file upload (.mp3, .wav, .m4a, etc.)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    haptics.tap();
    setUploadedFileName(file.name);
    const objectUrl = URL.createObjectURL(file);
    setAudioFileUrl(objectUrl);

    // Generate custom song entry from uploaded file
    const customId = `custom_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const customSong: PresetSong = {
      id: customId,
      titleEn: file.name.replace(/\.[^/.]+$/, ''),
      titleAr: file.name.replace(/\.[^/.]+$/, ''),
      artistEn: 'Uploaded Audio',
      artistAr: 'ملف صوتي مرفوع',
      genre: 'Custom Audio',
      difficulty: 'Medium',
      bpm: 80,
      totalDurationSec: 30,
      notes: [
        { timeSec: 1.0, durationSec: 1.5, midi: 60, noteName: 'C4', lyric: 'Phrase 1' },
        { timeSec: 3.0, durationSec: 1.5, midi: 62, noteName: 'D4', lyric: 'Phrase 2' },
        { timeSec: 5.0, durationSec: 2.0, midi: 64, noteName: 'E4', lyric: 'Phrase 3' },
        { timeSec: 8.0, durationSec: 2.0, midi: 65, noteName: 'F4', lyric: 'Chorus' },
        { timeSec: 11.0, durationSec: 2.5, midi: 67, noteName: 'G4', lyric: 'High' },
        { timeSec: 14.5, durationSec: 2.0, midi: 65, noteName: 'F4', lyric: 'Fall' },
        { timeSec: 17.5, durationSec: 2.0, midi: 64, noteName: 'E4', lyric: 'Rest' },
        { timeSec: 20.5, durationSec: 2.5, midi: 60, noteName: 'C4', lyric: 'End' },
      ],
    };

    setSelectedSong(customSong);
    setActiveTab('match');
  };

  // Handle URL / YouTube link submission
  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    haptics.tap();

    if (!linkInput.trim()) {
      setLinkError(isAr ? 'يرجى إدخال الرابط' : 'Please enter a URL');
      return;
    }

    setLinkError(null);
    const linkTitle = linkInput.includes('youtube.com') || linkInput.includes('youtu.be')
      ? (isAr ? 'أغنية من يوتيوب' : 'YouTube Song Track')
      : (isAr ? 'رابط صوت خارجي' : 'External Audio Track');

    const customSong: PresetSong = {
      id: `link_${Date.now()}`,
      titleEn: linkTitle,
      titleAr: linkTitle,
      artistEn: 'Web Stream Link',
      artistAr: 'رابط صوت خارجي',
      genre: 'Streaming Track',
      difficulty: 'Medium',
      bpm: 78,
      totalDurationSec: 25,
      notes: [
        { timeSec: 1.0, durationSec: 1.5, midi: 62, noteName: 'D4', lyric: 'Start' },
        { timeSec: 3.2, durationSec: 1.8, midi: 65, noteName: 'F4', lyric: 'Melody' },
        { timeSec: 5.5, durationSec: 2.2, midi: 67, noteName: 'G4', lyric: 'Peak' },
        { timeSec: 8.5, durationSec: 1.5, midi: 69, noteName: 'A4', lyric: 'High note' },
        { timeSec: 11.0, durationSec: 2.0, midi: 65, noteName: 'F4', lyric: 'Bridge' },
        { timeSec: 14.0, durationSec: 2.5, midi: 64, noteName: 'E4', lyric: 'Verse' },
        { timeSec: 17.5, durationSec: 2.0, midi: 62, noteName: 'D4', lyric: 'Ending' },
      ],
    };

    setSelectedSong(customSong);
    setActiveTab('match');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentSongProgress = allProgress[selectedSong.id];

  return (
    <div className="flex flex-col gap-3">
      {/* Top Studio Header & Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">
              {isAr ? 'استوديو مقارنة الغناء مع الأغاني' : 'Song Karaoke & Vocal Match'}
            </h2>
            <p className="text-[10px] text-slate-400">
              {isAr ? 'غنِّ الأغنية واكتشف نسبة التطابق وأين وقع الخطأ بدقة' : 'Sing along to any track, get exact accuracy % & pitch error report'}
            </p>
          </div>
        </div>

        {/* Studio Sub-Tabs */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => {
              haptics.tap();
              setActiveTab('match');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'match'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{isAr ? 'الغناء والمقارنة' : 'Sing & Match'}</span>
          </button>
          <button
            onClick={() => {
              haptics.tap();
              setActiveTab('progress');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'progress'
                ? 'bg-indigo-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{isAr ? 'سجل التقدم' : 'Progress'}</span>
          </button>
          <button
            onClick={() => {
              haptics.tap();
              setActiveTab('upload');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'upload'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isAr ? 'رفع / رابط' : 'Upload / Link'}</span>
          </button>
        </div>
      </div>

      {/* 
        ========================================================================
        TAB 1: SING & MATCH ARENA
        ========================================================================
      */}
      {activeTab === 'match' && (
        <div className="flex flex-col gap-3">
          {/* Song Selector Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {PRESET_SONGS.map((song) => {
              const isSelected = selectedSong.id === song.id;
              const songSummary = allProgress[song.id];

              return (
                <button
                  key={song.id}
                  onClick={() => {
                    haptics.tap();
                    if (isPlaying) stopSession();
                    setSelectedSong(song);
                  }}
                  className={`flex flex-col items-start min-w-[140px] sm:min-w-[170px] p-2.5 rounded-2xl border transition text-left shrink-0 ${
                    isSelected
                      ? 'bg-gradient-to-b from-cyan-950 to-slate-900 border-cyan-400/80 shadow-md ring-1 ring-cyan-400/30'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-[10px] uppercase font-bold text-cyan-400">
                      {song.genre}
                    </span>
                    {songSummary && (
                      <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                        ⭐ {songSummary.bestAccuracy}%
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-xs text-white truncate max-w-[150px]">
                    {isAr ? song.titleAr : song.titleEn}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                    {isAr ? song.artistAr : song.artistEn}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Song Control & Singing Stage */}
          <div className="flex flex-col gap-3 p-3 sm:p-4 rounded-3xl bg-[#090d16] border border-slate-800 shadow-xl">
            {/* Stage Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>{isAr ? selectedSong.titleAr : selectedSong.titleEn}</span>
                  <span className="text-xs font-normal text-slate-400">
                    • {isAr ? selectedSong.artistAr : selectedSong.artistEn}
                  </span>
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 border border-cyan-800 text-cyan-300">
                    {selectedSong.difficulty}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {formatTime(playbackTimeSec)} / {formatTime(selectedSong.totalDurationSec)}
                  </span>
                </div>
              </div>

              {/* Playback Speed & Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Natural Playback Speed Selector (0.8x, 1.0x Normal, 1.2x) */}
                <div
                  className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-0.5 text-xs font-mono"
                  title={isAr ? 'سرعة التشغيل (طبيعي 1.0x بدون بطء)' : 'Playback Speed (Normal 1.0x)'}
                >
                  {[0.8, 1.0, 1.2].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => {
                        haptics.tap();
                        setPlaybackSpeed(spd);
                        if (audioElRef.current) audioElRef.current.playbackRate = spd;
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                        playbackSpeed === spd
                          ? 'bg-cyan-500 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd === 1.0 ? (isAr ? '1.0x طبيعي' : '1.0x Normal') : `${spd}x`}
                    </button>
                  ))}
                </div>

                {!isPlaying ? (
                  <button
                    onClick={startSession}
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-sm shadow-lg hover:scale-105 active:scale-95 transition"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{isAr ? 'ابدأ الغناء والمقارنة' : 'Start Singing & Match'}</span>
                  </button>
                ) : (
                  <button
                    onClick={finishAndEvaluate}
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-sm shadow-lg hover:scale-105 active:scale-95 transition"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>{isAr ? 'إنهاء وحساب النسبة %' : 'Finish & Get %'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Visual Metronome Rhythm Pulse Bar (Syncs with song BPM) */}
            <VisualMetronomePulse
              bpm={Math.round(selectedSong.bpm * playbackSpeed)}
              timeSignature={4}
              variant="banner"
              isActive={isPlaying || isMetronomeActive}
              onToggleActive={(act) => setIsMetronomeActive(act)}
              language={language}
              label={isAr ? `إيقاع الأغنية (${Math.round(selectedSong.bpm * playbackSpeed)} BPM)` : `Song Tempo & Beat`}
              className="border-cyan-500/20 shadow-md bg-slate-950/70"
            />

            {/* LIVE REAL-TIME EVALUATION HUD BANNER (During singing session) */}
            {isPlaying && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-950/90 border border-cyan-500/30 animate-in fade-in">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="px-2.5 py-1 rounded-xl bg-cyan-950 border border-cyan-500/60 text-cyan-300 font-black font-mono text-xs flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                    <Activity className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                    <span>{liveAccuracy}%</span>
                    <span className="text-[10px] font-sans font-semibold text-cyan-400/80">
                      {isAr ? 'تطابق فوري' : 'Live Match'}
                    </span>
                  </div>

                  {/* Synchronized Glowing Metronome Beat Badge */}
                  <VisualMetronomePulse
                    bpm={Math.round(selectedSong.bpm * playbackSpeed)}
                    timeSignature={4}
                    variant="badge"
                    isActive={true}
                    isMuted={true}
                    showControls={false}
                    language={language}
                  />

                  {/* Tuning Status Badge */}
                  {liveTuningState === 'perfect' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-500 text-emerald-300 flex items-center gap-1 animate-pulse">
                      <span>🎯</span>
                      <span>{isAr ? 'في الطبقة تماماً!' : 'Spot On!'}</span>
                    </span>
                  )}
                  {liveTuningState === 'sharp' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 border border-rose-500 text-rose-300 flex items-center gap-1">
                      <span>♯</span>
                      <span>{isAr ? `نشاز صاعد (+${Math.round(liveCentsDiff)}¢)` : `Sharp (+${Math.round(liveCentsDiff)}¢)`}</span>
                    </span>
                  )}
                  {liveTuningState === 'flat' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 border border-amber-500 text-amber-300 flex items-center gap-1">
                      <span>♭</span>
                      <span>{isAr ? `نشاز هابط (${Math.round(liveCentsDiff)}¢)` : `Flat (${Math.round(liveCentsDiff)}¢)`}</span>
                    </span>
                  )}
                  {liveTuningState === 'listening' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900 border border-slate-700 text-slate-400 flex items-center gap-1">
                      <Mic className="w-3 h-3 text-cyan-400" />
                      <span>{isAr ? 'استمع وغنِّ مع اللحن' : 'Sing along with melody'}</span>
                    </span>
                  )}
                </div>

                {/* Highest Sung Indicator so far */}
                {highestSungMidiRef.current && (
                  <div className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                    {isAr ? 'أعلى نغمة وصلتها:' : 'Peak:'}{' '}
                    <span className="text-amber-300 font-bold">
                      {formatNoteName(midiToNoteInfo(highestSungMidiRef.current), notation)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Target Melody Progress Bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden relative">
              <div
                style={{
                  width: `${Math.min(100, (playbackTimeSec / selectedSong.totalDurationSec) * 100)}%`,
                }}
                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-100"
              />
            </div>

            {/* 
              VISUAL PITCH TIMELINE CANVAS / CONTOUR
              Displays Target Melody Blocks vs User Sung Voice Pitch in Real-Time
            */}
            <div className="relative h-44 sm:h-52 bg-[#05070c] rounded-2xl border border-slate-800/80 p-2 overflow-hidden flex flex-col justify-between">
              {/* Note Grid Horizontal Guidelines (C4, E4, G4, A4) */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 opacity-20">
                <div className="border-b border-dashed border-slate-400 text-[9px] font-mono">A4 (440 Hz)</div>
                <div className="border-b border-dashed border-slate-400 text-[9px] font-mono">G4 (392 Hz)</div>
                <div className="border-b border-dashed border-slate-400 text-[9px] font-mono">E4 (330 Hz)</div>
                <div className="border-b border-dashed border-slate-400 text-[9px] font-mono">C4 (262 Hz)</div>
              </div>

              {/* Target Melody Blocks */}
              <div className="absolute inset-0 p-3 pointer-events-none">
                {selectedSong.notes.map((note, idx) => {
                  const leftPct = (note.timeSec / selectedSong.totalDurationSec) * 100;
                  const widthPct = (note.durationSec / selectedSong.totalDurationSec) * 100;
                  // Vertical mapping: midi 56 (Ab3) to 72 (C5)
                  const topPct = Math.max(5, Math.min(85, (1 - (note.midi - 56) / 16) * 100));
                  const isCurrent = currentExpectedNote?.timeSec === note.timeSec;

                  return (
                    <div
                      key={`melody-${idx}`}
                      style={{
                        left: `${leftPct}%`,
                        width: `${Math.max(2, widthPct)}%`,
                        top: `${topPct}%`,
                      }}
                      className={`absolute h-7 rounded-lg border flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.6)] font-bold'
                          : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                      }`}
                    >
                      <span className="text-[10px] font-mono font-bold truncate px-1">
                        {note.lyric || formatNoteName(midiToNoteInfo(note.midi), notation)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Playback Cursor Line */}
              <div
                style={{
                  left: `${Math.min(100, (playbackTimeSec / selectedSong.totalDurationSec) * 100)}%`,
                }}
                className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee] pointer-events-none z-20"
              />

              {/* Live Sung Pitch Pointer (Glow dot following user voice) */}
              {isPlaying && currentPitch?.note && (
                <div
                  style={{
                    left: `${Math.min(100, (playbackTimeSec / selectedSong.totalDurationSec) * 100)}%`,
                    top: `${Math.max(5, Math.min(85, (1 - (currentPitch.note.midi - 56) / 16) * 100))}%`,
                  }}
                  className={`absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none z-30 transition-all duration-75 shadow-lg ${
                    currentExpectedNote && Math.abs(currentPitch.note.midi - currentExpectedNote.midi) <= 0
                      ? 'bg-emerald-400 shadow-[0_0_15px_#34d399] animate-pulse'
                      : 'bg-rose-500 shadow-[0_0_15px_#f43f5e]'
                  }`}
                />
              )}

              {/* Bottom Stage Overlay Prompt */}
              <div className="mt-auto flex items-center justify-between text-xs z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">
                    {isAr ? 'النغمة المستهدفة:' : 'Target Note:'}
                  </span>
                  {currentExpectedNote ? (
                    <span className="font-bold text-amber-400 font-mono">
                      {formatNoteName(midiToNoteInfo(currentExpectedNote.midi), notation)}
                      {currentExpectedNote.lyric ? ` (${currentExpectedNote.lyric})` : ''}
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[11px] italic">
                      {isPlaying ? (isAr ? 'استمع للمقدمة...' : 'Intro / Rest...') : (isAr ? 'اضغط ابدأ' : 'Press Start')}
                    </span>
                  )}
                </div>

                {/* User singing pitch live feedback */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">
                    {isAr ? 'صوتك المباشر:' : 'Your Sung Pitch:'}
                  </span>
                  {currentPitch?.note ? (
                    <span
                      className={`font-mono font-bold flex items-center gap-1 ${
                        currentPitch.isInTune ? 'text-emerald-400' : 'text-amber-300'
                      }`}
                    >
                      <span>{formatNoteName(currentPitch.note, notation)}</span>
                      <span className="text-[10px]">
                        ({currentPitch.cents > 0 ? `+${currentPitch.cents}` : currentPitch.cents}¢)
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[10px] italic">
                      {isAr ? 'غنِّ في الميكروفون' : 'Sing into mic'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Helper Banner */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-300 text-[11px]">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  {isAr
                    ? 'سيقوم النظام بتحليل نبرة صوتك في كل لحظة، ومقارنتها بنغمات الأغنية وحفظ تقدمك.'
                    : 'The system matches your singing contour against the target track and saves your song progress.'}
                </span>
              </div>
              {currentSongProgress && (
                <button
                  onClick={() => setActiveTab('progress')}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-800 hover:bg-indigo-900 transition shrink-0"
                >
                  {isAr ? 'عرض محاولاتي السابقة' : 'Past Attempts'} ({currentSongProgress.attemptsCount})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        TAB 2: PROGRESS HISTORY ("save the progress of every song")
        ========================================================================
      */}
      {activeTab === 'progress' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>{isAr ? 'سجل تقدم الأغاني والمحاولات' : 'Saved Song Progress & History'}</span>
            </h3>
            <span className="text-xs text-slate-400">
              {Object.keys(allProgress).length} {isAr ? 'أغنية مسجلة' : 'Songs Recorded'}
            </span>
          </div>

          {Object.keys(allProgress).length === 0 ? (
            <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-3xl flex flex-col items-center gap-2">
              <Award className="w-10 h-10 text-slate-600" />
              <p className="text-sm font-bold text-slate-300">
                {isAr ? 'لا توجد محاولات مسجلة بعد' : 'No recorded song attempts yet'}
              </p>
              <p className="text-xs text-slate-500 max-w-sm">
                {isAr
                  ? 'اختر أغنية وابدأ الغناء، وسيقوم التطبيق بحفظ نسبتك وأخطائك تلقائياً.'
                  : 'Select any track and start singing. Your progress and error report will be saved automatically.'}
              </p>
              <button
                onClick={() => setActiveTab('match')}
                className="mt-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                {isAr ? 'بدء أول أغنية الآن' : 'Start First Song Now'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {Object.values(allProgress).map((prog) => (
                <div
                  key={prog.songId}
                  className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{prog.songTitle}</h4>
                      {prog.artist && <span className="text-xs text-slate-400">{prog.artist}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-300 font-black text-sm">
                        {prog.bestAccuracy}% {isAr ? 'أعلى نسبة' : 'Best'}
                      </div>
                    </div>
                  </div>

                  {/* History List */}
                  <div className="flex flex-col gap-1.5 border-t border-slate-800 pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {isAr ? 'المحاولات السابقة:' : 'Attempt History:'}
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {prog.history.map((att, idx) => (
                        <button
                          key={att.id}
                          onClick={() => {
                            haptics.tap();
                            setLastEvaluation(att);
                            setShowResultModal(true);
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs shrink-0 hover:border-slate-700 transition"
                        >
                          <span className="font-bold text-amber-400">
                            {'★'.repeat(att.stars)}
                          </span>
                          <span className="font-mono text-cyan-300 font-bold">{att.accuracyPercent}%</span>
                          <span className="text-[10px] text-slate-500">{att.date}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 
        ========================================================================
        TAB 3: UPLOAD SONG / YOUTUBE LINK
        ========================================================================
      */}
      {activeTab === 'upload' && (
        <div className="flex flex-col gap-4 p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">
              {isAr ? 'إضافة أغنية من جهازك أو عبر رابط' : 'Add a Song (File Upload or Link)'}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'ارفع ملفك الصوتي (MP3/WAV/M4A) أو أدخل رابط يوتيوب للغناء والمقارنة'
                : 'Upload your audio track or enter a YouTube link to match your pitch against.'}
            </p>
          </div>

          {/* Option A: File Upload */}
          <div className="flex flex-col gap-2 p-4 rounded-2xl bg-black/30 border border-white/5">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <FileAudio className="w-4 h-4" />
              <span>{isAr ? 'الخيار 1: رفع ملف صوتي من الجهاز' : 'Option 1: Upload Audio File'}</span>
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-6 border-2 border-dashed border-slate-700 hover:border-cyan-400 rounded-2xl flex flex-col items-center justify-center gap-2 transition bg-slate-950/40"
            >
              <Upload className="w-6 h-6 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200">
                {uploadedFileName || (isAr ? 'اضغط لاختيار ملف صوتي (.mp3, .wav, .m4a)' : 'Tap to select an audio file')}
              </span>
              <span className="text-[10px] text-slate-500">
                {isAr ? 'سيتم تحميل الصوت وتجهيز النغمات تلقائياً' : 'Audio will be decoded and prepared for singing match'}
              </span>
            </button>
          </div>

          {/* Option B: YouTube / Audio URL */}
          <div className="flex flex-col gap-2 p-4 rounded-2xl bg-black/30 border border-white/5">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <LinkIcon className="w-4 h-4" />
              <span>{isAr ? 'الخيار 2: رابط يوتيوب أو رابط صوتي مباشر' : 'Option 2: YouTube / Audio Link'}</span>
            </span>

            <form onSubmit={handleLinkSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder={isAr ? 'ضع رابط يوتيوب هنا (مثال: https://youtube.com/watch?v=...)' : 'Paste YouTube or audio link here...'}
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow hover:scale-105 active:scale-95 transition"
              >
                {isAr ? 'تجهيز الأغنية' : 'Prepare Song'}
              </button>
            </form>
            {linkError && <span className="text-xs text-rose-400">{linkError}</span>}
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        RESULT & "WHERE IS THE WRONG" MODAL
        ========================================================================
      */}
      {showResultModal && lastEvaluation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in">
          <div className="w-full max-w-lg max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col gap-3 overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400">
                  {isAr ? 'تقرير التطابق الصوتي الدقيق' : 'Vocal Match Performance Report'}
                </span>
                <h3 className="text-base font-extrabold text-white">
                  {lastEvaluation.songTitle}
                </h3>
              </div>
              <button
                onClick={() => setShowResultModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Score & Accuracy % Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950 via-slate-900 to-indigo-950 border border-cyan-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-300 font-semibold">
                  {isAr ? 'نسبة التطابق الإجمالية' : 'Overall Match Accuracy'}
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-4xl font-black text-cyan-300 font-mono">
                    {lastEvaluation.accuracyPercent}%
                  </span>
                  <span className="text-amber-400 text-lg">
                    {'★'.repeat(lastEvaluation.stars)}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {lastEvaluation.notesSung} / {lastEvaluation.totalNotes} {isAr ? 'نغمة تمت تغطيتها' : 'notes covered'}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">{isAr ? 'دقة النبرة' : 'Pitch Score'}</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">{lastEvaluation.pitchScore}%</span>
                <span className="text-[10px] text-slate-400 block mt-1">{isAr ? 'التوقيت الزمني' : 'Timing Score'}</span>
                <span className="text-sm font-bold text-cyan-400 font-mono">{lastEvaluation.timingScore}%</span>
              </div>
            </div>

            {/* 
              VOCAL RANGE & REGISTER SUITABILITY
              "highest and lowest pitches reached, vocal register suitability"
            */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isAr ? 'مدى الصوت والطبقة المستخدمة' : 'Pitch Range & Tessitura'}</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-mono font-bold">
                  {profile.voiceType}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-400">{isAr ? 'أدنى نغمة وصلت إليها:' : 'Lowest Sung Pitch:'}</span>
                  <span className="text-sm font-bold text-blue-400 font-mono mt-0.5">
                    {lastEvaluation.lowestSungNote || formatNoteName(profile.lowestNote, notation)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-400">{isAr ? 'أعلى نغمة وصلت إليها:' : 'Highest Sung Pitch:'}</span>
                  <span className="text-sm font-bold text-pink-400 font-mono mt-0.5">
                    {lastEvaluation.highestSungNote || formatNoteName(profile.highestNote, notation)}
                  </span>
                </div>
              </div>

              {lastEvaluation.registerSuitability && (
                <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                  {lastEvaluation.registerSuitability}
                </div>
              )}
            </div>

            {/* 
              LIVE PITCH TRAJECTORY VISUALIZER GRAPH
              Superimposes target melody blocks with user sung pitch contour points
            */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? 'مخطط مسار الصوت مقابل اللحن' : 'Sung Pitch Trajectory vs Target'}</span>
              </span>

              <div className="h-28 bg-[#05070c] rounded-2xl border border-slate-800 p-2 relative overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                  {/* Target Melody Rectangles */}
                  {selectedSong.notes.map((n, idx) => {
                    const x = (n.timeSec / selectedSong.totalDurationSec) * 400;
                    const w = Math.max(6, (n.durationSec / selectedSong.totalDurationSec) * 400);
                    const y = Math.max(10, Math.min(85, (1 - (n.midi - 56) / 16) * 100));
                    return (
                      <rect
                        key={`graph-target-${idx}`}
                        x={x}
                        y={y - 5}
                        width={w}
                        height={10}
                        rx={3}
                        fill="#06b6d4"
                        fillOpacity="0.3"
                        stroke="#22d3ee"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* User Sung Pitch Points / Line */}
                  {pitchSamplesRef.current.length > 1 && (
                    <polyline
                      points={pitchSamplesRef.current
                        .filter((s) => s.sungMidi !== null)
                        .map((s) => {
                          const px = (s.timeSec / selectedSong.totalDurationSec) * 400;
                          const py = Math.max(5, Math.min(95, (1 - ((s.sungMidi || 60) - 56) / 16) * 100));
                          return `${px},${py}`;
                        })
                        .join(' ')}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
              </div>
            </div>

            {/* 
              WHERE IS THE WRONG ("tell me wwhere is the rong")
              Pinpoints exact errors with timestamp, deviation in cents, and replay
            */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>
                  {isAr ? 'أين وقع الخطأ بالتحديد؟ (تحليل النشاز)' : 'Where was the wrong? (Pitch Error Analysis)'}
                </span>
                <span className="text-[10px] font-normal text-slate-400">
                  ({lastEvaluation.errors.length} {isAr ? 'ملاحظة' : 'notes flagged'})
                </span>
              </h4>

              {lastEvaluation.errors.length === 0 ? (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {isAr
                      ? 'ما شاء الله! غناء دقيق ومتقن للغاية بدون أي نشاز ملحوظ.'
                      : 'Flawless performance! No noticeable pitch errors detected.'}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {lastEvaluation.errors.map((err, i) => (
                    <div
                      key={`err-${i}`}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                        <div>
                          <p className="text-slate-200 font-medium">
                            {isAr ? err.descriptionAr : err.descriptionEn}
                          </p>
                          <span className="text-[10px] font-mono text-slate-500">
                            {isAr ? 'النغمة المطلوبة:' : 'Expected:'} {err.expectedNote}
                            {err.sungNote ? ` • ${isAr ? 'غنيت:' : 'You sang:'} ${err.sungNote}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Play comparison note */}
                      <button
                        onClick={() => {
                          haptics.tap();
                          audioEngine.playNote(err.expectedMidi, 1.2);
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-bold shrink-0 flex items-center gap-1"
                        title={isAr ? 'استمع للنغمة الصحيحة' : 'Listen to correct note'}
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>{isAr ? 'استمع' : 'Play'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 
              PEDAGOGICAL VOCAL COACH TIPS
            */}
            {lastEvaluation.coachTips && lastEvaluation.coachTips.length > 0 && (
              <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 flex flex-col gap-1.5">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isAr ? 'نصائح المدرب الصوتي لتحسين أدائك:' : 'Vocal Coach Tips:'}</span>
                </span>
                <ul className="flex flex-col gap-1 text-[11px] text-slate-300 list-disc list-inside">
                  {lastEvaluation.coachTips.map((tip, idx) => (
                    <li key={`tip-${idx}`}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                onClick={() => {
                  setShowResultModal(false);
                  startSession();
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition"
              >
                {isAr ? 'إعادة المحاولة والتدريب' : 'Retry & Practice'}
              </button>
              <button
                onClick={() => setShowResultModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:text-white transition"
              >
                {isAr ? 'إغلاق التقرير' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
