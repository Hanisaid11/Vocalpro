import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Search,
  HelpCircle,
  Send,
  Star,
  RefreshCw,
  Clock,
  Zap,
  Layers,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Brain,
  MessageSquare,
  Compass,
  FileText,
} from 'lucide-react';
import {
  THEORY_LESSONS,
  THEORY_LEVEL_UNITS,
  MUSICAL_TERMS_GLOSSARY,
  TheoryLesson,
  TheoryKeyTerm,
} from '../../data/musicTheoryLessons';
import { InteractiveTheoryDiagram } from './InteractiveTheoryDiagram';
import { AppLanguage, NotationSystem } from '../../types/vocal';
import { audioEngine } from '../../audio/audioEngine';
import { haptics } from '../../utils/haptics';
import { fire3StarCelebration } from '../../utils/confetti';
import { translations } from '../../utils/i18n';

interface MusicTheoryAcademyProps {
  language?: AppLanguage;
  notation?: NotationSystem;
  onOpenPiano?: () => void;
  onClose?: () => void;
}

export interface QuizProgressRecord {
  completed: boolean;
  score: number;
  stars: number;
  timestamp: number;
}

export const MusicTheoryAcademy: React.FC<MusicTheoryAcademyProps> = ({
  language = 'ar',
  notation = 'arabic',
  onOpenPiano,
  onClose,
}) => {
  const isAr = language === 'ar';
  const t = translations[language] || translations.en;

  // Navigation State
  const [activeView, setActiveView] = useState<'curriculum' | 'lesson' | 'quiz' | 'glossary'>('curriculum');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('lesson-1');

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGlossaryCategory, setSelectedGlossaryCategory] = useState<string>('all');

  // Quizzes progress persisted in localStorage
  const [quizzesProgress, setQuizzesProgress] = useState<Record<string, QuizProgressRecord>>(() => {
    try {
      const saved = localStorage.getItem('vocalmaster_theory_progress');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Active Lesson
  const activeLesson = useMemo(() => {
    return THEORY_LESSONS.find((l) => l.id === selectedLessonId) || THEORY_LESSONS[0];
  }, [selectedLessonId]);

  // Save quiz progress to storage
  const saveQuizProgress = (lessonId: string, stars: number, score: number) => {
    const updated = {
      ...quizzesProgress,
      [lessonId]: {
        completed: score >= 60,
        score,
        stars,
        timestamp: Date.now(),
      },
    };
    setQuizzesProgress(updated);
    try {
      localStorage.setItem('vocalmaster_theory_progress', JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  };

  // -------------------------------------------------------------------------
  // AI Text-to-Speech Audio Reader (قراءة الذكاء الاصطناعي للدرس بالصوت)
  // -------------------------------------------------------------------------
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Stop speaking on unmount or view change
  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  useEffect(() => {
    return () => stopSpeech();
  }, [selectedLessonId, activeView]);

  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert(isAr ? 'عذراً، محرك النطق الصوتي غير مدعوم في متصفحك.' : 'Speech synthesis not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
      return;
    }

    // Build the complete read-aloud script for the lesson
    const textToRead = isAr
      ? `${activeLesson.titleAr}. ${activeLesson.shortDescAr}. ${activeLesson.sections
          .map((s) => `${s.headingAr}. ${s.paragraphsAr.join(' ')}`)
          .join(' ')}. ${activeLesson.summaryAr.join('. ')}`
      : `${activeLesson.titleEn}. ${activeLesson.shortDescEn}. ${activeLesson.sections
          .map((s) => `${s.headingEn}. ${s.paragraphsEn.join(' ')}`)
          .join(' ')}. ${activeLesson.summaryEn.join('. ')}`;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = speechRate;
    utterance.lang = isAr ? 'ar-SA' : 'en-US';

    // Prioritize natural voices if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => (isAr ? v.lang.startsWith('ar') : v.lang.startsWith('en')) && (v.name.includes('Natural') || v.name.includes('Google'))
    ) || voices.find((v) => (isAr ? v.lang.startsWith('ar') : v.lang.startsWith('en')));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    haptics.tap();
  };

  // -------------------------------------------------------------------------
  // AI Interactive Vocal Tutor (سؤال المعلم الذكي وتوضيح الدرس)
  // -------------------------------------------------------------------------
  const [aiQuestion, setAiQuestion] = useState<string>('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  const handleAskAI = async (customPrompt?: string, qType: string = 'custom') => {
    const qText = customPrompt || aiQuestion;
    if (!qText.trim() && qType === 'custom') return;

    haptics.tap();
    setIsAiLoading(true);
    setAiAnswer(null);

    try {
      const res = await fetch('/api/coach/explain-theory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonTitle: isAr ? activeLesson.titleAr : activeLesson.titleEn,
          topic: activeLesson.id,
          question: qText,
          questionType: qType,
          language,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setAiAnswer(data.reply);
      } else {
        setAiAnswer(
          isAr
            ? 'المدرج الموسيقي هو خريطة الإحساس بالنغمات. النغمات السفلى عميقة كالقرار، والعليا رقيقة كالجواب. استمر في التمرين!'
            : 'The musical staff maps pitch cleanly: lower lines represent deep bass, upper lines represent singing treble!'
        );
      }
    } catch {
      setAiAnswer(
        isAr
          ? 'المدرج الموسيقي يشبه 5 درجات سلم تصعد عليها بالأصوات. تذكر دائماً ترتيب النغمات الأساسية: دو، ري، مي، فا، صول، لا، سي.'
          : 'Think of the staff as 5 ascending ladder rungs. Remember the natural diatonic sequence: C-D-E-F-G-A-B.'
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Quiz Engine State & Handlers
  // -------------------------------------------------------------------------
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);

  const startQuiz = (lesson: TheoryLesson) => {
    stopSpeech();
    haptics.tap();
    setSelectedLessonId(lesson.id);
    setCurrentQuestionIdx(0);
    setSelectedOptionIdx(null);
    setIsAnswerSubmitted(false);
    setQuizScore(0);
    setIsQuizCompleted(false);
    setActiveView('quiz');
  };

  const handleSelectQuizOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    haptics.tap();
    setSelectedOptionIdx(idx);
  };

  const handleSubmitQuizAnswer = () => {
    if (selectedOptionIdx === null || isAnswerSubmitted) return;

    setIsAnswerSubmitted(true);
    const currQ = activeLesson.quiz[currentQuestionIdx];
    const isCorrect = selectedOptionIdx === currQ.correctIndex;

    if (isCorrect) {
      haptics.pitchMatch();
      setQuizScore((prev) => prev + 1);
    } else {
      haptics.streakLost();
    }
  };

  const handleNextQuizQuestion = () => {
    haptics.tap();
    const nextIdx = currentQuestionIdx + 1;
    if (nextIdx < activeLesson.quiz.length) {
      setCurrentQuestionIdx(nextIdx);
      setSelectedOptionIdx(null);
      setIsAnswerSubmitted(false);
    } else {
      // Finished all questions!
      const finalScorePct = Math.round((quizScore / activeLesson.quiz.length) * 100);
      let stars = 1;
      if (finalScorePct >= 90) stars = 3;
      else if (finalScorePct >= 65) stars = 2;

      saveQuizProgress(activeLesson.id, stars, finalScorePct);
      setIsQuizCompleted(true);

      if (stars === 3) {
        fire3StarCelebration();
        haptics.streakWon();
      }
    }
  };

  // Total Progress Stats
  const totalCompletedLessons = useMemo(() => {
    return Object.values(quizzesProgress).filter((p) => p.completed).length;
  }, [quizzesProgress]);

  const totalStarsEarned = useMemo(() => {
    return Object.values(quizzesProgress).reduce((acc, curr) => acc + (curr.stars || 0), 0);
  }, [quizzesProgress]);

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full select-none pb-20 animate-in fade-in">
      {/* 
        ========================================================================
        TOP NAVIGATION & HERO BAR
        ========================================================================
      */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-cyan-950 border border-indigo-500/40 p-4 sm:p-5 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-indigo-950/60 shrink-0">
            <BookOpen className="w-6 h-6 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">
                {isAr ? 'أكاديمية قراءة النوتة والنظريات الموسيقية' : 'Music Theory & Sheet Music Academy'}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                {isAr ? 'من الصفر' : 'From Zero'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isAr
                ? 'دروس نظرية تفاعلية مدعومة بالقراءة الصوتية بالذكاء الاصطناعي واختبارات لكل درس'
                : 'Interactive theory lessons with AI voice narration, diagrams & quizzes'}
            </p>
          </div>
        </div>

        {/* View Switcher Tabs (الدروس | المعجم) */}
        <div className="flex items-center gap-1.5 bg-slate-950/90 p-1 rounded-2xl border border-slate-800 self-stretch sm:self-auto justify-between sm:justify-start">
          <button
            onClick={() => {
              stopSpeech();
              haptics.tap();
              setActiveView('curriculum');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeView === 'curriculum'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isAr ? 'المنهج والدروس' : 'Curriculum'}</span>
          </button>

          <button
            onClick={() => {
              stopSpeech();
              haptics.tap();
              setActiveView('glossary');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeView === 'glossary'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{isAr ? 'معجم المصطلحات' : 'Glossary'}</span>
          </button>

          {onOpenPiano && (
            <button
              onClick={onOpenPiano}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              {isAr ? 'البيانو' : 'Piano'}
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">{isAr ? 'الدروس المنجزة:' : 'Completed:'}</span>
          <span className="font-mono text-xs font-bold text-cyan-400">
            {totalCompletedLessons} / {THEORY_LESSONS.length}
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">{isAr ? 'النجوم المكتسبة:' : 'Stars Earned:'}</span>
          <span className="font-mono text-xs font-bold text-amber-400 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{totalStarsEarned}</span>
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">{isAr ? 'المستوى الحالي:' : 'Current Unit:'}</span>
          <span className="font-bold text-xs text-indigo-300">
            {activeLesson.levelBadgeAr}
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">{isAr ? 'قارئ الذكاء الاصطناعي:' : 'AI Voice Reader:'}</span>
          <span className="font-bold text-xs text-emerald-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            <span>{isAr ? 'جاهز' : 'Ready'}</span>
          </span>
        </div>
      </div>

      {/* 
        ========================================================================
        VIEW 1: CURRICULUM OVERVIEW (قائمة الوحدات والدروس)
        ========================================================================
      */}
      {activeView === 'curriculum' && (
        <div className="flex flex-col gap-4">
          {THEORY_LEVEL_UNITS.map((unit) => {
            const unitLessons = THEORY_LESSONS.filter((l) => unit.lessonIds.includes(l.id));

            return (
              <div
                key={unit.levelNumber}
                className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800/90 shadow-xl flex flex-col gap-3"
              >
                {/* Unit Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{unit.icon}</span>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white">
                        {isAr ? unit.titleAr : unit.titleEn}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isAr ? unit.subtitleAr : unit.subtitleEn}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lesson Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {unitLessons.map((lesson) => {
                    const record = quizzesProgress[lesson.id];
                    const isCompleted = record?.completed;

                    return (
                      <div
                        key={lesson.id}
                        className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between gap-3 group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {isAr ? lesson.levelBadgeAr : lesson.levelBadgeEn}
                            </span>
                            <div className="flex items-center gap-1">
                              {isCompleted && (
                                <span className="flex items-center gap-0.5 text-amber-400 font-mono text-[10px] font-bold">
                                  <Star className="w-3 h-3 fill-current" />
                                  <span>{record.stars}★</span>
                                </span>
                              )}
                              <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{lesson.durationMinutes}m</span>
                              </span>
                            </div>
                          </div>

                          <h4 className="font-extrabold text-sm text-white group-hover:text-cyan-300 transition">
                            {isAr ? lesson.titleAr : lesson.titleEn}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {isAr ? lesson.shortDescAr : lesson.shortDescEn}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                          <button
                            onClick={() => {
                              stopSpeech();
                              haptics.tap();
                              setSelectedLessonId(lesson.id);
                              setActiveView('lesson');
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{isAr ? 'قراءة الدرس' : 'Read Lesson'}</span>
                          </button>

                          <button
                            onClick={() => startQuiz(lesson)}
                            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-cyan-800/40 transition flex items-center gap-1"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>{isAr ? 'الاختبار' : 'Quiz'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 
        ========================================================================
        VIEW 2: LESSON READER (قارئ الدرس + القارئ الصوتي + المعلم الذكي)
        ========================================================================
      */}
      {activeView === 'lesson' && (
        <div className="flex flex-col gap-4">
          {/* Lesson Header Navigation */}
          <div className="flex items-center justify-between bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => {
                stopSpeech();
                haptics.tap();
                setActiveView('curriculum');
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition"
            >
              {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span>{isAr ? 'العودة لقائمة الدروس' : 'Back to Lessons'}</span>
            </button>

            {/* AI Text-To-Speech Controls Bar */}
            <div className="flex items-center gap-2">
              {/* Rate selector */}
              <button
                onClick={() => {
                  haptics.tap();
                  const nextRate = speechRate === 1.0 ? 1.2 : speechRate === 1.2 ? 0.8 : 1.0;
                  setSpeechRate(nextRate);
                  if (speechSynthRef.current) {
                    speechSynthRef.current.rate = nextRate;
                  }
                }}
                className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-mono font-bold hover:bg-slate-700 transition"
                title="Speech Speed"
              >
                {speechRate}x
              </button>

              {/* Play / Pause TTS */}
              <button
                onClick={handleToggleSpeech}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition active:scale-95 ${
                  isSpeaking
                    ? isPaused
                      ? 'bg-amber-500 text-slate-950 font-black shadow'
                      : 'bg-emerald-500 text-slate-950 font-black shadow animate-pulse'
                    : 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow'
                }`}
              >
                {isSpeaking ? (
                  isPaused ? (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isAr ? 'استئناف القراءة' : 'Resume Voice'}</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>{isAr ? 'إيقاف مؤقت' : 'Pause Voice'}</span>
                    </>
                  )
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'اقرأ لي بالذكاء الاصطناعي' : 'Read to Me with AI'}</span>
                  </>
                )}
              </button>

              {isSpeaking && (
                <button
                  onClick={stopSpeech}
                  className="p-1.5 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 transition"
                  title="Stop"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              )}
            </div>
          </div>

          {/* Lesson Main Content Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800/90 shadow-xl flex flex-col gap-5">
            {/* Title & Badge */}
            <div className="pb-4 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded-full border border-cyan-800">
                {isAr ? activeLesson.levelBadgeAr : activeLesson.levelBadgeEn}
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-white mt-2">
                {isAr ? activeLesson.titleAr : activeLesson.titleEn}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                {isAr ? activeLesson.shortDescAr : activeLesson.shortDescEn}
              </p>
            </div>

            {/* Sections */}
            {activeLesson.sections.map((section, idx) => (
              <div key={section.id || idx} className="flex flex-col gap-3">
                <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-cyan-400 rounded-full" />
                  <span>{isAr ? section.headingAr : section.headingEn}</span>
                </h3>

                {/* Paragraphs */}
                <div className="space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {(isAr ? section.paragraphsAr : section.paragraphsEn).map((para, pIdx) => (
                    <p key={pIdx}>{para}</p>
                  ))}
                </div>

                {/* Bullet points if any */}
                {section.bulletPointsAr && section.bulletPointsAr.length > 0 && (
                  <ul className="space-y-1 my-1 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs sm:text-sm text-slate-300">
                    {(isAr ? section.bulletPointsAr : section.bulletPointsEn || []).map((b, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Interactive Visual Diagram */}
                {section.diagramType && (
                  <InteractiveTheoryDiagram
                    type={section.diagramType}
                    titleAr={section.diagramTitleAr}
                    titleEn={section.diagramTitleEn}
                    isArabic={isAr}
                  />
                )}

                {/* Pedagogy tip */}
                {section.pedagogyTipAr && (
                  <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{isAr ? section.pedagogyTipAr : section.pedagogyTipEn}</span>
                  </div>
                )}
              </div>
            ))}

            {/* Lesson Summary Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-950 border border-indigo-500/30">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>{isAr ? 'ملخص الدرس السريع:' : 'Quick Summary:'}</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {(isAr ? activeLesson.summaryAr : activeLesson.summaryEn).map((s, sIdx) => (
                  <li key={sIdx} className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 
              ==================================================================
              AI MUSIC TUTOR: ASK QUESTIONS & GET SMART EXPLANATIONS
              ==================================================================
            */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">
                    {isAr ? 'اسأل المعلم الموسيقي الذكي عن هذا الدرس:' : 'Ask AI Tutor about this lesson:'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Gemini Flash</span>
              </div>

              {/* Quick Prompt Chips */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { textAr: 'اشرح لي بتبسيط كأن عمري 10 سنوات', textEn: 'Explain simply like I am 10', type: 'explain_simple' },
                  { textAr: 'أعطني مثالاً عملياً من أغنية مشهورة', textEn: 'Give me a song example', type: 'give_analogy' },
                  { textAr: 'ما هي الأخطاء الشائعة للمبتدئين هنا؟', textEn: 'Common beginner mistakes?', type: 'custom' },
                ].map((chip, cIdx) => (
                  <button
                    key={cIdx}
                    onClick={() => handleAskAI(isAr ? chip.textAr : chip.textEn, chip.type)}
                    disabled={isAiLoading}
                    className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-medium transition active:scale-95 disabled:opacity-50"
                  >
                    {isAr ? chip.textAr : chip.textEn}
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAskAI();
                  }}
                  placeholder={isAr ? 'اكتب أي سؤال موسيقي ترغب في توضيحه...' : 'Type any music theory question...'}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={() => handleAskAI()}
                  disabled={isAiLoading || !aiQuestion.trim()}
                  className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition disabled:opacity-50 flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إرسال' : 'Ask'}</span>
                </button>
              </div>

              {/* AI Answer Box */}
              {isAiLoading && (
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-cyan-300 flex items-center gap-2 animate-pulse">
                  <Brain className="w-4 h-4 animate-spin" />
                  <span>{isAr ? 'المعلم الذكي يحلل المفهوم ويكتب لك الشرح المبسط...' : 'AI Tutor is crafting an explanation...'}</span>
                </div>
              )}

              {aiAnswer && !isAiLoading && (
                <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-xs text-slate-200 leading-relaxed font-sans animate-in fade-in">
                  <div className="font-bold text-cyan-300 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isAr ? 'إجابة المعلم الذكي:' : 'AI Tutor Explanation:'}</span>
                  </div>
                  <p className="whitespace-pre-line">{aiAnswer}</p>
                </div>
              )}
            </div>

            {/* Bottom Actions: Take Quiz */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  stopSpeech();
                  haptics.tap();
                  setActiveView('curriculum');
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                {isAr ? 'قائمة الدروس' : 'All Lessons'}
              </button>

              <button
                onClick={() => startQuiz(activeLesson)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-white font-black text-xs sm:text-sm shadow-xl shadow-indigo-950/60 transition active:scale-95 flex items-center gap-2"
              >
                <Award className="w-4 h-4" />
                <span>{isAr ? 'بدء اختبار هذا الدرس' : 'Take Lesson Quiz'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        VIEW 3: LESSON QUIZ MODE (اختبار تفاعلي لكل درس مع تقييم ونجوم)
        ========================================================================
      */}
      {activeView === 'quiz' && (
        <div className="flex flex-col gap-4">
          {/* Quiz Header */}
          <div className="flex items-center justify-between bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => {
                haptics.tap();
                setActiveView('lesson');
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition"
            >
              {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span>{isAr ? 'العودة للدرس' : 'Back to Lesson'}</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-cyan-400">
                {currentQuestionIdx + 1} / {activeLesson.quiz.length}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {isAr ? 'اختبار فهم الدرس' : 'Comprehension Test'}
              </span>
            </div>
          </div>

          {!isQuizCompleted ? (
            /* Active Question Card */
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800/90 shadow-xl flex flex-col gap-5">
              {/* Question text */}
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                  {isAr ? `السؤال رقم ${currentQuestionIdx + 1}:` : `Question ${currentQuestionIdx + 1}:`}
                </span>
                <h3 className="text-base sm:text-lg font-black text-white mt-1">
                  {isAr
                    ? activeLesson.quiz[currentQuestionIdx].questionAr
                    : activeLesson.quiz[currentQuestionIdx].questionEn}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {(isAr
                  ? activeLesson.quiz[currentQuestionIdx].optionsAr
                  : activeLesson.quiz[currentQuestionIdx].optionsEn
                ).map((optionText, optIdx) => {
                  const isSelected = selectedOptionIdx === optIdx;
                  const isCorrect = optIdx === activeLesson.quiz[currentQuestionIdx].correctIndex;

                  let optionStyle = 'bg-slate-950/90 border-slate-800 text-slate-300 hover:border-slate-700';

                  if (isAnswerSubmitted) {
                    if (isCorrect) {
                      optionStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/40 shadow-lg';
                    } else if (isSelected) {
                      optionStyle = 'bg-rose-950/80 border-rose-500 text-rose-200';
                    }
                  } else if (isSelected) {
                    optionStyle = 'bg-cyan-500/20 border-cyan-400 text-white ring-2 ring-cyan-400/40';
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectQuizOption(optIdx)}
                      disabled={isAnswerSubmitted}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-98 ${
                        isAr ? 'text-right' : 'text-left'
                      } ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center font-mono text-xs font-bold text-slate-300 shrink-0">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="text-xs sm:text-sm font-bold">{optionText}</span>
                      </div>

                      {isAnswerSubmitted && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      )}
                      {isAnswerSubmitted && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation after submitting */}
              {isAnswerSubmitted && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-1.5 animate-in fade-in">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-300">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>{isAr ? 'الشرح البيداغوجي:' : 'Pedagogical Explanation:'}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {isAr
                      ? activeLesson.quiz[currentQuestionIdx].explanationAr
                      : activeLesson.quiz[currentQuestionIdx].explanationEn}
                  </p>
                </div>
              )}

              {/* Bottom Submit / Next CTA */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
                {!isAnswerSubmitted ? (
                  <button
                    onClick={handleSubmitQuizAnswer}
                    disabled={selectedOptionIdx === null}
                    className="px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-black text-xs sm:text-sm transition active:scale-95"
                  >
                    {isAr ? 'تأكيد الإجابة' : 'Submit Answer'}
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuizQuestion}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs sm:text-sm transition active:scale-95 flex items-center gap-2 shadow-lg"
                  >
                    <span>
                      {currentQuestionIdx + 1 === activeLesson.quiz.length
                        ? isAr ? 'عرض النتيجة النهائية' : 'See Final Results'
                        : isAr ? 'السؤال التالي' : 'Next Question'}
                    </span>
                    {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Quiz Completed Results Card */
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col items-center justify-center text-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-amber-950/60">
                <Award className="w-8 h-8 text-amber-200" />
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  {isAr ? 'اكتمل اختبار الدرس بنجاح!' : 'Lesson Quiz Completed!'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isAr
                    ? `أجبت على ${quizScore} من أصل ${activeLesson.quiz.length} أسئلة بشكل صحيح.`
                    : `You answered ${quizScore} out of ${activeLesson.quiz.length} questions correctly.`}
                </p>
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-2 my-1">
                {[1, 2, 3].map((starIdx) => {
                  const finalScorePct = Math.round((quizScore / activeLesson.quiz.length) * 100);
                  const isEarned = (starIdx === 1 && finalScorePct >= 40) ||
                                   (starIdx === 2 && finalScorePct >= 65) ||
                                   (starIdx === 3 && finalScorePct >= 90);

                  return (
                    <Star
                      key={starIdx}
                      className={`w-8 h-8 transition-all ${
                        isEarned
                          ? 'text-amber-400 fill-amber-400 scale-110'
                          : 'text-slate-700'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Percentage Pill */}
              <div className="px-4 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-cyan-300 font-mono font-black text-sm">
                {Math.round((quizScore / activeLesson.quiz.length) * 100)}% {isAr ? 'دقة الإجابات' : 'Score'}
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                <button
                  onClick={() => startQuiz(activeLesson)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إعادة الاختبار' : 'Retake Quiz'}</span>
                </button>

                <button
                  onClick={() => setActiveView('curriculum')}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
                >
                  <span>{isAr ? 'متابعة قائمة الدروس' : 'Continue Lessons'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 
        ========================================================================
        VIEW 4: MUSICAL TERMS GLOSSARY (معجم المصطلحات الموسيقية التفاعلي)
        ========================================================================
      */}
      {activeView === 'glossary' && (
        <div className="flex flex-col gap-4">
          {/* Search & Filter Header */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-extrabold text-white">
                  {isAr ? 'معجم المصطلحات الموسيقية الشامل' : 'Comprehensive Music Glossary'}
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono font-bold">
                {MUSICAL_TERMS_GLOSSARY.length} {isAr ? 'مصطلح' : 'terms'}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'ابحث عن أي مصطلح (مثل: صولفيج، ديز، بيمول، أليجرو، بياتي)...' : 'Search musical term...'}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { id: 'all', labelAr: 'الكل', labelEn: 'All' },
                { id: 'clef', labelAr: 'المفاتيح والمدرج', labelEn: 'Clefs & Staff' },
                { id: 'pitch', labelAr: 'النغمات والطبقات', labelEn: 'Pitch' },
                { id: 'rhythm', labelAr: 'الأزمنة والإيقاع', labelEn: 'Rhythm' },
                { id: 'accidental', labelAr: 'علامات التحويل', labelEn: 'Accidentals' },
                { id: 'arabic', labelAr: 'المقامات الشرقية', labelEn: 'Arabic Microtones' },
                { id: 'dynamic', labelAr: 'الديناميكية والشدة', labelEn: 'Dynamics' },
                { id: 'tempo', labelAr: 'السرعات الإيطالية', labelEn: 'Tempi' },
                { id: 'articulation', labelAr: 'أساليب الأداء', labelEn: 'Articulations' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedGlossaryCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                    selectedGlossaryCategory === cat.id
                      ? 'bg-cyan-500 text-slate-950 font-black shadow'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? cat.labelAr : cat.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Terms Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {MUSICAL_TERMS_GLOSSARY.filter((term) => {
              const matchesSearch =
                !searchQuery ||
                term.termAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
                term.termEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                term.defAr.toLowerCase().includes(searchQuery.toLowerCase());

              const matchesCategory =
                selectedGlossaryCategory === 'all' || term.category === selectedGlossaryCategory;

              return matchesSearch && matchesCategory;
            }).map((term, tIdx) => (
              <div
                key={tIdx}
                className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between gap-2 hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-lg text-amber-400">{term.symbol}</span>
                    {term.audioMidi && (
                      <button
                        onClick={() => {
                          haptics.tap();
                          audioEngine.playNote(term.audioMidi!, 1.2);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition"
                        title="Hear note"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <h4 className="font-black text-sm text-white">{term.termAr}</h4>
                  <span className="font-mono text-[10px] text-slate-400 font-bold block mb-1">
                    {term.termEn}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{term.defAr}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
