import React from 'react';
import { AppLanguage, NotationSystem } from '../../types/vocal';
import { formatNoteName, midiToNoteInfo } from '../../utils/noteUtils';

export type NoteRhythmType = 'whole' | 'half' | 'quarter' | 'eighth'; // رُوند (4), بلانش (2), نُوار (1), كروش (0.5)

export interface StaffNote {
  midi: number;
  rhythm: NoteRhythmType;
  beats: number; // 4, 2, 1, 0.5
  name?: string;
  solfege?: string;
  arabic?: string;
  lyric?: string;
}

interface FiveLineStaffProps {
  notes: StaffNote[];
  currentIndex?: number;
  timeSignature?: string; // '4/4' | '3/4' | '2/4'
  bpm?: number;
  language?: AppLanguage;
  notation?: NotationSystem;
  onNoteClick?: (note: StaffNote, index: number) => void;
  showLabels?: boolean;
}

/**
 * FiveLineStaff (المدرج الخماسي الموسيقي)
 * Standard Western / Eastern musical notation staff renderer with 5 lines, clef, time signature, bar lines, and accurate note positions
 */
export const FiveLineStaff: React.FC<FiveLineStaffProps> = ({
  notes,
  currentIndex = 0,
  timeSignature = '4/4',
  bpm = 60,
  language = 'ar',
  notation = 'arabic',
  onNoteClick,
  showLabels = true,
}) => {
  const isAr = language === 'ar';

  // Staff Geometry Constants (SVG coordinates)
  // Staff Lines are at Y = 40, 56, 72, 88, 104 (5 lines, 16px space)
  // Line 5 (top) = F5 (midi 77) -> Y = 40
  // Space 4 = E5 (midi 76) -> Y = 48
  // Line 4 = D5 (midi 74) -> Y = 56
  // Space 3 = C5 (midi 72) -> Y = 64
  // Line 3 = B4 (midi 71) -> Y = 72
  // Space 2 = A4 (midi 69) -> Y = 80
  // Line 2 = G4 (midi 67) -> Y = 88 (Treble Clef curl center!)
  // Space 1 = F4 (midi 65) -> Y = 96
  // Line 1 (bottom) = E4 (midi 64) -> Y = 104
  // Space below = D4 (midi 62) -> Y = 112
  // Ledger Line 1 below = C4 (midi 60 - Middle C!) -> Y = 120
  // Space below ledger = B3 (midi 59) -> Y = 128
  // Ledger Line 2 below = A3 (midi 57) -> Y = 136

  const LINE_SPACING = 16;
  const TOP_LINE_Y = 46;
  const STAFF_LINES_Y = [
    TOP_LINE_Y,                       // Line 5: F5 (77)
    TOP_LINE_Y + LINE_SPACING,        // Line 4: D5 (74)
    TOP_LINE_Y + LINE_SPACING * 2,    // Line 3: B4 (71)
    TOP_LINE_Y + LINE_SPACING * 3,    // Line 2: G4 (67)
    TOP_LINE_Y + LINE_SPACING * 4,    // Line 1: E4 (64)
  ];
  const BOTTOM_LINE_Y = STAFF_LINES_Y[4]; // 110

  /**
   * Maps MIDI note number to Y coordinate on the Treble Staff
   * In diatonic steps from C4 (midi 60)
   */
  const midiToDiatonicY = (midi: number): { y: number; hasLedgerLineBelow: boolean; hasLedgerLineAbove: boolean; isSharp: boolean; isFlat: boolean } => {
    // Diatonic step offset relative to C4 (midi 60)
    // C4=0, D4=1, E4=2, F4=3, G4=4, A4=5, B4=6, C5=7, D5=8, E5=9, F5=10, G5=11, A5=12, B5=13, C6=14
    const semitonesFromC0 = midi % 12;
    const octave = Math.floor(midi / 12) - 1;
    
    // Scale step map for standard notes in C major scale
    const diatonicMap: Record<number, { step: number; accidental: 'none' | 'sharp' | 'flat' }> = {
      0: { step: 0, accidental: 'none' }, // C
      1: { step: 0, accidental: 'sharp' }, // C#
      2: { step: 1, accidental: 'none' }, // D
      3: { step: 1, accidental: 'sharp' }, // D#
      4: { step: 2, accidental: 'none' }, // E
      5: { step: 3, accidental: 'none' }, // F
      6: { step: 3, accidental: 'sharp' }, // F#
      7: { step: 4, accidental: 'none' }, // G
      8: { step: 4, accidental: 'sharp' }, // G#
      9: { step: 5, accidental: 'none' }, // A
      10: { step: 5, accidental: 'sharp' }, // A# / Bb
      11: { step: 6, accidental: 'none' }, // B
    };

    const dInfo = diatonicMap[semitonesFromC0] || { step: 0, accidental: 'none' };
    const totalDiatonicSteps = (octave - 4) * 7 + dInfo.step; // 0 for C4

    // C4 is at Y = 126 (each diatonic step moves up by LINE_SPACING / 2 = 8px)
    const C4_Y = BOTTOM_LINE_Y + LINE_SPACING; // 126
    const stepSize = LINE_SPACING / 2;
    const y = C4_Y - totalDiatonicSteps * stepSize;

    const hasLedgerLineBelow = totalDiatonicSteps <= 0; // C4 and below
    const hasLedgerLineAbove = totalDiatonicSteps >= 12; // A5 and above

    return {
      y,
      hasLedgerLineBelow,
      hasLedgerLineAbove,
      isSharp: dInfo.accidental === 'sharp',
      isFlat: dInfo.accidental === 'flat',
    };
  };

  // Measure bar line calculations
  // Parse beats per measure from time signature (e.g. 4/4 -> 4)
  const beatsPerMeasure = parseInt(timeSignature.split('/')[0], 10) || 4;
  
  // Calculate horizontal spacing
  const NOTE_START_X = 145; // Space after clef and time signature
  const NOTE_GAP = Math.max(68, Math.min(100, (680 - NOTE_START_X) / Math.max(notes.length, 4)));
  const totalSvgWidth = Math.max(720, NOTE_START_X + notes.length * NOTE_GAP + 60);

  // Measure boundaries
  let accumulatedBeats = 0;
  const barLinePositions: number[] = [];
  notes.forEach((note, idx) => {
    accumulatedBeats += note.beats;
    if (accumulatedBeats >= beatsPerMeasure && idx < notes.length - 1) {
      const barX = NOTE_START_X + (idx + 0.5) * NOTE_GAP;
      barLinePositions.push(barX);
      accumulatedBeats = 0;
    }
  });

  return (
    <div className="w-full bg-[#080d1a] border border-slate-800 rounded-3xl p-3 sm:p-5 shadow-2xl overflow-x-auto relative scrollbar-none select-none">
      {/* Top Header with Clef and Staff Info */}
      <div className="flex items-center justify-between text-xs pb-3 mb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-bold flex items-center gap-1.5">
            <span className="text-base">𝄞</span>
            <span>{isAr ? 'المدرج الخماسي (مفتاح صول)' : 'Five-Line Treble Staff'}</span>
          </div>
          <span className="px-2 py-0.5 rounded-lg bg-indigo-950/80 border border-indigo-800 text-indigo-300 font-mono font-bold">
            {timeSignature}
          </span>
          <span className="text-slate-400 font-mono text-[11px]">
            ♩ = {bpm} BPM
          </span>
        </div>

        {/* Legend of Rhythmic Symbols */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="font-serif text-sm text-amber-300">𝅝</span>
            <span>{isAr ? 'رُوند (4 أزمنة)' : 'Whole (4)'}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="font-serif text-sm text-cyan-300">𝅗𝅥</span>
            <span>{isAr ? 'بلانش (زمنين)' : 'Half (2)'}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="font-serif text-sm text-emerald-300">♩</span>
            <span>{isAr ? 'نُوار (زمن 1)' : 'Quarter (1)'}</span>
          </span>
        </div>
      </div>

      {/* SVG Sheet Music Renderer */}
      <div className="min-w-[680px] overflow-hidden flex justify-center py-2">
        <svg
          viewBox={`0 0 ${totalSvgWidth} 190`}
          className="w-full h-auto max-h-[220px]"
          style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
        >
          {/* Subtle parchment glow background for the staff lines */}
          <rect
            x="20"
            y="26"
            width={totalSvgWidth - 40}
            height="138"
            rx="12"
            fill="#090e1d"
            stroke="#1e293b"
            strokeWidth="1"
          />

          {/* 5 Staff Lines */}
          {STAFF_LINES_Y.map((y, idx) => (
            <line
              key={`staff-line-${idx}`}
              x1="30"
              y1={y}
              x2={totalSvgWidth - 30}
              y2={y}
              stroke="#64748b"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          ))}

          {/* Measure Start Line */}
          <line
            x1="30"
            y1={TOP_LINE_Y}
            x2="30"
            y2={BOTTOM_LINE_Y}
            stroke="#94a3b8"
            strokeWidth="2"
          />

          {/* Treble Clef Symbol (مفتاح صول 𝄞) */}
          <g transform={`translate(45, ${TOP_LINE_Y + 44}) scale(1.15)`}>
            <text
              x="0"
              y="0"
              fontSize="68"
              fill="#38bdf8"
              fontFamily="'Times New Roman', serif"
              style={{ userSelect: 'none' }}
            >
              𝄞
            </text>
          </g>

          {/* Time Signature (e.g. 4/4) */}
          <g transform={`translate(96, ${TOP_LINE_Y + 28})`}>
            <text
              x="0"
              y="0"
              fontSize="24"
              fontWeight="900"
              fill="#e2e8f0"
              fontFamily="'Times New Roman', serif"
              textAnchor="middle"
            >
              {timeSignature.split('/')[0]}
            </text>
            <text
              x="0"
              y="28"
              fontSize="24"
              fontWeight="900"
              fill="#e2e8f0"
              fontFamily="'Times New Roman', serif"
              textAnchor="middle"
            >
              {timeSignature.split('/')[1]}
            </text>
          </g>

          {/* Bar lines (المازورات) */}
          {barLinePositions.map((bx, idx) => (
            <line
              key={`bar-line-${idx}`}
              x1={bx}
              y1={TOP_LINE_Y}
              x2={bx}
              y2={BOTTOM_LINE_Y}
              stroke="#475569"
              strokeWidth="1.75"
              strokeDasharray="none"
            />
          ))}

          {/* End Double Bar Line */}
          <line
            x1={totalSvgWidth - 42}
            y1={TOP_LINE_Y}
            x2={totalSvgWidth - 42}
            y2={BOTTOM_LINE_Y}
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
          <line
            x1={totalSvgWidth - 36}
            y1={TOP_LINE_Y}
            x2={totalSvgWidth - 36}
            y2={BOTTOM_LINE_Y}
            stroke="#94a3b8"
            strokeWidth="3.5"
          />

          {/* Render All Notes on Staff */}
          {notes.map((note, index) => {
            const isCurrent = index === currentIndex;
            const isPast = index < currentIndex;
            const x = NOTE_START_X + index * NOTE_GAP;
            const { y, hasLedgerLineBelow, hasLedgerLineAbove, isSharp, isFlat } = midiToDiatonicY(note.midi);

            // Stem direction: notes on or above middle line (B4, Y <= 78) usually have stems going down
            const stemDown = y <= STAFF_LINES_Y[2];
            const stemLength = 34;
            const stemX = stemDown ? x - 6.5 : x + 6.5;
            const stemEndY = stemDown ? y + stemLength : y - stemLength;

            // Rhythmic colors & styles
            const isWhole = note.rhythm === 'whole' || note.beats === 4; // Rondo
            const isHalf = note.rhythm === 'half' || note.beats === 2;   // Blanche
            const isEighth = note.rhythm === 'eighth' || note.beats === 0.5; // Croche

            // Fill & stroke colors
            const noteFill = isWhole || isHalf ? '#0a101f' : isCurrent ? '#38bdf8' : isPast ? '#34d399' : '#ffffff';
            const noteStroke = isCurrent ? '#38bdf8' : isPast ? '#34d399' : '#ffffff';

            const noteInfo = midiToNoteInfo(note.midi);
            const labelText = formatNoteName(noteInfo, notation);
            const arabicSolfege = isAr ? (note.arabic || noteInfo.arabic) : (note.solfege || noteInfo.solfege);

            return (
              <g
                key={`staff-note-${index}`}
                onClick={() => onNoteClick && onNoteClick(note, index)}
                className="cursor-pointer transition-transform"
                style={{ transformOrigin: `${x}px ${y}px` }}
              >
                {/* Active note background glow cursor */}
                {isCurrent && (
                  <ellipse
                    cx={x}
                    cy={y}
                    rx="18"
                    ry="14"
                    fill="rgba(56, 189, 248, 0.22)"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                    className="animate-pulse"
                  />
                )}

                {/* Ledger Lines (Middle C4 / Ledger lines below or above staff) */}
                {hasLedgerLineBelow && (
                  <line
                    x1={x - 14}
                    y1={BOTTOM_LINE_Y + LINE_SPACING} // C4 ledger Y
                    x2={x + 14}
                    y2={BOTTOM_LINE_Y + LINE_SPACING}
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                  />
                )}
                {hasLedgerLineAbove && (
                  <line
                    x1={x - 14}
                    y1={TOP_LINE_Y - LINE_SPACING} // A5 ledger Y
                    x2={x + 14}
                    y2={TOP_LINE_Y - LINE_SPACING}
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                  />
                )}

                {/* Accidental: Sharp ♯ or Flat ♭ */}
                {isSharp && (
                  <text
                    x={x - 18}
                    y={y + 6}
                    fontSize="18"
                    fontWeight="bold"
                    fill={isCurrent ? '#38bdf8' : '#e2e8f0'}
                    fontFamily="'Times New Roman', serif"
                  >
                    ♯
                  </text>
                )}
                {isFlat && (
                  <text
                    x={x - 16}
                    y={y + 6}
                    fontSize="20"
                    fontWeight="bold"
                    fill={isCurrent ? '#38bdf8' : '#e2e8f0'}
                    fontFamily="'Times New Roman', serif"
                  >
                    ♭
                  </text>
                )}

                {/* Notehead (oval rotated at -20 degrees as in standard engraving) */}
                <ellipse
                  cx={x}
                  cy={y}
                  rx="7.5"
                  ry="5.5"
                  transform={`rotate(-20, ${x}, ${y})`}
                  fill={noteFill}
                  stroke={noteStroke}
                  strokeWidth={isWhole ? 2.5 : isHalf ? 2.2 : 1}
                />

                {/* Vertical Stem (Not present on Whole Note / Rondo) */}
                {!isWhole && (
                  <line
                    x1={stemX}
                    y1={y}
                    x2={stemX}
                    y2={stemEndY}
                    stroke={noteStroke}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                )}

                {/* Eighth Note Flag (Croche كروش) */}
                {isEighth && (
                  <path
                    d={
                      stemDown
                        ? `M ${stemX} ${stemEndY} Q ${stemX + 8} ${stemEndY - 10} ${stemX + 12} ${stemEndY - 18}`
                        : `M ${stemX} ${stemEndY} Q ${stemX + 8} ${stemEndY + 10} ${stemX + 12} ${stemEndY + 18}`
                    }
                    fill="none"
                    stroke={noteStroke}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}

                {/* Solfege / Name Label Below Staff */}
                {showLabels && (
                  <g transform={`translate(${x}, 162)`}>
                    <text
                      x="0"
                      y="0"
                      fontSize="11"
                      fontWeight="bold"
                      fill={isCurrent ? '#38bdf8' : isPast ? '#34d399' : '#94a3b8'}
                      textAnchor="middle"
                      fontFamily="system-ui, sans-serif"
                    >
                      {arabicSolfege}
                    </text>
                    <text
                      x="0"
                      y="14"
                      fontSize="9"
                      fill={isCurrent ? '#fde047' : '#64748b'}
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {labelText}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Rhythm Name Banner for Selected Note */}
      {notes[currentIndex] && (
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">{isAr ? 'العلامة الإيقاعية:' : 'Rhythm Value:'}</span>
            <span className="font-bold text-amber-300">
              {notes[currentIndex].beats === 4
                ? (isAr ? 'رُوند (Whole / 4 أزمنة)' : 'Whole Note (4 beats)')
                : notes[currentIndex].beats === 2
                ? (isAr ? 'بلانش (Half / زمنين)' : 'Half Note (2 beats)')
                : notes[currentIndex].beats === 1
                ? (isAr ? 'نُوار (Quarter / زمن واحد)' : 'Quarter Note (1 beat)')
                : (isAr ? 'كروش (Eighth / نصف زمن)' : 'Eighth Note (0.5 beat)')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-[11px]">
            <span>{isAr ? 'زمن النغمة بالثواني:' : 'Duration:'}</span>
            <span className="font-bold">
              {((notes[currentIndex].beats * 60) / bpm).toFixed(2)}s
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
