import React, { useState } from 'react';
import { Play, Sparkles } from 'lucide-react';
import {
  WarmupExercise,
  VocalRangeProfile,
  PitchDetectionResult,
  PracticeSessionRecord,
  AppLanguage,
  NotationSystem,
} from '../../types/vocal';
import { formatNoteName, formatVoiceTypeName } from '../../utils/noteUtils';
import { translations } from '../../utils/i18n';
import { ExercisePlayer } from './ExercisePlayer';
import { DetailedGuideModal } from '../Common/DetailedGuideModal';
import { InfoGuideButton } from '../Common/InfoGuideButton';

interface WarmupRoutinesProps {
  profile: VocalRangeProfile;
  currentPitch: PitchDetectionResult | null;
  language?: AppLanguage;
  notation?: NotationSystem;
  onSessionComplete: (session: PracticeSessionRecord) => void;
}

export const PRESET_WARMUPS: WarmupExercise[] = [
  {
    id: 'lip-trill-basic',
    title: 'Gentle Lip Trills (3-Tone)',
    titleAr: 'رفرفة الشفاه اللطيفة (3 نغمات)',
    category: 'lip_trill',
    difficulty: 'Beginner',
    description: 'Relieves vocal fold pressure and gently warms up airflow balance through bubbling.',
    descriptionAr: 'تخفيف الضغط على الأحبال الصوتية وتدفئة التوازن الهوائي بسلاسة من خلال فقاعات الصوت.',
    instructions: [
      'Gently vibrate lips together like an engine hum or motorboat sound.',
      'Maintain steady abdominal breath support without pushing pitch.',
      'Allow pitch to float effortlessly up and down.',
    ],
    instructionsAr: [
      'اهتز بالشفتين معاً بلطف كصوت محرك سيارة صغير هادئ دون شد.',
      'حافظ على دعم النفس البطني المستقر دون ضغط على الحلق.',
      'دع النغمات تصعد وتهبط بمرونة وانسيابية في الممر الصوتي.',
    ],
    vowelSuggestion: 'Brrr / Lip Trill',
    vowelSuggestionAr: 'برررر / اهتزاز الشفاه',
    defaultBpm: 80,
    basePatternSemitones: [0, 2, 4, 2, 0],
    repetitionsCount: 12,
  },
  {
    id: '5-tone-scale',
    title: '5-Tone Vocalise (Ma-Me-Mi)',
    titleAr: 'فوكاليز الـ 5 نغمات (ما-مي-مي)',
    category: 'scale',
    difficulty: 'Beginner',
    description: 'Classic Italian bel canto scale to promote forward pharyngeal resonance and smooth vowels.',
    descriptionAr: 'سلم بل كانتو الإيطالي الكلاسيكي لتعزيز الرنين البلعومي الأمامي ونقاء حروف العلة.',
    instructions: [
      'Sing clearly on "Ma-Me-Mi-Mo-Mu" or "Nay-Nay-Nay".',
      'Keep your jaw relaxed and let tongue position articulate vowels cleanly.',
      'Avoid sudden volume spikes on upper notes.',
    ],
    instructionsAr: [
      'غنِّ بوضوح على مقاطع "ما - مي - مو" أو "ناي - ناي - ناي".',
      'أرخِ الفك السفلي ودع اللسان يتحرك بمرونة بين حروف المد.',
      'تجنب الاندفاع المفاجئ في الصوت عند النغمات العليا.',
    ],
    vowelSuggestion: 'Ma - Me - Mi - Mo - Mu',
    vowelSuggestionAr: 'ما - مي - مي - مو - مو',
    defaultBpm: 92,
    basePatternSemitones: [0, 2, 4, 5, 7, 5, 4, 2, 0],
    repetitionsCount: 14,
  },
  {
    id: 'arpeggio-triad',
    title: 'Major Arpeggio (1-3-5-8)',
    titleAr: 'أربيجيو ماجور متصاعد (1-3-5-8)',
    category: 'arpeggio',
    difficulty: 'Intermediate',
    description: 'Builds vocal cord agility, octave expansion, and bridges chest to mix/head voice.',
    descriptionAr: 'بناء مرونة الأوتار الصوتية وتوسيع الأوكتاف والربط السلس بين صوت الصدر وصوت الرأس والمكس.',
    instructions: [
      'Engage breath support right before the octave leap.',
      'Keep vowels tall and narrow on the top note.',
      'Feel the tone ring behind your upper teeth and soft palate.',
    ],
    instructionsAr: [
      'هيئ دعم التنفس قبل قفزة الأوكتاف مباشرة.',
      'اجعل حروف المد رأسية ومفتوحة عند القمة دون شد حنجري.',
      'اشعر بالرنين خلف الأسنان العلوية وسقف الحلق الرخو.',
    ],
    vowelSuggestion: 'Gee / Ah',
    vowelSuggestionAr: 'جي / آآآه',
    defaultBpm: 96,
    basePatternSemitones: [0, 4, 7, 12, 7, 4, 0],
    repetitionsCount: 16,
  },
  {
    id: 'octave-interval',
    title: 'Octave Leap & Pitch Accuracy',
    titleAr: 'قفزة الأوكتاف ودقة النغمة',
    category: 'intervals',
    difficulty: 'Intermediate',
    description: 'Sharpens inner pitch hearing and vocal stability across wide intervals.',
    descriptionAr: 'شحذ السمع الباطني للنغمات وثبات الحبال الصوتية عبر المسافات الواسعة.',
    instructions: [
      'Sing root, then cleanly leap full octave without sliding.',
      'Check cents indicator for exact center of pitch.',
    ],
    instructionsAr: [
      'غنِّ النغمة الأساسية، ثم اقفز مباشرة للأوكتاف دون انزلاق متردد.',
      'راقب مؤشر السنت للوصول لمركز النغمة بدقة.',
    ],
    vowelSuggestion: 'Oh - Ee',
    vowelSuggestionAr: 'أووو - إيـيـه',
    defaultBpm: 84,
    basePatternSemitones: [0, 12, 0, 12, 0],
    repetitionsCount: 10,
  },
  {
    id: 'staccato-agility',
    title: 'Staccato Diaphragm Bounce',
    titleAr: 'قفزات ستاكاتو بالحجاب الحاجز',
    category: 'staccato',
    difficulty: 'Advanced',
    description: 'Quick diaphragmatic pulses for vocal onset clarity and fast register coordination.',
    descriptionAr: 'نبضات سريعة من الحجاب الحاجز لدقة انطلاق الصوت والتنسيق السريع بين الطبقات.',
    instructions: [
      'Short, crisp, separated notes without clearing throat.',
      'Activate lower abdominal muscles for each bounce.',
    ],
    instructionsAr: [
      'نغمات قصيرة، واضحة ومفصولة دون تنظيف الحلق أو الشد.',
      'نشّط عضلات أسفل البطن مع كل نبضة صوتية.',
    ],
    vowelSuggestion: 'Ha - Ha - Ha',
    vowelSuggestionAr: 'ها - ها - ها',
    defaultBpm: 104,
    basePatternSemitones: [0, 4, 7, 4, 0],
    repetitionsCount: 12,
  },
];

