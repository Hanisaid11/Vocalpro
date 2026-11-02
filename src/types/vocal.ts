/**
 * VocalMaster Pro - Comprehensive Musical & Acoustic Type Definitions
 */

export type VoiceClassification = 
  | 'Bass'
  | 'Baritone'
  | 'Tenor'
  | 'Countertenor'
  | 'Contralto'
  | 'Mezzo-Soprano'
  | 'Soprano'
  | 'Custom';

export type NotationSystem = 'english' | 'solfege' | 'arabic';
export type InstrumentType = 'piano' | 'guitar' | 'oud' | 'vocal' | 'strings';
export type VocalSampleVowel = 'aah' | 'ooh' | 'eee' | 'mmm' | 'brrr' | 'lip-trill' | 'laa' | 'nay';
export type NoteDurationBeat = 1 | 2 | 4;
export type AppLanguage = 'en' | 'ar';
export type AppTheme =
  | 'classic-piano'
  | 'dark-studio'
  | 'oriental-oud'
  | 'midnight-stage'
  | 'sunlight-gold'
  | 'vibrant-sunset'
  | 'emerald-mint'
  | 'rose-blush';

// Acoustic Reverb Spatial Presets
export type ReverbSpacePreset = 'dry' | 'studio' | 'hall' | 'cathedral';

// Eastern Maqamat Microtonal Modes
export type EasternMaqam = 'standard_12tet' | 'rast' | 'bayati' | 'sikah' | 'saba' | 'hijaz' | 'nahawand' | 'kurd';

export interface NoteInfo {
  name: string;        // e.g. "C", "F#"
  octave: number;      // e.g. 4
  fullName: string;    // e.g. "C4"
  midi: number;        // e.g. 60
  frequency: number;   // e.g. 261.63
  solfege: string;     // e.g. "Do4"
  arabic: string;      // e.g. "دو4"
  isQuarterTone?: boolean;
}

export interface VibratoAnalysis {
  rateHz: number;      // e.g. 5.5 Hz
  extentCents: number; // e.g. +/- 32 cents
  isHealthy: boolean;  // 5.0 - 6.2 Hz
}

export interface PitchDetectionResult {
  frequency: number | null;
  note: NoteInfo | null;
  cents: number;        // -50 to +50 cents deviation
  clarity: number;      // 0 to 1 confidence
  rms: number;          // volume / root-mean-square energy
  spectralCentroid: number; // timbre brightness in Hz
  isInTune: boolean;    // within acceptable cents threshold
  stability: number;    // pitch stability score 0-1
  vibrato?: VibratoAnalysis | null;
}

export interface PassaggioInfo {
  primoMidi: number;
  primoNote: string;
  secondoMidi: number;
  secondoNote: string;
  descriptionEn: string;
  descriptionAr: string;
}

export interface VocalRangeProfile {
  id: string;
  voiceType: VoiceClassification;
  lowestNote: NoteInfo;
  highestNote: NoteInfo;
  middleRegisterNote: NoteInfo;
  passaggio?: PassaggioInfo;
  totalSemitones: number;
  octavesSpan: number;
  measuredDate: string;
  notes: string;
}

export interface ExerciseStep {
  note: NoteInfo;
  durationMs: number;
  vowel?: string;
}

export interface WarmupExercise {
  id: string;
  title: string;
  titleAr?: string;
  category: 'lip_trill' | 'scale' | 'arpeggio' | 'siren' | 'intervals' | 'staccato';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  descriptionAr?: string;
  instructions: string[];
  instructionsAr?: string[];
  vowelSuggestion: string;
  vowelSuggestionAr?: string;
  defaultBpm: number;
  basePatternSemitones: number[];
  repetitionsCount: number;
}

export interface PracticeSessionRecord {
  id: string;
  timestamp: number;
  exerciseId?: string;
  exerciseTitle: string;
  durationSeconds: number;
  notesAttempted: number;
  notesHitInTune: number;
  accuracyPercentage: number;
  averageCentsError: number;
  dateString: string;
}

export interface PitchGameRecord {
  id: string;
  gameType: 'pitch_hero' | 'match_note' | 'interval_challenge' | 'ear_trainer' | 'siren_glide' | 'vocal_agility' | 'pitch_recognition' | 'ear_progression' | 'solfeggio_scale' | 'hear_guess_mimic';
  score: number;
  highestStreak: number;
  accuracyPercentage: number;
  totalNotes: number;
  notesHit: number;
  date: string;
  timestamp: number;
}

export interface UserStats {
  totalPracticeTimeMinutes: number;
  streakDays: number;
  lastPracticeDate: string;
  totalSessionsCompleted: number;
  overallAccuracyPct: number;
  highScorePitchHero: number;
  highScoreMatchNote: number;
  highScoreInterval: number;
  highScorePitchRecognition?: number;
  highScoreEarProgression?: number;
  earProgressionTierUnlocked?: number;
  earProgressionStars?: Record<number, number>;
  earProgressionXP?: number;
  sessions: PracticeSessionRecord[];
  gameRecords: PitchGameRecord[];
}

export interface DriveSyncStatus {
  isSignedIn: boolean;
  userEmail: string | null;
  lastSyncedTimestamp: number | null;
  isSyncing: boolean;
  driveFileId?: string | null;
  error?: string | null;
}

export type CurriculumTier = 'beginner' | 'intermediate' | 'advanced' | 'virtuoso';
export type ExerciseExecutionMode = 'piano' | 'vocal';

export interface LevelNoteStep {
  midi: number;
  noteName: string;
  durationMs?: number;
  solfege?: string;
  arabic?: string;
  hint?: string;
}

export interface TrainingLevelConfig {
  id: number;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  tier: CurriculumTier;
  notes: LevelNoteStep[];
  requiredAccuracy: number;
  tempoBpm: number;
  keyCenter: string;
  targetRegister: string;
  descriptionEn: string;
  descriptionAr: string;
}

export interface LevelProgressRecord {
  levelId: number;
  unlocked: boolean;
  completed: boolean;
  bestAccuracy: number;
  stars: number;
  bestMode?: ExerciseExecutionMode;
  lastPlayedDate?: string;
  attemptsCount: number;
}
