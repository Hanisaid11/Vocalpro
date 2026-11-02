import { NoteInfo, VoiceClassification, VocalRangeProfile, NotationSystem, PassaggioInfo, EasternMaqam } from '../types/vocal';

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const SOLFEGE_NAMES = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
export const ARABIC_NOTE_NAMES = ['دو', 'دو♯', 'ري', 'ري♯', 'مي', 'فا', 'فا♯', 'صول', 'صول♯', 'لا', 'لا♯', 'سي'];

export const A4_FREQUENCY = 440;
export const A4_MIDI = 69;

/**
 * Classical & Contemporary Vocal Passaggio transition points
 * Primo Passaggio (Chest to Middle/Mix transition)
 * Secondo Passaggio (Middle/Mix to Head transition)
 */
export const VOICE_PASSAGGIO_MAP: Record<VoiceClassification, PassaggioInfo> = {
  Bass: {
    primoMidi: 55, // G3
    primoNote: 'G3',
    secondoMidi: 60, // C4
    secondoNote: 'C4',
    descriptionEn: 'Transition into mixed voice at G3; head voice begins at Middle C (C4).',
    descriptionAr: 'منطقة التحول الأول عند صول3، ويبدأ صوت الرأس عند دو4 الوسطى.',
  },
  Baritone: {
    primoMidi: 58, // Bb3
    primoNote: 'Bb3',
    secondoMidi: 63, // Eb4
    secondoNote: 'Eb4',
    descriptionEn: 'First passaggio at Bb3; upper passaggio transition at Eb4.',
    descriptionAr: 'منطقة التحول الأولى عند سي بيمول3، والتحول الثاني عند مي بيمول4.',
  },
  Tenor: {
    primoMidi: 62, // D4
    primoNote: 'D4',
    secondoMidi: 67, // G4
    secondoNote: 'G4',
    descriptionEn: 'First passaggio at D4; acoustic turning into ringing head mix at G4.',
    descriptionAr: 'منطقة التحول الأول عند ري4، والانتقال للجوابات الرنانة عند صول4.',
  },
  Countertenor: {
    primoMidi: 64, // E4
    primoNote: 'E4',
    secondoMidi: 69, // A4
    secondoNote: 'A4',
    descriptionEn: 'Reinforced falsetto / head register begins around E4.',
    descriptionAr: 'الانتقال للصوت الرأسي المطور والفلستو عند مي4.',
  },
  Contralto: {
    primoMidi: 63, // Eb4
    primoNote: 'Eb4',
    secondoMidi: 69, // A4
    secondoNote: 'A4',
    descriptionEn: 'Warm chest timbre transitions at Eb4; head voice at A4.',
    descriptionAr: 'التحول من قرار الصدر الدافئ عند مي بيمول4 لصوت الرأس عند لا4.',
  },
  'Mezzo-Soprano': {
    primoMidi: 64, // E4
    primoNote: 'E4',
    secondoMidi: 70, // Bb4
    secondoNote: 'Bb4',
    descriptionEn: 'Crosses primo passaggio at E4; upper mix transition at Bb4.',
    descriptionAr: 'منطقة التحول الأولى عند مي4، وتحول الطبقة العليا عند سي بيمول4.',
  },
  Soprano: {
    primoMidi: 66, // F#4
    primoNote: 'F#4',
    secondoMidi: 74, // D5
    secondoNote: 'D5',
    descriptionEn: 'First lift at F#4; brilliant upper head resonance opening at D5.',
    descriptionAr: 'منطقة التحول الأولى عند فا دييز4، وانفتاح الرنين الرأسي الشامخ عند ري5.',
  },
  Custom: {
    primoMidi: 60,
    primoNote: 'C4',
    secondoMidi: 67,
    secondoNote: 'G4',
    descriptionEn: 'Estimated personal registration zone.',
    descriptionAr: 'منطقة التحول التقريبية المخصصة.',
  },
};

export const STANDARD_VOICE_RANGES: Record<
  VoiceClassification,
  { minMidi: number; maxMidi: number; label: string; description: string; typicalRange: string }