export const WarmupRoutines: React.FC<WarmupRoutinesProps> = ({
  profile,
  currentPitch,
  language = 'ar',
  notation = 'arabic',
  onSessionComplete,
}) => {
  const [selectedExercise, setSelectedExercise] = useState<WarmupExercise | null>(null);
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);
  const t = translations[language] || translations.en;
  const isAr = language === 'ar';

  if (selectedExercise) {
    return (
      <ExercisePlayer
        exercise={selectedExercise}
        profile={profile}
        currentPitch={currentPitch}
        language={language}
        notation={notation}
        onFinishSession={(session) => {
          onSessionComplete(session);
          setSelectedExercise(null);
        }}
        onClose={() => setSelectedExercise(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in select-none">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-800/40 p-4 sm:p-5 rounded-3xl shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/40 shadow-lg shadow-indigo-950/60">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">{t.warmupTitle}</h2>
              <p className="text-xs text-slate-300 mt-0.5" dir={isAr ? 'rtl' : 'ltr'}>
                {t.warmupDesc} •{' '}
                <span className="font-bold text-cyan-300">
                  {formatVoiceTypeName(profile.voiceType, language)}
                </span>{' '}
                <span className="font-mono text-slate-400" dir="ltr">
                  ({formatNoteName(profile.lowestNote, notation)} – {formatNoteName(profile.highestNote, notation)})
                </span>
              </p>
            </div>
          </div>

          <InfoGuideButton
            onClick={() => setActiveGuideId('section_warmup')}
            title={isAr ? 'معلومات تمارين الإحماء الصوتي والهدف العلمي' : 'Vocal Warmups Scientific Guide'}
            size="md"
          />
        </div>
      </div>

      {/* Routine Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {PRESET_WARMUPS.map((exercise) => {
          const difficultyColor =
            exercise.difficulty === 'Beginner'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : exercise.difficulty === 'Intermediate'
              ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
              : 'bg-purple-500/15 text-purple-300 border-purple-500/30';

          const difficultyLabel = isAr
            ? exercise.difficulty === 'Beginner'
              ? 'مبتدئ'
              : exercise.difficulty === 'Intermediate'
              ? 'متوسط'
              : 'متقدم'
            : exercise.difficulty;

          const exerciseTitle = isAr && exercise.titleAr ? exercise.titleAr : exercise.title;
          const exerciseDesc = isAr && exercise.descriptionAr ? exercise.descriptionAr : exercise.description;
          const exerciseVowel = isAr && exercise.vowelSuggestionAr ? exercise.vowelSuggestionAr : exercise.vowelSuggestion;

          const guideMapping =
            exercise.id === 'lip-trill-basic'
              ? 'vocal_brrr'
              : exercise.id === '5-tone-scale'
              ? 'vocal_aah'
              : exercise.id === 'arpeggio-triad'
              ? 'vocal_aah'
              : exercise.id === 'octave-interval'
              ? 'vocal_solfege'
              : 'vocal_aah';

          return (
            <div
              key={exercise.id}
              className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/50 p-4 sm:p-5 rounded-3xl shadow-lg transition flex flex-col justify-between gap-3.5 group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-indigo-300 transition">
                      {exerciseTitle}
                    </h3>
                    <InfoGuideButton
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveGuideId(guideMapping);
                      }}
                      size="sm"
                      title={isAr ? `شرح تفصيلي لتمرين ${exerciseTitle} والهدف منه` : `Detailed Guide for ${exerciseTitle}`}
                    />
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${difficultyColor}`}>
                    {difficultyLabel}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed text-start" dir={isAr ? 'rtl' : 'ltr'}>
                  {exerciseDesc}
                </p>

                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400 font-mono">
                  <span className="bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 text-cyan-300 font-bold">
                    &quot;{exerciseVowel}&quot;
                  </span>
                  <span className="text-slate-400 font-sans">
                    {exercise.defaultBpm} {isAr ? 'ن/د' : 'BPM'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <div className="text-[11px] text-slate-400 font-mono" dir="ltr">
                  {formatNoteName(profile.middleRegisterNote, notation)} ↗ {formatNoteName(profile.highestNote, notation)} ↘ {formatNoteName(profile.lowestNote, notation)}
                </div>
                <button
                  onClick={() => setSelectedExercise(exercise)}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-indigo-950/60 transition active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isAr ? 'ابدأ التمرين' : 'Practice'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

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
