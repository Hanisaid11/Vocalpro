/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation, ActiveTab } from './components/Navigation';
import { OfflineBanner } from './components/OfflineBanner';
import { PianoView } from './components/Piano/PianoView';
import { VoiceProfiler } from './components/Profiler/VoiceProfiler';
import { PitchGamesHub } from './components/Games/PitchGamesHub';
import { ProgressiveCurriculumView } from './components/Levels/ProgressiveCurriculumView';
import { SongMatchStudio } from './components/SongMatch/SongMatchStudio';
import { WarmupRoutines } from './components/Exercises/WarmupRoutines';
import { PitchTrainer } from './components/Training/PitchTrainer';
import { AIVocalCoach } from './components/Training/AIVocalCoach';
import { SolfeggioScaleMatcher } from './components/Training/SolfeggioScaleMatcher';
import { VocalLadderTrainer } from './components/Training/VocalLadderTrainer';
import { LiveSingingStudio } from './components/Training/LiveSingingStudio';
import { HearGuessMimicStudio } from './components/Games/HearGuessMimicStudio';
import { AnalyticsDashboard } from './components/Analytics/AnalyticsDashboard';
import { DriveSyncModal } from './components/Sync/DriveSyncModal';
import { SettingsModal } from './components/Settings/SettingsModal';
import { DetailedGuideModal } from './components/Common/DetailedGuideModal';
import { Sparkles, Target, Layers, Mic } from 'lucide-react';
import { mobileBackManager, useMobileBackHandler } from './utils/useMobileBackButton';