> = {
  Bass: {
    minMidi: 40, // E2 (~82.4 Hz)
    maxMidi: 64, // E4 (~329.6 Hz)
    label: 'Bass',
    description: 'Deep, resonant low male voice with rich lower harmonics.',
    typicalRange: 'E2 – E4',
  },
  Baritone: {
    minMidi: 45, // A2 (~110.0 Hz)
    maxMidi: 69, // A4 (~440.0 Hz)
    label: 'Baritone',
    description: 'The most common male voice type; warm timbre spanning low to bright mid-highs.',
    typicalRange: 'A2 – A4',
  },
  Tenor: {
    minMidi: 48, // C3 (~130.8 Hz)
    maxMidi: 72, // C5 (~523.3 Hz)
    label: 'Tenor',
    description: 'High male voice capable of ringing head tones and powerful chest-mix register.',
    typicalRange: 'C3 – C5',
  },
  Countertenor: {
    minMidi: 52, // E3 (~164.8 Hz)
    maxMidi: 76, // E5 (~659.3 Hz)
    label: 'Countertenor',
    description: 'Rare male voice singing predominantly in falsetto or reinforced head register.',
    typicalRange: 'E3 – E5',
  },
  Contralto: {
    minMidi: 53, // F3 (~174.6 Hz)
    maxMidi: 77, // F5 (~698.5 Hz)
    label: 'Contralto',
    description: 'Deepest female voice type with exceptional velvet warmth in lower chest tones.',
    typicalRange: 'F3 – F5',
  },
  'Mezzo-Soprano': {
    minMidi: 57, // A3 (~220.0 Hz)
    maxMidi: 81, // A5 (~880.0 Hz)
    label: 'Mezzo-Soprano',
    description: 'Versatile female voice with rich middle register and crystalline upper extension.',
    typicalRange: 'A3 – A5',
  },
  Soprano: {
    minMidi: 60, // C4 (~261.6 Hz)
    maxMidi: 84, // C6 (~1046.5 Hz)
    label: 'Soprano',
    description: 'Highest standard female voice, shining in bright upper register and agility.',
    typicalRange: 'C4 – C6',
  },
  Custom: {
    minMidi: 45,
    maxMidi: 69,
    label: 'Custom Range',
    description: 'User-calibrated personal vocal boundaries.',
    typicalRange: 'Personalized',
  },
};

export const FAMOUS_SINGERS: Array<{
  name: string;
  voiceType: VoiceClassification;
  range: string;
  minMidi: number;
  maxMidi: number;
  funFact: string;
}> = [
  { name: 'Freddie Mercury', voiceType: 'Tenor', range: 'F2 – E5', minMidi: 41, maxMidi: 76, funFact: 'Known for phenomenal vibrato speed (7.0 Hz) and harmonic control.' },
  { name: 'Adele', voiceType: 'Mezzo-Soprano', range: 'C3 – B5', minMidi: 48, maxMidi: 83, funFact: 'Uniquely resonant chest-mix with distinct smoky lower frequencies.' },
  { name: 'Whitney Houston', voiceType: 'Soprano', range: 'A2 – C#6', minMidi: 45, maxMidi: 85, funFact: 'Legendary dynamic agility and belt control up to high G5/C6.' },
  { name: 'Luciano Pavarotti', voiceType: 'Tenor', range: 'C3 – C5', minMidi: 48, maxMidi: 72, funFact: 'Renowned for ringing King of the High C vocal tract resonance.' },
  { name: 'Barry White', voiceType: 'Bass', range: 'F#1 – Eb4', minMidi: 30, maxMidi: 63, funFact: 'Famous for ultralow sub-harmonic rumble and lush chest resonance.' },
  { name: 'Fairouz', voiceType: 'Mezzo-Soprano', range: 'A3 – G5', minMidi: 57, maxMidi: 79, funFact: 'Unmatched crystalline pitch accuracy across classical Arabic modal scales.' },
  { name: 'Frank Sinatra', voiceType: 'Baritone', range: 'G2 – G4', minMidi: 43, maxMidi: 67, funFact: 'Master of phrasing, steady breath-management, and legato warmth.' },
  { name: 'Umm Kulthum', voiceType: 'Contralto', range: 'F3 – B5', minMidi: 53, maxMidi: 83, funFact: 'Legendary acoustic power, stamina, and subtle microtonal inflection.' },
];

