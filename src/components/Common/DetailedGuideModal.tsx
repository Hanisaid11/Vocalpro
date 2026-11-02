import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  ArrowRight,
  Flame,
  Info,
  BookOpen,
} from 'lucide-react';
import { DETAILED_GUIDES, DetailedGuideItem } from '../../data/detailedGuidesData';
import { AppLanguage } from '../../types/vocal';
import { haptics } from '../../utils/haptics';

interface DetailedGuideModalProps {
  guideId: string | null;
  isOpen: boolean;
  onClose: () => void;
  language?: AppLanguage;
}

export const DetailedGuideModal: React.FC<DetailedGuideModalProps> = ({
  guideId,
  isOpen,
  onClose,
  language = 'ar',
}) => {
  const isAr = language === 'ar';
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);

  // Close speech if modal closes or changes
  useEffect(() => {
    if (!isOpen && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingSpeech(false);
    }
  }, [isOpen, guideId]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        haptics.tap();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !guideId) return null;

  const guide: DetailedGuideItem | undefined = DETAILED_GUIDES[guideId];
  if (!guide) return null;

  // Read guide text via speech synthesis
  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isPlayingSpeech) {
      window.speechSynthesis.cancel();
      setIsPlayingSpeech(false);
      return;
    }

    window.speechSynthesis.cancel();

    const titleText = isAr ? guide.titleAr : guide.titleEn;
    const goalText = isAr ? guide.physiologicalGoalAr : guide.physiologicalGoalEn;
    const mechanismText = isAr ? guide.anatomicalMechanismAr : guide.anatomicalMechanismEn;
    const textToRead = `${titleText}. ${goalText}. ${mechanismText}`;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = isAr ? 'ar-SA' : 'en-US';
    utterance.rate = 0.95;

    utterance.onend = () => setIsPlayingSpeech(false);
    utterance.onerror = () => setIsPlayingSpeech(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingSpeech(true);
  };

  const title = isAr ? guide.titleAr : guide.titleEn;
  const subtitle = isAr ? guide.subtitleAr : guide.subtitleEn;
  const category = isAr ? guide.categoryAr : guide.categoryEn;
  const goal = isAr ? guide.physiologicalGoalAr : guide.physiologicalGoalEn;
  const mechanism = isAr ? guide.anatomicalMechanismAr : guide.anatomicalMechanismEn;
  const steps = isAr ? guide.stepsAr : guide.stepsEn;
  const mistakes = isAr ? guide.commonMistakesAr : guide.commonMistakesEn;
  const benefits = isAr ? guide.expectedBenefitsAr : guide.expectedBenefitsEn;
  const targets = isAr ? guide.targetMusclesAndCavitiesAr : guide.targetMusclesAndCavitiesEn;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => {
        haptics.tap();
        onClose();
      }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin rounded-3xl bg-[#090d16] border border-cyan-500/30 shadow-2xl text-slate-100 p-5 sm:p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Card */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-2xl shadow-lg shadow-cyan-950/40 shrink-0">
              {guide.icon}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold mb-1">
                <span>{category}</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white leading-snug">
                {title}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Read Out Aloud Speech Button */}
            {typeof window !== 'undefined' && 'speechSynthesis' in window && (
              <button
                onClick={handleToggleSpeech}
                className={`p-2 rounded-xl border transition ${
                  isPlayingSpeech
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/40 animate-pulse'
                    : 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border-slate-800'
                }`}
                title={isPlayingSpeech ? (isAr ? 'إيقاف القراءة الصوتية' : 'Stop Audio Reading') : (isAr ? 'استمع للشرح بالصوت' : 'Listen via Voice')}
              >
                {isPlayingSpeech ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={() => {
                haptics.tap();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
              title={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Section 1: The Physiological & Acoustic Goal */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-slate-900 border border-cyan-500/30">
          <div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>{isAr ? 'الهدف الفسيولوجي والصوتي الدقيق' : 'Physiological & Acoustic Goal'}</span>
          </div>
          <p className="text-xs sm:text-sm text-cyan-100/90 leading-relaxed font-medium">
            {goal}
          </p>
        </div>

        {/* Section 2: Anatomical Mechanism (How it works in your body) */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 mb-2 text-indigo-400 font-bold text-xs">
            <Layers className="w-4 h-4" />
            <span>{isAr ? 'كيف يعمل في الحنجرة والجسم (الميكانيزم العلمي)' : 'Anatomical & Vocal Mechanism'}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {mechanism}
          </p>
        </div>

        {/* Section 3: Target Muscles & Resonance Cavities */}
        {targets.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-400 mb-2">
              {isAr ? 'التجاويف والعضلات المستهدفة:' : 'Target Cavities & Muscles:'}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {targets.map((tgt, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700/80 text-[11px] font-semibold text-slate-200"
                >
                  ⚡ {tgt}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Step-by-Step Instructions */}
        {steps.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2 mb-2.5 text-emerald-400 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>{isAr ? 'خطوات التنفيذ الصحيحة خطوة بخطوة' : 'Step-by-Step Execution Guide'}</span>
            </div>
            <ol className="space-y-2 text-xs text-slate-300">
              {steps.map((st, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{st}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Section 5: Common Mistakes to Avoid */}
        {mistakes.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>{isAr ? 'أخطاء شائعة وتحذيرات لتجنب الإجهاد' : 'Common Mistakes & Pitfalls to Avoid'}</span>
            </div>
            <ul className="space-y-1.5 text-xs text-amber-200/80">
              {mistakes.map((mk, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-400 shrink-0 font-bold">⚠️</span>
                  <span className="leading-relaxed">{mk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Section 6: Expected Benefits */}
        {benefits.length > 0 && (
          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30">
            <div className="flex items-center gap-2 mb-2 text-purple-300 font-bold text-xs">
              <Award className="w-4 h-4" />
              <span>{isAr ? 'الفوائد الملموسة والنتائج المتوقعة' : 'Expected Benefits & Outcomes'}</span>
            </div>
            <ul className="space-y-1.5 text-xs text-purple-200/90">
              {benefits.map((bn, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-purple-400 shrink-0">✨</span>
                  <span className="leading-relaxed">{bn}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Bottom Action Footer */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
          <button
            onClick={() => {
              haptics.tap();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-cyan-950/50 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{isAr ? 'فهمت الهدف، ابدأ التمرين الآن' : 'Understood, Let\'s Practice'}</span>
            <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