import {
  VocalRangeProfile,
  PitchDetectionResult,
  PracticeSessionRecord,
  UserStats,
  PitchGameRecord,
  AppLanguage,
  NotationSystem,
  InstrumentType,
  AppTheme,
} from './types/vocal';
import { audioEngine } from './audio/audioEngine';
import {
  loadVocalProfile,
  saveVocalProfile,
  loadUserStats,
  savePracticeSession,
  savePitchGameRecord,
  loadSettings,
  saveSettings,
  AppSettings,
} from './utils/storage';
import { getDefaultVocalProfile } from './utils/noteUtils';
import { requestWakeLock, releaseWakeLock } from './utils/wakeLock';
import { translations } from './utils/i18n';
import { THEMES } from './utils/theme';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('piano');
  const [profile, setProfile] = useState<VocalRangeProfile>(getDefaultVocalProfile());
  const [stats, setStats] = useState<UserStats>(loadUserStats());
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const currentTheme = THEMES[settings.theme] || THEMES['classic-piano'];
  const isLightTheme = currentTheme.isLight;
  const [isListening, setIsListening] = useState(false);
  const [currentPitch, setCurrentPitch] = useState<PitchDetectionResult | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [trainerSubMode, setTrainerSubMode] = useState<
    'ladder' | 'live_studio' | 'solfeggio' | 'mimic' | 'ai_coach' | 'free_tuner'
  >('ladder');
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);
  const [showExitToast, setShowExitToast] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);

  // Register mobile hardware back button handlers:
  // If detailed guide modal is open -> close guide
  useMobileBackHandler(Boolean(activeGuideId), () => setActiveGuideId(null));
  // If settings modal is open -> close settings
  useMobileBackHandler(isSettingsOpen, () => setIsSettingsOpen(false));
  // If sync modal is open -> close sync
  useMobileBackHandler(isSyncModalOpen, () => setIsSyncModalOpen(false));
  // If on a sub-tab (not piano) -> return to piano
  useMobileBackHandler(activeTab !== 'piano', () => setActiveTab('piano'));

  // Derive guide ID for current active view/tab
  const getActiveTabGuideId = (): string => {
    if (activeTab === 'piano') return 'section_piano';
    if (activeTab === 'levels') return 'section_levels';
    if (activeTab === 'songMatch') return 'section_songMatch';
    if (activeTab === 'profiler') return 'section_profiler';
    if (activeTab === 'games') return 'section_games';
    if (activeTab === 'warmup') return 'section_warmup';
    if (activeTab === 'analytics') return 'section_analytics';
    if (activeTab === 'trainer') {
      if (trainerSubMode === 'ladder') return 'section_ladder';
      if (trainerSubMode === 'live_studio') return 'section_live_studio';
      if (trainerSubMode === 'solfeggio') return 'vocal_solfege';
      if (trainerSubMode === 'mimic') return 'vocal_aah';
      if (trainerSubMode === 'ai_coach') return 'section_ladder';
      if (trainerSubMode === 'free_tuner') return 'section_live_studio';
    }
    return 'section_piano';
  };

  useEffect(() => {
    mobileBackManager.init();
    mobileBackManager.registerExitToastCallback((show) => {
      setShowExitToast(show);
    });
  }, []);

  const t = translations[settings.language];
  const isAr = settings.language === 'ar';

  // Sync document language, text direction, and audio engine params with settings
  useEffect(() => {
    document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = settings.language;
    audioEngine.setInstrument(settings.instrument);
    if (settings.vocalVowel) {
      audioEngine.setVocalVowel(settings.vocalVowel);
    }
    if (settings.noteDurationBeats) {
      audioEngine.setNoteDurationBeats(settings.noteDurationBeats);
    }
    if (settings.pianoSoundSource) {
      audioEngine.setPianoSource(settings.pianoSoundSource);
    }
    audioEngine.setReferencePitch(settings.a4Frequency);
    audioEngine.setTuningTolerance(settings.tuningToleranceCents);
  }, [settings]);

  // Initialize profile & stats from storage on load
  useEffect(() => {
    async function initData() {
      const savedProfile = await loadVocalProfile();
      setProfile(savedProfile);
      setStats(loadUserStats());
    }
    initData();
  }, []);

  // Listen for audio engine pitch updates
  useEffect(() => {
    const unsubscribe = audioEngine.subscribe((result) => {
      setCurrentPitch(result);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Screen Wake Lock while active in warmup, games, or pitch trainer
  useEffect(() => {
    if (settings.keepScreenAwake && (activeTab === 'warmup' || activeTab === 'trainer' || activeTab === 'games')) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    return () => {
      releaseWakeLock();
    };
  }, [activeTab, settings.keepScreenAwake]);

  // Toggle microphone
  const handleToggleMic = async () => {
    if (isListening) {
      audioEngine.stopListening();
      setIsListening(false);
      setMicPermissionDenied(false);
    } else {
      try {
        setMicPermissionDenied(false);
        await audioEngine.startListening();
        setIsListening(true);
      } catch (err) {
        console.warn('Microphone permission request was not granted yet:', err);
        setMicPermissionDenied(true);
        setIsListening(false);
      }
    }
  };

  // Quick Language Toggle
  const handleToggleLanguage = () => {
    const nextLang: AppLanguage = settings.language === 'en' ? 'ar' : 'en';
    const updated = { ...settings, language: nextLang };
    setSettings(updated);
    saveSettings(updated);
  };

  // Update Settings
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Quick Change Notation
  const handleChangeNotation = (notation: NotationSystem) => {
    const updated = { ...settings, notation };
    setSettings(updated);
    saveSettings(updated);
  };

  // Quick Change Instrument
  const handleChangeInstrument = (instrument: InstrumentType) => {
    const updated = { ...settings, instrument };
    setSettings(updated);
    saveSettings(updated);
  };

  // Quick Change Theme
  const handleChangeTheme = (theme: AppTheme) => {
    const updated = { ...settings, theme };
    setSettings(updated);
    saveSettings(updated);
  };

  // Quick Change Piano Sound Source
  const handleChangePianoSource = (source: import('./audio/pianoSoundManager').PianoSoundSource) => {
    const updated = { ...settings, pianoSoundSource: source };
    setSettings(updated);
    saveSettings(updated);
    audioEngine.setPianoSource(source);
  };

  // Save new profile from Voice Profiler
  const handleSaveProfile = async (newProfile: VocalRangeProfile) => {
    await saveVocalProfile(newProfile);
    setProfile(newProfile);
    setActiveTab('piano');
  };

  // Record practice session
  const handleRecordSession = async (session: PracticeSessionRecord) => {
    const updatedStats = await savePracticeSession(session);
    setStats(updatedStats);
  };

  // Record game session
  const handleRecordGameSession = (record: PitchGameRecord) => {
    const updatedStats = savePitchGameRecord(record);
    setStats(updatedStats);
  };

  return (
    <div className={`min-h-screen ${currentTheme.appBg} ${currentTheme.appText} flex flex-col transition-colors duration-300 selection:bg-indigo-500/30 w-full max-w-full overflow-x-hidden`}>
      {/* Offline connectivity banner */}
      <OfflineBanner />

      {/* Main App Bar */}
      <Header
        profile={profile}
        isListening={isListening}
        onToggleMic={handleToggleMic}
        onOpenSync={() => setIsSyncModalOpen(true)}
        onOpenProfiler={() => setActiveTab('profiler')}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleLanguage={handleToggleLanguage}
        onOpenTheory={() => setActiveTab('levels')}
        onOpenSectionGuide={() => setActiveGuideId(getActiveTabGuideId())}
        language={settings.language}
        notation={settings.notation}
        theme={settings.theme}
        currentPitch={currentPitch}
      />

      {/* Microphone Permission Helper Toast/Banner */}
      {micPermissionDenied && (
        <div className="max-w-5xl w-full mx-auto px-3 sm:px-4 pt-2">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-950/80 border border-amber-500/60 shadow-xl text-amber-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 text-xl">
                🎙️
              </div>
              <div className="text-xs">
                <h4 className="font-bold text-amber-200 text-sm">
                  {isAr ? 'إذن الميكروفون مطلوب لتتبع النغمة المباشرة' : 'Microphone Permission Required'}
                </h4>
                <p className="text-amber-300/80 mt-0.5 leading-relaxed">
                  {isAr
                    ? 'يرجى الضغط على زر "السماح" (Allow) في متصفحك أو النقر على أيقونة القفل/الميكروفون في شريط العنوان لتفعيل التتبع الصوتي الحي.'
                    : 'Please click "Allow" in your browser prompt or click the lock/mic icon in your address bar to enable real-time pitch detection.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={handleToggleMic}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition cursor-pointer"
              >
                {isAr ? 'إعادة المحاولة ⟳' : 'Retry ⟳'}
              </button>
              <button
                onClick={() => setMicPermissionDenied(false)}
                className="px-3 py-1.5 rounded-xl bg-amber-900/50 hover:bg-amber-900 text-amber-200 text-xs transition cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-4 md:p-6 pb-24 flex flex-col gap-4">
        {activeTab === 'piano' && (
          <div className="flex flex-col gap-4">
            <PianoView
              profile={profile}
              currentPitch={currentPitch}
              language={settings.language}
              notation={settings.notation}
              instrument={settings.instrument}
              theme={settings.theme}
              autoVerticalOnFullscreen={settings.autoVerticalOnFullscreen}
              pianoSoundSource={settings.pianoSoundSource}
              onChangePianoSource={handleChangePianoSource}
              onSelectRangeProfile={handleSaveProfile}
              onChangeNotation={handleChangeNotation}
              onChangeInstrument={handleChangeInstrument}
              onChangeTheme={handleChangeTheme}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />

            {/* Quick action bar beneath piano */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              {/* Feature 1: Vocal Ladder (Do-Re / Aah / Brrr) */}
              <div className={`${isLightTheme ? 'bg-white/95 border-amber-300/80 shadow-md text-slate-800' : 'bg-gradient-to-b from-amber-950/40 to-slate-900 border border-amber-500/40 text-slate-100'} p-3 rounded-2xl flex flex-col justify-between gap-2 shadow-sm hover:border-amber-400 transition`}>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-amber-500">🪜 {isAr ? 'تدرج الطبقات' : 'Vocal Ladder'}</span>
                    <span className={`text-[9px] font-mono ${isLightTheme ? 'text-amber-800 bg-amber-100 border-amber-300' : 'text-amber-300 bg-amber-950 border-amber-800'} px-1.5 py-0.2 rounded border`}>Do-Re/Brrr</span>
                  </div>
                  <h3 className={`font-bold ${isLightTheme ? 'text-slate-900' : 'text-white'} text-xs`}>{isAr ? 'تدرج الطبقات (دو الجواب)' : 'Vocal Register Ladder'}</h3>
                  <p className={`${isLightTheme ? 'text-slate-600' : 'text-slate-400'} text-[10px] mt-0.5 line-clamp-1`}>
                    {isAr ? 'دو ري، آه آه، اممم، بررر من القرار إلى الجواب صعوداً وهبوطاً' : 'Climb step-by-step from Root Do to High Do with syllables'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setTrainerSubMode('ladder');
                    setActiveTab('trainer');
                  }}
                  className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-pink-600 hover:from-amber-400 hover:to-pink-500 text-slate-950 font-black text-xs shadow-md transition"
                >
                  {isAr ? 'ابدأ تدرج الطبقات' : 'Start Ladder'}
                </button>
              </div>

              {/* Feature 2: Live Singing Studio & Note Dial */}
              <div className={`${isLightTheme ? 'bg-white/95 border-emerald-300/80 shadow-md text-slate-800' : 'bg-gradient-to-b from-emerald-950/40 to-slate-900 border border-emerald-500/40 text-slate-100'} p-3 rounded-2xl flex flex-col justify-between gap-2 shadow-sm hover:border-emerald-400 transition`}>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-emerald-500">🎙️ {isAr ? 'المؤشر الحي' : 'Live Pitch Dial'}</span>
                    <span className={`text-[9px] font-mono ${isLightTheme ? 'text-emerald-800 bg-emerald-100 border-emerald-300' : 'text-emerald-300 bg-emerald-950 border-emerald-800'} px-1.5 py-0.2 rounded border`}>Live Studio</span>
                  </div>
                  <h3 className={`font-bold ${isLightTheme ? 'text-slate-900' : 'text-white'} text-xs`}>{isAr ? 'استوديو الغناء ومؤشر النغمات' : 'Live Note Studio'}</h3>
                  <p className={`${isLightTheme ? 'text-slate-600' : 'text-slate-400'} text-[10px] mt-0.5 line-clamp-1`}>
                    {isAr ? 'غنِّ بحرية مع مؤشر فوري للنغمة وانحراف السنت وإتقان الأداء' : 'Free singing with real-time note dial, cents deviation & match rate'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setTrainerSubMode('live_studio');
                    setActiveTab('trainer');
                  }}
                  className="w-full py-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs shadow-md transition"
                >
                  {isAr ? 'افتح الاستوديو الحي' : 'Open Live Studio'}
                </button>
              </div>

              {/* Feature 3: Do-Re-Mi Scale Matcher */}
              <div className={`${isLightTheme ? 'bg-white/95 border-cyan-300/80 shadow-md text-slate-800' : 'bg-gradient-to-b from-cyan-950/40 to-slate-900 border border-cyan-500/40 text-slate-100'} p-3 rounded-2xl flex flex-col justify-between gap-2 shadow-sm hover:border-cyan-400 transition`}>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-cyan-500">🎼 {isAr ? 'سلم الصولفيج' : 'Solfège'}</span>
                    <span className={`text-[9px] font-mono ${isLightTheme ? 'text-cyan-800 bg-cyan-100 border-cyan-300' : 'text-cyan-300 bg-cyan-950 border-cyan-800'} px-1.5 py-0.2 rounded border`}>% Match</span>
                  </div>
                  <h3 className={`font-bold ${isLightTheme ? 'text-slate-900' : 'text-white'} text-xs`}>{t.solfeggioTitle}</h3>
                  <p className={`${isLightTheme ? 'text-slate-600' : 'text-slate-400'} text-[10px] mt-0.5 line-clamp-1`}>{t.solfeggioDesc}</p>
                </div>
                <button
                  onClick={() => {
                    setTrainerSubMode('solfeggio');
                    setActiveTab('trainer');
                  }}
                  className="w-full py-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl font-black text-xs shadow-md transition"
                >
                  {isAr ? 'ابدأ السلم' : 'Start Scale'}
                </button>
              </div>

              {/* Feature 4: Hear, Guess & Mimic with Voice */}
              <div className={`${isLightTheme ? 'bg-white/95 border-purple-300/80 shadow-md text-slate-800' : 'bg-gradient-to-b from-purple-950/40 to-slate-900 border border-purple-500/40 text-slate-100'} p-3 rounded-2xl flex flex-col justify-between gap-2 shadow-sm hover:border-purple-400 transition`}>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-purple-500">🪕 {isAr ? 'احزر وقلّد' : 'Hear & Mimic'}</span>
                    <span className={`text-[9px] font-mono ${isLightTheme ? 'text-purple-800 bg-purple-100 border-purple-300' : 'text-purple-300 bg-purple-950 border-purple-800'} px-1.5 py-0.2 rounded border`}>Piano/Voice</span>
                  </div>
                  <h3 className={`font-bold ${isLightTheme ? 'text-slate-900' : 'text-white'} text-xs`}>{t.hearGuessMimicTitle}</h3>
                  <p className={`${isLightTheme ? 'text-slate-600' : 'text-slate-400'} text-[10px] mt-0.5 line-clamp-1`}>{t.hearGuessMimicDesc}</p>
                </div>
                <button
                  onClick={() => {
                    setTrainerSubMode('mimic');
                    setActiveTab('trainer');
                  }}
                  className="w-full py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-black text-xs shadow-md transition"
                >
                  {isAr ? 'احزر وقلّد' : 'Play Mode'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'levels' && (
          <ProgressiveCurriculumView
            profile={profile}
            currentPitch={currentPitch}
            language={settings.language}
            notation={settings.notation}
            theme={settings.theme}
            onOpenPiano={() => setActiveTab('piano')}
          />
        )}

        {activeTab === 'songMatch' && (
          <SongMatchStudio
            profile={profile}
            currentPitch={currentPitch}
            language={settings.language}
            notation={settings.notation}
            theme={settings.theme}
          />
        )}

        {activeTab === 'profiler' && (
          <VoiceProfiler
            currentProfile={profile}
            currentPitch={currentPitch}
            language={settings.language}
            notation={settings.notation}
            onSaveProfile={handleSaveProfile}
            onClose={() => setActiveTab('piano')}
          />
        )}

        {activeTab === 'games' && (
          <PitchGamesHub
            profile={profile}
            currentPitch={currentPitch}
            stats={stats}
            language={settings.language}
            notation={settings.notation}
            theme={settings.theme}
            onRecordGameSession={handleRecordGameSession}
          />
        )}

        {activeTab === 'warmup' && (
          <WarmupRoutines
            profile={profile}
            currentPitch={currentPitch}
            language={settings.language}
            notation={settings.notation}
            onSessionComplete={handleRecordSession}
          />
        )}

        {activeTab === 'trainer' && (
          <div className="flex flex-col gap-3">
            {/* Trainer Submode Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900/95 border border-slate-800 rounded-2xl max-w-4xl mx-auto w-full overflow-x-auto scrollbar-none shadow-lg">
              <button
                onClick={() => setTrainerSubMode('ladder')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
                  trainerSubMode === 'ladder'
                    ? 'bg-gradient-to-r from-amber-500 to-pink-600 text-slate-950 font-black shadow-md shadow-pink-600/30 ring-1 ring-amber-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>🪜</span>
                <span>{settings.language === 'ar' ? 'تدرج الطبقات (دو-ري/آه/برر)' : 'Vocal Ladder (Do-Re/Brrr)'}</span>
              </button>

              <button
                onClick={() => setTrainerSubMode('live_studio')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
                  trainerSubMode === 'live_studio'
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{settings.language === 'ar' ? 'استوديو الغناء والمؤشر الحي' : 'Live Note Studio'}</span>
              </button>

              <button
                onClick={() => setTrainerSubMode('solfeggio')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
                  trainerSubMode === 'solfeggio'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>🎼</span>
                <span>{settings.language === 'ar' ? 'سلم دو ري مي (% تطابق)' : 'Do-Re-Mi % Match'}</span>
              </button>

              <button
                onClick={() => setTrainerSubMode('mimic')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
                  trainerSubMode === 'mimic'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>🪕</span>
                <span>{settings.language === 'ar' ? 'احزر وقلّد بالصوت' : 'Hear & Mimic'}</span>
              </button>

              <button
                onClick={() => setTrainerSubMode('ai_coach')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
                  trainerSubMode === 'ai_coach'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>{t.aiTrainerStepByStep}</span>
              </button>

              <button
                onClick={() => setTrainerSubMode('free_tuner')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
                  trainerSubMode === 'free_tuner'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Target className="w-3.5 h-3.5 text-amber-300" />
                <span>{settings.language === 'ar' ? 'المدوزن' : 'Tuner'}</span>
              </button>
            </div>

            {trainerSubMode === 'ladder' ? (
              <VocalLadderTrainer
                profile={profile}
                currentPitch={currentPitch}
                language={settings.language}
                notation={settings.notation}
                onRecordSession={handleRecordSession}
                onOpenLiveStudio={() => setTrainerSubMode('live_studio')}
                onBackToHub={() => setTrainerSubMode('solfeggio')}
              />
            ) : trainerSubMode === 'live_studio' ? (
              <LiveSingingStudio
                profile={profile}
                currentPitch={currentPitch}
                language={settings.language}
                notation={settings.notation}
                onRecordSession={handleRecordSession}
                onOpenLadderTrainer={() => setTrainerSubMode('ladder')}
              />
            ) : trainerSubMode === 'solfeggio' ? (
              <SolfeggioScaleMatcher
                profile={profile}
                currentPitch={currentPitch}
                language={settings.language}
                notation={settings.notation}
                onRecordSession={handleRecordSession}
              />
            ) : trainerSubMode === 'mimic' ? (
              <HearGuessMimicStudio
                profile={profile}
                currentPitch={currentPitch}
                language={settings.language}
                notation={settings.notation}
                theme={settings.theme}
                onRecordGameSession={handleRecordGameSession}
                onBackToHub={() => setTrainerSubMode('solfeggio')}
              />
            ) : trainerSubMode === 'ai_coach' ? (
              <AIVocalCoach
                profile={profile}
                currentPitch={currentPitch}
                language={settings.language}
                notation={settings.notation}
                onRecordSession={handleRecordSession}
              />
            ) : (
              <PitchTrainer
                profile={profile}
                currentPitch={currentPitch}
                language={settings.language}
                notation={settings.notation}
                onRecordSession={handleRecordSession}
              />
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            stats={stats}
            profile={profile}
            language={settings.language}
            notation={settings.notation}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Google Drive & JSON Cloud Sync Modal */}
      <DriveSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onDataRestored={async () => {
          const reloadedProfile = await loadVocalProfile();
          setProfile(reloadedProfile);
          setStats(loadUserStats());
        }}
        currentProfile={profile}
        stats={stats}
      />

      {/* Global Section & Exercise Detailed Educational Guide Modal */}
      <DetailedGuideModal
        guideId={activeGuideId}
        isOpen={Boolean(activeGuideId)}
        onClose={() => setActiveGuideId(null)}
        language={settings.language}
      />

      {/* Mobile Hardware Double-Back-to-Exit Toast */}
      {showExitToast && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/95 border border-amber-500/60 text-amber-200 rounded-full text-xs font-bold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>
            {settings.language === 'ar'
              ? 'اضغط رجوع مرة أخرى للخروج من التطبيق'
              : 'Press back again to exit'}
          </span>
        </div>
      )}

      {/* Android Mobile Bottom Navigation */}
      <Navigation
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        language={settings.language}
        theme={settings.theme}
      />
    </div>
  );
}