export function frequencyToMidiExact(freq: number, a4Ref: number = A4_FREQUENCY): number {
  return 69 + 12 * Math.log2(freq / a4Ref);
}

export function midiToFrequency(midi: number, a4Ref: number = A4_FREQUENCY): number {
  return a4Ref * Math.pow(2, (midi - A4_MIDI) / 12);
}

export function midiToNoteInfo(midi: number): NoteInfo {
  const roundedMidi = Math.round(midi);
  const noteIndex = ((roundedMidi % 12) + 12) % 12;
  const name = NOTE_NAMES[noteIndex];
  const octave = Math.floor(roundedMidi / 12) - 1;
  const frequency = midiToFrequency(roundedMidi);
  const solfege = `${SOLFEGE_NAMES[noteIndex]}${octave}`;
  const arabic = `${ARABIC_NOTE_NAMES[noteIndex]}${octave}`;

  return {
    name,
    octave,
    fullName: `${name}${octave}`,
    midi: roundedMidi,
    frequency: Math.round(frequency * 100) / 100,
    solfege,
    arabic,
  };
}

export function formatNoteName(note: NoteInfo | null, notation: NotationSystem = 'english'): string {
  if (!note) return '—';
  if (notation === 'solfege') return note.solfege || note.fullName;
  if (notation === 'arabic') return note.arabic || note.fullName;
  return note.fullName;
}

export function frequencyToNote(
  freq: number | null,
  a4Ref: number = A4_FREQUENCY
): {
  note: NoteInfo | null;
  cents: number;
  exactMidi: number;
} {
  if (!freq || freq < 30 || freq > 4000) {
    return { note: null, cents: 0, exactMidi: 0 };
  }

  const exactMidi = frequencyToMidiExact(freq, a4Ref);
  const roundedMidi = Math.round(exactMidi);
  const cents = Math.round((exactMidi - roundedMidi) * 100);
  const note = midiToNoteInfo(roundedMidi);

  return { note, cents, exactMidi };
}

export function generateNotesRange(minMidi: number, maxMidi: number): NoteInfo[] {
  const notes: NoteInfo[] = [];
  for (let midi = minMidi; midi <= maxMidi; midi++) {
    notes.push(midiToNoteInfo(midi));
  }
  return notes;
}

export function classifyVocalRange(minMidi: number, maxMidi: number): {
  voiceType: VoiceClassification;
  octavesSpan: number;
  totalSemitones: number;
  description: string;
  closestSinger: typeof FAMOUS_SINGERS[0];
} {
  const totalSemitones = Math.max(0, maxMidi - minMidi);
  const octavesSpan = Math.round((totalSemitones / 12) * 10) / 10;
  const midpoint = (minMidi + maxMidi) / 2;

  let bestType: VoiceClassification = 'Custom';
  let bestDistance = Infinity;

  const candidates: VoiceClassification[] = [
    'Bass',
    'Baritone',
    'Tenor',
    'Countertenor',
    'Contralto',
    'Mezzo-Soprano',
    'Soprano',
  ];

  for (const type of candidates) {
    const std = STANDARD_VOICE_RANGES[type];
    const stdMid = (std.minMidi + std.maxMidi) / 2;
    const distance = Math.abs(midpoint - stdMid) + Math.abs(minMidi - std.minMidi) * 0.4 + Math.abs(maxMidi - std.maxMidi) * 0.4;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestType = type;
    }
  }

  let closestSinger = FAMOUS_SINGERS[0];
  let singerDistance = Infinity;
  for (const singer of FAMOUS_SINGERS) {
    const d = Math.abs(minMidi - singer.minMidi) + Math.abs(maxMidi - singer.maxMidi);
    if (d < singerDistance) {
      singerDistance = d;
      closestSinger = singer;
    }
  }

  const description = STANDARD_VOICE_RANGES[bestType]?.description || 'Custom calibrated range';

  return {
    voiceType: bestType,
    octavesSpan,
    totalSemitones,
    description,
    closestSinger,
  };
}

