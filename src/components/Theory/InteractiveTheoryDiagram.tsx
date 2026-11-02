import React, { useState } from 'react';
import { Volume2, Sparkles, Check, Play, Pause, Info } from 'lucide-react';
import { TheoryDiagramType } from '../../data/musicTheoryLessons';
import { audioEngine } from '../../audio/audioEngine';
import { haptics } from '../../utils/haptics';

interface InteractiveTheoryDiagramProps {
  type: TheoryDiagramType;
  titleAr?: string;
  titleEn?: string;
  isArabic?: boolean;
}

export const InteractiveTheoryDiagram: React.FC<InteractiveTheoryDiagramProps> = ({
  type,
  titleAr,
  titleEn,
  isArabic = true,
}) => {
  const [activeElement, setActiveElement] = useState<string | null>(null);
  const [activeMidi, setActiveMidi] = useState<number | null>(null);

  const playNote = (midi: number, label: string) => {
    haptics.tap();
    setActiveElement(label);
    setActiveMidi(midi);
    audioEngine.playNote(midi, 1.2);
    setTimeout(() => {
      setActiveMidi(null);
    }, 1200);
  };

  return (
    <div className="my-4 rounded-3xl bg-slate-950/90 border border-indigo-500/30 p-4 sm:p-5 shadow-xl relative overflow-hidden">
      {/* Diagram Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h4 className="text-xs sm:text-sm font-extrabold text-white">
            {isArabic ? titleAr || 'رسم توضيحي تفاعلي' : titleEn || 'Interactive Diagram'}
          </h4>
        </div>
        <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-700/50 flex items-center gap-1">
          <Volume2 className="w-3 h-3" />
          <span>{isArabic ? 'انقر لتسمع الصوت' : 'Click to hear sound'}</span>
        </span>
      </div>

      {/* 1. Staff Lines & Spaces Diagram */}
      {type === 'staff_lines' && (
        <div className="flex flex-col gap-3">
          <div className="relative w-full bg-slate-900/90 rounded-2xl p-4 sm:p-6 border border-slate-800">
            {/* SVG 5 Staff Lines */}
            <svg viewBox="0 0 500 180" className="w-full h-auto select-none">
              {/* Lines 1 to 5 (from bottom y=140 to top y=20) */}
              {[
                { line: 5, y: 30, note: 77, nameAr: 'الخط 5: فا (F5)', nameEn: 'Line 5: F5' },
                { line: 4, y: 60, note: 74, nameAr: 'الخط 4: ري (D5)', nameEn: 'Line 4: D5' },
                { line: 3, y: 90, note: 71, nameAr: 'الخط 3: سي (B4)', nameEn: 'Line 3: B4' },
                { line: 2, y: 120, note: 67, nameAr: 'الخط 2: صول (G4)', nameEn: 'Line 2: G4' },
                { line: 1, y: 150, note: 64, nameAr: 'الخط 1: مي (E4)', nameEn: 'Line 1: E4' },
              ].map((item) => {
                const isActive = activeMidi === item.note;
                return (
                  <g
                    key={item.line}
                    className="cursor-pointer group"
                    onClick={() => playNote(item.note, item.nameAr)}
                  >
                    {/* Line path */}
                    <line
                      x1="60"
                      y1={item.y}
                      x2="450"
                      y2={item.y}
                      stroke={isActive ? '#22d3ee' : '#64748b'}
                      strokeWidth={isActive ? 3.5 : 2}
                      className="transition-colors duration-150 group-hover:stroke-cyan-300"
                    />
                    {/* Line badge */}
                    <rect
                      x="10"
                      y={item.y - 12}
                      width="42"
                      height="24"
                      rx="6"
                      fill={isActive ? '#0891b2' : '#1e293b'}
                      stroke={isActive ? '#22d3ee' : '#334155'}
                      strokeWidth="1"
                    />
                    <text
                      x="31"
                      y={item.y + 4}
                      textAnchor="middle"
                      fill={isActive ? '#ffffff' : '#94a3b8'}
                      fontSize="10"
                      fontWeight="bold"
                    >
                      #{item.line}
                    </text>
                  </g>
                );
              })}

              {/* Spaces 1 to 4 between lines */}
              {[
                { space: 4, y: 45, note: 76, nameAr: 'المسافة 4: مي (E5)', nameEn: 'Space 4: E5' },
                { space: 3, y: 75, note: 72, nameAr: 'المسافة 3: دو (C5)', nameEn: 'Space 3: C5' },
                { space: 2, y: 105, note: 69, nameAr: 'المسافة 2: لا (A4)', nameEn: 'Space 2: A4' },
                { space: 1, y: 135, note: 65, nameAr: 'المسافة 1: فا (F4)', nameEn: 'Space 1: F4' },
              ].map((item) => {
                const isActive = activeMidi === item.note;
                return (
                  <g
                    key={`space-${item.space}`}
                    className="cursor-pointer group"
                    onClick={() => playNote(item.note, item.nameAr)}
                  >
                    <rect
                      x="70"
                      y={item.y - 12}
                      width="370"
                      height="24"
                      rx="4"
                      fill={isActive ? 'rgba(6, 182, 212, 0.25)' : 'transparent'}
                      className="transition-colors group-hover:fill-cyan-500/10"
                    />
                    <text
                      x="465"
                      y={item.y + 4}
                      fill={isActive ? '#22d3ee' : '#64748b'}
                      fontSize="10"
                      fontWeight="bold"
                    >
                      S{item.space}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span>{isArabic ? '💡 انقر على أي خط أو مسافة لسماع نغمتها الموسيقية فوراً' : '💡 Click any line or space to preview its pitch'}</span>
            {activeElement && (
              <span className="font-bold text-cyan-400 font-mono bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                {activeElement}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 2. Clefs Comparison Diagram */}
      {type === 'clefs_comparison' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Treble Clef Card */}
          <div
            onClick={() => playNote(67, 'نغمة صول G4 (مفتاح صول)')}
            className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/50 to-slate-900 border border-cyan-500/40 cursor-pointer hover:border-cyan-400 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl font-serif text-cyan-300">𝄞</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                G Clef
              </span>
            </div>
            <div className="my-2">
              <h5 className="font-black text-sm text-white">{isArabic ? 'مفتاح صول (Treble Clef)' : 'Treble Clef (G Clef)'}</h5>
              <p className="text-xs text-slate-300 mt-1">
                {isArabic
                  ? 'يلتف حول الخط الثاني ليعطيه نغمة صول (G4 = 392 Hz). للأصوات الحادة واليد اليمنى للبيانو.'
                  : 'Spirals around line 2 (G4 = 392 Hz). For treble voices, violin, and right hand.'}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-400 pt-2 border-t border-cyan-800/40">
              <span>{isArabic ? 'المرجع: صول (G4)' : 'Anchor: G4'}</span>
              <Volume2 className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Bass Clef Card */}
          <div
            onClick={() => playNote(53, 'نغمة فا F3 (مفتاح فا)')}
            className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/50 to-slate-900 border border-indigo-500/40 cursor-pointer hover:border-indigo-400 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl font-serif text-indigo-300">𝄢</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                F Clef
              </span>
            </div>
            <div className="my-2">
              <h5 className="font-black text-sm text-white">{isArabic ? 'مفتاح فا (Bass Clef)' : 'Bass Clef (F Clef)'}</h5>
              <p className="text-xs text-slate-300 mt-1">
                {isArabic
                  ? 'تحيط نقطتاه بالخط الرابع ليعطيه نغمة فا (F3 = 174 Hz). للأصوات العميقة والباص واليد اليسرى.'
                  : 'Dots hug line 4 (F3 = 174 Hz). For bass voices, cello, and left hand.'}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-mono font-bold text-indigo-400 pt-2 border-t border-indigo-800/40">
              <span>{isArabic ? 'المرجع: فا (F3)' : 'Anchor: F3'}</span>
              <Volume2 className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      )}

      {/* 3. Grand Staff Diagram with Middle C */}
      {type === 'grand_staff' && (
        <div className="flex flex-col gap-3">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                {isArabic ? 'مفتاح صول (الطبقات الحادة)' : 'Treble Clef (Upper Register)'}
              </span>
              <span className="text-xl font-serif text-cyan-400">𝄞</span>
            </div>

            {/* Middle C Bridge Button */}
            <div className="my-2 flex items-center justify-center">
              <button
                onClick={() => playNote(60, 'دو الوسطى (Middle C / C4)')}
                className={`px-4 py-2.5 rounded-2xl border flex items-center gap-2 transition active:scale-95 ${
                  activeMidi === 60
                    ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/30 ring-2 ring-amber-400'
                    : 'bg-amber-950/40 text-amber-300 border-amber-600/50 hover:bg-amber-900/40'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span className="font-black text-xs sm:text-sm">
                  {isArabic ? 'دو الوسطى (Middle C · C4)' : 'Middle C (C4 · 261.6 Hz)'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-amber-200">
                  {isArabic ? 'الجسر المشترك' : 'Bridge'}
                </span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                {isArabic ? 'مفتاح فا (الطبقات العميقة)' : 'Bass Clef (Lower Register)'}
              </span>
              <span className="text-xl font-serif text-indigo-400">𝄢</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Treble Clef Note Ladder (Lines & Spaces) */}
      {type === 'treble_notes' && (
        <div className="flex flex-col gap-3">
          {/* Lines */}
          <div>
            <span className="text-[11px] font-bold text-cyan-300 mb-1.5 block">
              {isArabic ? 'نغمات الخطوط الخمسة (E - G - B - D - F):' : 'Line Notes (E - G - B - D - F):'}
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { labelAr: 'مي (1)', labelEn: 'E4', midi: 64 },
                { labelAr: 'صول (2)', labelEn: 'G4', midi: 67 },
                { labelAr: 'سي (3)', labelEn: 'B4', midi: 71 },
                { labelAr: 'ري (4)', labelEn: 'D5', midi: 74 },
                { labelAr: 'فا (5)', labelEn: 'F5', midi: 77 },
              ].map((n) => (
                <button
                  key={n.midi}
                  onClick={() => playNote(n.midi, n.labelAr)}
                  className={`p-2 rounded-xl border text-center transition active:scale-95 ${
                    activeMidi === n.midi
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow font-black'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-black">{isArabic ? n.labelAr : n.labelEn}</div>
                  <div className="text-[9px] font-mono opacity-80">{n.labelEn}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Spaces */}
          <div>
            <span className="text-[11px] font-bold text-pink-300 mb-1.5 block">
              {isArabic ? 'نغمات المسافات الأربع (F - A - C - E):' : 'Space Notes (F - A - C - E):'}
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { labelAr: 'فا (1)', labelEn: 'F4', midi: 65 },
                { labelAr: 'لا (2)', labelEn: 'A4', midi: 69 },
                { labelAr: 'دو (3)', labelEn: 'C5', midi: 72 },
                { labelAr: 'مي (4)', labelEn: 'E5', midi: 76 },
              ].map((n) => (
                <button
                  key={n.midi}
                  onClick={() => playNote(n.midi, n.labelAr)}
                  className={`p-2 rounded-xl border text-center transition active:scale-95 ${
                    activeMidi === n.midi
                      ? 'bg-pink-500 text-slate-950 border-pink-300 shadow font-black'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-black">{isArabic ? n.labelAr : n.labelEn}</div>
                  <div className="text-[9px] font-mono opacity-80">{n.labelEn}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Bass Clef Notes */}
      {type === 'bass_notes' && (
        <div className="flex flex-col gap-3">
          <div>
            <span className="text-[11px] font-bold text-indigo-300 mb-1.5 block">
              {isArabic ? 'نغمات خطوط مفتاح فا (G - B - D - F - A):' : 'Bass Line Notes (G - B - D - F - A):'}
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { labelAr: 'صول (1)', labelEn: 'G2', midi: 43 },
                { labelAr: 'سي (2)', labelEn: 'B2', midi: 47 },
                { labelAr: 'ري (3)', labelEn: 'D3', midi: 50 },
                { labelAr: 'فا (4)', labelEn: 'F3', midi: 53 },
                { labelAr: 'لا (5)', labelEn: 'A3', midi: 57 },
              ].map((n) => (
                <button
                  key={n.midi}
                  onClick={() => playNote(n.midi, n.labelAr)}
                  className={`p-2 rounded-xl border text-center transition active:scale-95 ${
                    activeMidi === n.midi
                      ? 'bg-indigo-500 text-white border-indigo-300 shadow font-black'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-black">{isArabic ? n.labelAr : n.labelEn}</div>
                  <div className="text-[9px] font-mono opacity-80">{n.labelEn}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-emerald-300 mb-1.5 block">
              {isArabic ? 'نغمات مسافات مفتاح فا (A - C - E - G):' : 'Bass Space Notes (A - C - E - G):'}
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { labelAr: 'لا (1)', labelEn: 'A2', midi: 45 },
                { labelAr: 'دو (2)', labelEn: 'C3', midi: 48 },
                { labelAr: 'مي (3)', labelEn: 'E3', midi: 52 },
                { labelAr: 'صول (4)', labelEn: 'G3', midi: 55 },
              ].map((n) => (
                <button
                  key={n.midi}
                  onClick={() => playNote(n.midi, n.labelAr)}
                  className={`p-2 rounded-xl border text-center transition active:scale-95 ${
                    activeMidi === n.midi
                      ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow font-black'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-black">{isArabic ? n.labelAr : n.labelEn}</div>
                  <div className="text-[9px] font-mono opacity-80">{n.labelEn}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. Note Durations Tree */}
      {type === 'durations_tree' && (
        <div className="flex flex-col gap-2.5">
          {[
            { symbol: '𝅝', nameAr: 'المستديرة (Whole Note)', nameEn: 'Whole Note (Semibreve)', beats: 4, width: 'w-full', color: 'border-amber-500/50 bg-amber-500/15 text-amber-300' },
            { symbol: '𝅗𝅥', nameAr: 'البيضاء (Half Note)', nameEn: 'Half Note (Minim)', beats: 2, width: 'w-1/2', color: 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300' },
            { symbol: '𝅘𝅥', nameAr: 'السوداء (Quarter Note)', nameEn: 'Quarter Note (Crotchet)', beats: 1, width: 'w-1/4', color: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300' },
            { symbol: '𝅘𝅥𝅮', nameAr: 'ذات السن (Eighth Note)', nameEn: 'Eighth Note (Quaver)', beats: 0.5, width: 'w-1/8', color: 'border-pink-500/50 bg-pink-500/15 text-pink-300' },
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                haptics.tap();
                audioEngine.playNote(60, item.beats * 0.5);
              }}
              className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition hover:scale-[1.01] active:scale-98 ${item.color}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-serif">{item.symbol}</span>
                <div>
                  <div className="text-xs font-black text-white">{isArabic ? item.nameAr : item.nameEn}</div>
                  <div className="text-[10px] opacity-80 font-mono">
                    {item.beats} {isArabic ? (item.beats === 1 ? 'ضربة واحدة' : item.beats === 2 ? 'ضربتان' : 'ضربات') : (item.beats === 1 ? 'beat' : 'beats')}
                  </div>
                </div>
              </div>
              <Volume2 className="w-4 h-4 opacity-70" />
            </div>
          ))}
        </div>
      )}

      {/* 7. Rests Table */}
      {type === 'rests_table' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { note: '𝅝 (مستديرة)', rest: 'سكتة مستديرة', desc: '4 أزمنة (تحت الخط 4)', symbol: '𝄻' },
            { note: '𝅗𝅥 (بيضاء)', rest: 'سكتة بيضاء', desc: 'زمنان (فوق الخط 3)', symbol: '𝄼' },
            { note: '𝅘𝅥 (سوداء)', rest: 'سكتة سوداء', desc: 'زمن واحد (برق)', symbol: '𝄽' },
            { note: '𝅘𝅥𝅮 (ذات سن)', rest: 'سكتة كروش', desc: 'نصف زمن', symbol: '𝄾' },
          ].map((item, idx) => (
            <div key={idx} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center flex flex-col justify-between">
              <span className="text-3xl font-serif text-amber-400 my-1">{item.symbol}</span>
              <div className="text-xs font-bold text-white mt-1">{item.rest}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.desc}</div>
            </div>
          ))}
        </div>
      )}

      {/* 8. Accidentals on Piano */}
      {type === 'accidentals_piano' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-around p-3 bg-slate-900 rounded-2xl border border-slate-800">
            <button
              onClick={() => playNote(60, 'دو طبيعية C')}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold border border-slate-700"
            >
              C (دو)
            </button>
            <span className="text-xs text-slate-500 font-bold">⇄</span>
            <button
              onClick={() => playNote(61, 'دو ديز C# / ري بيمول Db')}
              className="px-3 py-2 rounded-xl bg-cyan-950 border border-cyan-500 text-cyan-300 font-mono text-xs font-black shadow-lg shadow-cyan-950/50"
            >
              C♯ / D♭ (المفتاح الأسود)
            </button>
            <span className="text-xs text-slate-500 font-bold">⇄</span>
            <button
              onClick={() => playNote(62, 'ري طبيعية D')}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold border border-slate-700"
            >
              D (ري)
            </button>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed text-center">
            {isArabic
              ? 'الديز (♯) يصعد نصف بعد نحو اليمين، والبيمول (♭) يهبط نصف بعد نحو اليسار. وكلاهما يصلان إلى نفس المفتاح الأسود (نغمات مترادفة Enharmonic)!'
              : 'Sharps move one half-step right; flats move one half-step left to the identical black key.'}
          </p>
        </div>
      )}

      {/* 9. Arabic Quarter Tones */}
      {type === 'arabic_quarter_tones' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div
            onClick={() => playNote(64, 'مي طبيعية (E4 12-TET)')}
            className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white">{isArabic ? 'مي طبيعية (غربياً)' : 'Natural E (Western)'}</span>
              <span className="font-mono text-xs text-cyan-400 font-bold">0¢</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {isArabic ? 'النغمة الغربية القياسية في سلم دو الكبير.' : 'Standard 12-TET natural note.'}
            </p>
          </div>

          <div
            onClick={() => {
              haptics.pitchMatch();
              // Play Quarter-Tone E half flat (Midi 64 offset by -50 cents)
              const ctx = (audioEngine as any).getAudioContext?.();
              audioEngine.playTone(329.63 * Math.pow(2, -50 / 1200), 1.4, 'oud');
            }}
            className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/60 cursor-pointer hover:border-amber-400 shadow-lg shadow-amber-950/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300">
                {isArabic ? 'مي نصف بيمول (سيكاه -50¢)' : 'E Half-Flat (Sikah -50¢)'}
              </span>
              <span className="text-base font-serif text-amber-400">𝄳</span>
            </div>
            <p className="text-[10px] text-amber-200/80 mt-1">
              {isArabic ? 'سر الشجن العربي في مقامي الرست والبياتي بصوت العود!' : 'The microtonal soul of Maqam Bayati & Rast!'}
            </p>
          </div>
        </div>
      )}

      {/* 10. Dynamics Meter */}
      {type === 'dynamics_meter' && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-6 gap-1 text-center font-serif text-xs">
            {[
              { mark: 'pp', name: 'بيانِسيمو', sub: 'خافت جداً', color: 'bg-indigo-950 border-indigo-700 text-indigo-300' },
              { mark: 'p', name: 'بيانو', sub: 'هادئ', color: 'bg-cyan-950 border-cyan-700 text-cyan-300' },
              { mark: 'mp', name: 'ميزو بيانو', sub: 'معتدل الهدوء', color: 'bg-emerald-950 border-emerald-700 text-emerald-300' },
              { mark: 'mf', name: 'ميزو فورتي', sub: 'معتدل القوة', color: 'bg-amber-950 border-amber-700 text-amber-300' },
              { mark: 'f', name: 'فورتي', sub: 'قوي', color: 'bg-orange-950 border-orange-700 text-orange-300' },
              { mark: 'ff', name: 'فورتِسيمو', sub: 'قوي جداً', color: 'bg-rose-950 border-rose-700 text-rose-300' },
            ].map((d, i) => (
              <div key={i} className={`p-2 rounded-xl border flex flex-col justify-between ${d.color}`}>
                <span className="text-base font-bold italic">{d.mark}</span>
                <span className="text-[9px] font-sans font-bold mt-1 truncate">{d.name}</span>
                <span className="text-[8px] opacity-75 font-sans truncate">{d.sub}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
            <span>&lt; Crescendo (تدرج في القوة)</span>
            <span>Decrescendo (تدرج في الهدوء) &gt;</span>
          </div>
        </div>
      )}

      {/* 11. Tempi Gauge */}
      {type === 'tempi_gauge' && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-center font-mono text-xs">
          {[
            { mark: 'Largo', bpm: '40-60', labelAr: 'بطيء ووقور', color: 'border-purple-500/40 text-purple-300' },
            { mark: 'Adagio', bpm: '66-76', labelAr: 'هادئ ومسترسل', color: 'border-indigo-500/40 text-indigo-300' },
            { mark: 'Andante', bpm: '76-108', labelAr: 'بسرعة المشي', color: 'border-cyan-500/40 text-cyan-300' },
            { mark: 'Allegro', bpm: '120-156', labelAr: 'سريع ومبهج', color: 'border-amber-500/40 text-amber-300' },
            { mark: 'Presto', bpm: '168-200', labelAr: 'سريع جداً عاصف', color: 'border-rose-500/40 text-rose-300' },
          ].map((tItem, i) => (
            <div key={i} className={`p-2.5 rounded-xl border bg-slate-900/90 flex flex-col justify-between ${tItem.color}`}>
              <span className="text-xs font-black">{tItem.mark}</span>
              <span className="text-[10px] font-bold text-white my-0.5">{tItem.bpm} BPM</span>
              <span className="text-[9px] font-sans opacity-80">{tItem.labelAr}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
