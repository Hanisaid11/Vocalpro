/**
 * VocalMaster Pro - Human Vocal Timbres Library
 * مكتبة الأصوات والنغمات البشرية الطبيعية
 */
import { VocalSampleVowel, AppLanguage } from '../types/vocal';

export interface VocalTimbreInfo {
  id: VocalSampleVowel;
  nameAr: string;
  nameEn: string;
  symbolAr: string;
  symbolEn: string;
  titleAr: string;
  titleEn: string;
  techniqueAr: string;
  techniqueEn: string;
  category: 'singing' | 'resonance' | 'warmup' | 'sovt' | 'mix';
  icon: string;
  badgeAr: string;
  badgeEn: string;
  samplePitchMidi: number; // e.g. 60 (C4) or 65 (F4)
}

export const VOCAL_TIMBRE_LIBRARY: VocalTimbreInfo[] = [
  {
    id: 'aah',
    nameAr: 'اااه (Aaaah)',
    nameEn: 'Aaaah (Open Bel Canto)',
    symbolAr: 'اااه',
    symbolEn: 'Aah',
    titleAr: 'غناء حر بل كانتو مفتوح',
    titleEn: 'Open Bel Canto Full Resonance',
    techniqueAr: 'رنين الحلق المفتوح والارتكاز الحجابي، أساس التمارين الصوتية والغناء الأوبرالي والشرقي المتزن.',
    techniqueEn: 'Open pharyngeal ring with lowered larynx, ideal for vocal warmups and free classical singing.',
    category: 'singing',
    icon: '🗣️',
    badgeAr: 'غناء مفتوح',
    badgeEn: 'Open Singing',
    samplePitchMidi: 60,
  },
  {
    id: 'ooh',
    nameAr: 'اوووو (Ooooh)',
    nameEn: 'Ooooh (Warm Rounded)',
    symbolAr: 'اوووو',
    symbolEn: 'Ooh',
    titleAr: 'رنين شفوي دائري دافئ',
    titleEn: 'Warm Rounded Low-Larynx',
    techniqueAr: 'استرخاء الحبال الصوتية مع استدارة الشفاه، يضفي دفئاً وعمقاً مخملياً للمنطقة المتوسطة والجهير.',
    techniqueEn: 'Elongated acoustic vocal tract with rounded lips for deep, warm, velvety resonance.',
    category: 'warmup',
    icon: '🎙️',
    badgeAr: 'رنين دافئ',
    badgeEn: 'Warm Voice',
    samplePitchMidi: 57,
  },
  {
    id: 'eee',
    nameAr: 'اييي (Eeee)',
    nameEn: 'Eeee (Bright Forward)',
    symbolAr: 'اييي',
    symbolEn: 'Eee',
    titleAr: 'رنين بلعومي أمامي ناصع',
    titleEn: 'Bright Forward Pharyngeal',
    techniqueAr: 'رفع مؤخرة اللسان وتوجيه الصوت نحو قناع الوجه الأمامي لإصابة النغمات العالية بنقاء ودقة ثاقبة.',
    techniqueEn: 'High-tongue forward placement projecting acoustic energy into the facial mask for bright high notes.',
    category: 'resonance',
    icon: '✨',
    badgeAr: 'رنين أمامي',
    badgeEn: 'Forward Ring',
    samplePitchMidi: 64,
  },
  {
    id: 'mmm',
    nameAr: 'اممممم (Mmmmm)',
    nameEn: 'Mmmmm (Nasal Humming)',
    symbolAr: 'اممممم',
    symbolEn: 'Mmm',
    titleAr: 'دندنة وهمهمة أنفية مرخية',
    titleEn: 'Nasal Mask Gentle Humming',
    techniqueAr: 'همهمة خفيفة بشفاه مغلقة لتنشيط الرنين الأنفي وإزالة الإجهاد والتشنج الصوتي بأمان تام.',
    techniqueEn: 'Gentle closed-mouth humming to activate facial mask resonance and relieve vocal fold tension.',
    category: 'sovt',
    icon: '🎵',
    badgeAr: 'دندنة وهمهمة',
    badgeEn: 'Gentle Hum',
    samplePitchMidi: 55,
  },
  {
    id: 'brrr',
    nameAr: 'برررر (Brrrrr)',
    nameEn: 'Brrrrr (Lip Trill / SOVT)',
    symbolAr: 'برررر',
    symbolEn: 'Brrr',
    titleAr: 'ترعيد الشفاه والاهتزاز الهيدروديناميكي',
    titleEn: 'Lip Trill / Flutter SOVT',
    techniqueAr: 'تمرين ترعيد الشفتين المتذبذب (26 هرتز)، يحقق التوازن المثالي لضغط الهواء وسلاسة التنقل بين الطبقات.',
    techniqueEn: 'Semi-occluded vocal tract (SOVT) fluttering at ~26Hz for dynamic breath balance and register blending.',
    category: 'sovt',
    icon: '🌊',
    badgeAr: 'ترعيد الشفاه',
    badgeEn: 'Lip Trill',
    samplePitchMidi: 62,
  },
  {
    id: 'laa',
    nameAr: 'لاااا (Laaa)',
    nameEn: 'Laaa (Articulated)',
    symbolAr: 'لاااا',
    symbolEn: 'Laa',
    titleAr: 'نطق لساني طلق ورنين واضح',
    titleEn: 'Lingual Articulation & Flow',
    techniqueAr: 'ضربة طرف اللسان الخفيفة على سقف الحلق تليها فتحة صوتية رنانة، ممتاز لمرونة مخارج الحروف.',
    techniqueEn: 'Alveolar tongue-tip tap flowing into an open resonant vowel for articulation clarity.',
    category: 'singing',
    icon: '🎶',
    badgeAr: 'نطق لساني',
    badgeEn: 'Diction Flow',
    samplePitchMidi: 60,
  },
  {
    id: 'nay',
    nameAr: 'ناي (Nay / Twang)',
    nameEn: 'Nay (Pharyngeal Twang)',
    symbolAr: 'ناي',
    symbolEn: 'Nay',
    titleAr: 'تيونغ بلعومي ورنين شرقي مركز',
    titleEn: 'Pharyngeal Twang Mix',
    techniqueAr: 'تضييق القمع الحنجري لإطلاق الرنين المشترك (الميكس فويس) وقوة الصوت الإسقاطية دون إجهاد الحبال.',
    techniqueEn: 'Epilaryngeal narrowing to bridge chest and head voice with effortless brassy carrying power.',
    category: 'mix',
    icon: '🎺',
    badgeAr: 'تيونغ شرقي',
    badgeEn: 'Vocal Twang',
    samplePitchMidi: 65,
  },
];

export function getVocalTimbre(vowel: VocalSampleVowel): VocalTimbreInfo {
  if (vowel === 'lip-trill') {
    return VOCAL_TIMBRE_LIBRARY.find((v) => v.id === 'brrr') || VOCAL_TIMBRE_LIBRARY[0];
  }
  return VOCAL_TIMBRE_LIBRARY.find((v) => v.id === vowel) || VOCAL_TIMBRE_LIBRARY[0];
}

export function getVocalDisplayName(vowel: VocalSampleVowel, lang: AppLanguage): string {
  const item = getVocalTimbre(vowel);
  return lang === 'ar' ? item.symbolAr : item.symbolEn;
}