export function getDefaultVocalProfile(): VocalRangeProfile {
  const lowest = midiToNoteInfo(45); // A2
  const highest = midiToNoteInfo(69); // A4
  const middle = midiToNoteInfo(57); // A3

  return {
    id: 'default-profile',
    voiceType: 'Baritone',
    lowestNote: lowest,
    highestNote: highest,
    middleRegisterNote: middle,
    passaggio: VOICE_PASSAGGIO_MAP.Baritone,
    totalSemitones: 24,
    octavesSpan: 2.0,
    measuredDate: new Date().toISOString(),
    notes: 'Default initial calibration profile',
  };
}

export function formatVoiceTypeName(voiceType: VoiceClassification, language: string = 'ar'): string {
  if (language !== 'ar') return voiceType;
  const map: Record<VoiceClassification, string> = {
    Bass: 'باص (قرار رجالي عميق)',
    Baritone: 'باريتون (صوت رجالي متوسط)',
    Tenor: 'تينور (جواب رجالي حاد)',
    Countertenor: 'كاونترتينور (طبقة رجالية حادة)',
    Contralto: 'كونترالتو (قرار نسائي دافئ)',
    'Mezzo-Soprano': 'ميزو سوبرانو (صوت نسائي متوسط)',
    Soprano: 'سوبرانو (جواب نسائي حاد)',
    Custom: 'مخصص',
  };
  return map[voiceType] || voiceType;
}

/**
 * Microtonal Quarter-Tone offsets per degree in specific Eastern Maqams
 * Values in cents deviation from 12-TET
 */
export const MAQAM_DEFINITIONS: Record<
  EasternMaqam,
  { nameEn: string; nameAr: string; rootNote: string; quarterToneDegrees: number[]; centsOffsets: Record<number, number> }
> = {
  standard_12tet: {
    nameEn: 'Western 12-TET (Standard)',
    nameAr: 'نظام التون المتساوي الغربي',
    rootNote: 'C',
    quarterToneDegrees: [],
    centsOffsets: {},
  },
  rast: {
    nameEn: 'Maqam Rast (E𝄳, B𝄳)',
    nameAr: 'مقام الراست (مي نصف بيمول، سي نصف بيمول)',
    rootNote: 'C',
    quarterToneDegrees: [4, 11], // E (4), B (11)
    centsOffsets: { 4: -50, 11: -50 }, // -50 cents
  },
  bayati: {
    nameEn: 'Maqam Bayati (E𝄳 on D)',
    nameAr: 'مقام البياتي (مي سيكاه نصف بيمول على الري)',
    rootNote: 'D',
    quarterToneDegrees: [4], // E (4)
    centsOffsets: { 4: -50 },
  },
  sikah: {
    nameEn: 'Maqam Sikah (E𝄳, B𝄳, F#)',
    nameAr: 'مقام السيكاه (مي سيكاه، سي سيكاه، فا دييز)',
    rootNote: 'E𝄳',
    quarterToneDegrees: [4, 11],
    centsOffsets: { 4: -50, 11: -50 },
  },
  saba: {
    nameEn: 'Maqam Saba (E𝄳, Gb)',
    nameAr: 'مقام الصبا (مي سيكاه نصف بيمول، صول بيمول)',
    rootNote: 'D',
    quarterToneDegrees: [4],
    centsOffsets: { 4: -50 },
  },
  hijaz: {
    nameEn: 'Maqam Hijaz (F# on D)',
    nameAr: 'مقام الحجاز (فا دييز على الري)',
    rootNote: 'D',
    quarterToneDegrees: [],
    centsOffsets: {},
  },
  nahawand: {
    nameEn: 'Maqam Nahawand (Minor)',
    nameAr: 'مقام النهاوند (السلم الصغير العربي)',
    rootNote: 'C',
    quarterToneDegrees: [],
    centsOffsets: {},
  },
  kurd: {
    nameEn: 'Maqam Kurd (Phrygian)',
    nameAr: 'مقام الكورد (السلم الفريجي العربي)',
    rootNote: 'D',
    quarterToneDegrees: [],
    centsOffsets: {},
  },
};
