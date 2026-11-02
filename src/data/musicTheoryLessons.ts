/**
 * Comprehensive Music Theory & Sheet Music Curriculum
 * From absolute zero (Scratch) to advanced professional levels
 * Complete with interactive diagrams, terminology, audio notes, and quizzes.
 */

export type TheoryDiagramType =
  | 'staff_lines'
  | 'clefs_comparison'
  | 'treble_notes'
  | 'bass_notes'
  | 'grand_staff'
  | 'durations_tree'
  | 'rests_table'
  | 'dotted_and_ties'
  | 'time_signature_meter'
  | 'accidentals_piano'
  | 'arabic_quarter_tones'
  | 'dynamics_meter'
  | 'tempi_gauge';

export interface TheoryKeyTerm {
  termAr: string;
  termEn: string;
  category: 'clef' | 'pitch' | 'rhythm' | 'rest' | 'accidental' | 'dynamic' | 'tempo' | 'articulation' | 'arabic';
  symbol?: string;
  defAr: string;
  defEn: string;
  pronunciationAr?: string;
  audioMidi?: number;
}

export interface TheorySection {
  id: string;
  headingAr: string;
  headingEn: string;
  paragraphsAr: string[];
  paragraphsEn: string[];
  diagramType?: TheoryDiagramType;
  diagramTitleAr?: string;
  diagramTitleEn?: string;
  audioNotes?: number[]; // MIDI notes to play reference
  bulletPointsAr?: string[];
  bulletPointsEn?: string[];
  keyTerms?: TheoryKeyTerm[];
  pedagogyTipAr?: string;
  pedagogyTipEn?: string;
}

export interface QuizQuestion {
  id: string;
  questionAr: string;
  questionEn: string;
  optionsAr: string[];
  optionsEn: string[];
  correctIndex: number;
  explanationAr: string;
  explanationEn: string;
  hintAr?: string;
  hintEn?: string;
  diagramType?: TheoryDiagramType;
  audioMidi?: number;
}

export interface TheoryLesson {
  id: string;
  levelNumber: number;
  levelBadgeAr: string;
  levelBadgeEn: string;
  titleAr: string;
  titleEn: string;
  shortDescAr: string;
  shortDescEn: string;
  durationMinutes: number;
  icon: string;
  difficulty: 'zero' | 'beginner' | 'intermediate' | 'advanced';
  sections: TheorySection[];
  quiz: QuizQuestion[];
  summaryAr: string[];
  summaryEn: string[];
}

export interface TheoryLevelUnit {
  levelNumber: number;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  icon: string;
  colorScheme: {
    accent: string;
    border: string;
    bgBadge: string;
    textBadge: string;
  };
  lessonIds: string[];
}

export const THEORY_LEVEL_UNITS: TheoryLevelUnit[] = [
  {
    levelNumber: 1,
    titleAr: 'المستوى 1: من الصفر - لغة الموسيقى والمدرج',
    titleEn: 'Unit 1: From Zero - Music Staff & Clefs',
    subtitleAr: 'المدرج ذو الخطوط الخمسة، المسافات، مفتاح صول ومفتاح فا والمدرج الكبير',
    subtitleEn: 'The 5-line stave, spaces, treble clef, bass clef & the Grand Staff',
    icon: '🎼',
    colorScheme: {
      accent: 'cyan',
      border: 'border-cyan-500/40',
      bgBadge: 'bg-cyan-500/20',
      textBadge: 'text-cyan-300',
    },
    lessonIds: ['lesson-1', 'lesson-2'],
  },
  {
    levelNumber: 2,
    titleAr: 'المستوى 2: أسماء النغمات والصولفيج على المدرج',
    titleEn: 'Unit 2: Note Names & Solfeggio Reading',
    subtitleAr: 'دو ري مي والترميز الإنجليزي C D E F G A B، ونغمات الخطوط والمسافات',
    subtitleEn: 'Solfeggio Do-Re-Mi vs C-D-E-F-G-A-B, line notes & space notes',
    icon: '🎵',
    colorScheme: {
      accent: 'indigo',
      border: 'border-indigo-500/40',
      bgBadge: 'bg-indigo-500/20',
      textBadge: 'text-indigo-300',
    },
    lessonIds: ['lesson-3', 'lesson-4'],
  },
  {
    levelNumber: 3,
    titleAr: 'المستوى 3: الأزمنة والإيقاعات والسكتات الموسيقية',
    titleEn: 'Unit 3: Note Values, Rhythms & Rests',
    subtitleAr: 'المستديرة، البيضاء، السوداء، ذات السن، وسكتاتها والنقطة الزمنية',
    subtitleEn: 'Whole, half, quarter, 8th notes, rests, dotted notes & ties',
    icon: '⏱️',
    colorScheme: {
      accent: 'amber',
      border: 'border-amber-500/40',
      bgBadge: 'bg-amber-500/20',
      textBadge: 'text-amber-300',
    },
    lessonIds: ['lesson-5', 'lesson-6'],
  },
  {
    levelNumber: 4,
    titleAr: 'المستوى 4: الميزان الموسيقي والبارات (Time Signatures)',
    titleEn: 'Unit 4: Time Signatures & Measures',
    subtitleAr: 'المازورات، موازين 4/4 و 3/4 و 2/4 والميزان المركب 6/8',
    subtitleEn: 'Measures, bar lines, simple meters (4/4, 3/4, 2/4) and compound 6/8',
    icon: '🥁',
    colorScheme: {
      accent: 'emerald',
      border: 'border-emerald-500/40',
      bgBadge: 'bg-emerald-500/20',
      textBadge: 'text-emerald-300',
    },
    lessonIds: ['lesson-7', 'lesson-8'],
  },
  {
    levelNumber: 5,
    titleAr: 'المستوى 5: علامات التحويل والسلالم والمقامات الشرقية',
    titleEn: 'Unit 5: Accidentals, Scales & Microtones',
    subtitleAr: 'الديز ♯، البيمول ♭، البيكار ♮، نصف البيمول وربع التون الشرقي',
    subtitleEn: 'Sharps, flats, naturals, quarter tones & Eastern maqamat',
    icon: '✨',
    colorScheme: {
      accent: 'purple',
      border: 'border-purple-500/40',
      bgBadge: 'bg-purple-500/20',
      textBadge: 'text-purple-300',
    },
    lessonIds: ['lesson-9', 'lesson-10'],
  },
  {
    levelNumber: 6,
    titleAr: 'المستوى 6: التعبير والديناميكية والسرعات الإيطالية',
    titleEn: 'Unit 6: Dynamics, Tempi & Expression Marks',
    subtitleAr: 'من البيانو إلى الفورتي، أليجرو، أندانتي، ليغاتو، وستييد في الأداء',
    subtitleEn: 'Piano to Forte, Allegro, Andante, Legato, Staccato & Fermata',
    icon: '🎭',
    colorScheme: {
      accent: 'rose',
      border: 'border-rose-500/40',
      bgBadge: 'bg-rose-500/20',
      textBadge: 'text-rose-300',
    },
    lessonIds: ['lesson-11', 'lesson-12'],
  },
];

export const THEORY_LESSONS: TheoryLesson[] = [
  // =========================================================================
  // LESSON 1: The 5-Line Staff & Foundations
  // =========================================================================
  {
    id: 'lesson-1',
    levelNumber: 1,
    levelBadgeAr: 'الدرس 1 · من الصفر',
    levelBadgeEn: 'Lesson 1 · From Scratch',
    titleAr: 'المدرج الموسيقي: الخطوط الخمسة والمسافات الأربع',
    titleEn: 'The Musical Staff: Five Lines & Four Spaces',
    shortDescAr: 'كيف يُمثل المدرج الموسيقي خريطة الارتفاع الصوتي، وقواعد عد الخطوط والمسافات وخطوط الإضافة.',
    shortDescEn: 'How the staff maps pitch height, counting lines and spaces from bottom to top, and ledger lines.',
    durationMinutes: 6,
    icon: '🎼',
    difficulty: 'zero',
    summaryAr: [
      'المدرج الموسيقي يتكون من 5 خطوط أفقية متوازية تفصل بينها 4 مسافات.',
      'الترقيم يبدأ دائماً من الأسفل إلى الأعلى: الخط الأول هو الأدنى والخط الخامس هو الأعلى.',
      'كلما ارتفعت النوتة للأعلى في المدرج، كان صوتها أرفع وأعلى حِدة.',
      'تُستخدم خطوط الإضافة (Ledger Lines) لكتابة النغمات التي تقع فوق المدرج أو تحته.',
    ],
    summaryEn: [
      'The musical staff consists of 5 parallel horizontal lines forming 4 spaces.',
      'Numbering always starts from the bottom: Line 1 is lowest, Line 5 is highest.',
      'The higher a note is placed on the staff, the higher its acoustic pitch.',
      'Ledger lines extend the staff for notes that sound above or below it.',
    ],
    sections: [
      {
        id: 'sec-1-1',
        headingAr: '1. ما هو المدرج الموسيقي وكيف وُلد؟',
        headingEn: '1. What is the Musical Staff and How Did It Originate?',
        paragraphsAr: [
          'الموسيقى لغة عالمية، وكما نستخدم الحروف الأبجدية لكتابة الكلمات على السطور، نستخدم "المدرج الموسيقي" (Musical Staff / Stave) لتدوين النغمات والأنغام الصوتية.',
          'تخيل المدرج الموسيقي كسُلّم تسلق: كل خط وكل مسافة يمثل درجة صوتية محددة. إذا وُضعت النوتة على درجة منخفضة، كان الصوت غليظاً وعميقاً (مثل صوت الرعد أو خرير المياه العميقة)، وإذا صعدت النوتة للأعلى، أصبح الصوت حاداً ورفيعاً (مثل تغريد الطيور أو صوت الناي الرقيق).',
        ],
        paragraphsEn: [
          'Music is a universal language. Just as we use alphabet letters on lined paper to write words, we use the musical staff (stave) to write down pitch and melody.',
          'Think of the staff as a vertical ladder: each line and space corresponds to a distinct pitch. Lower positions represent deep, bass pitches, while higher positions represent brighter, treble pitches.',
        ],
        bulletPointsAr: [
          'يتكون المدرج دائماً من 5 خطوط متوازية.',
          'بين الخطوط الخمسة توجد 4 مسافات بيضاء متساوية.',
          'العد يبدأ دائماً من الخط الأول السفلي إلى الخط الخامس العلوي.',
        ],
        bulletPointsEn: [
          'The staff always has 5 parallel horizontal lines.',
          'Between the 5 lines reside 4 equal spaces.',
          'Counting is always from bottom to top (Line 1 to Line 5).',
        ],
        diagramType: 'staff_lines',
        diagramTitleAr: 'رسم توضيحي للمدرج: الخطوط الـ 5 والمسافات الـ 4',
        diagramTitleEn: 'Staff Diagram: 5 Lines & 4 Spaces',
        audioNotes: [60, 64, 67, 72],
      },
      {
        id: 'sec-1-2',
        headingAr: '2. خطوط الإضافة (Ledger Lines) ونوتة دو الوسطى',
        headingEn: '2. Ledger Lines & Middle C (C4)',
        paragraphsAr: [
          'ماذا نفعل حينما نريد كتابة نغمة منخفضة جداً لا تسعها الخطوط الخمسة؟ هنا يتدخل ما يُعرف بـ "خطوط الإضافة" (Ledger Lines).',
          'خط الإضافة هو خط أفقي قصير مخصص لنوتة واحدة فقط، يُرسم تحت المدرج أو فوقه ليمد مداه الصوتي. أشهر نغمة على الإطلاق تستقر على خط إضافة سفلي هي نغمة "دو الوسطى" (Middle C أو C4)، وهي مركز لوحة مفاتيح البيانو وقلب النطاق الصوتي البشري.',
        ],
        paragraphsEn: [
          'What happens when we need to write notes lower or higher than the 5 lines? We use short horizontal ledger lines.',
          'A ledger line temporarily extends the staff for an individual note. The most famous ledger line note is Middle C (C4), located just below the treble staff and just above the bass staff.',
        ],
        bulletPointsAr: [
          'دو الوسطى تستقر على أول خط إضافي أسفل مفتاح صول.',
          'يمكن وضع عدة خطوط إضافة متتالية للوصول إلى أقصى درجات الحدة أو الغلظة.',
        ],
        bulletPointsEn: [
          'Middle C sits on the first ledger line below the treble staff.',
          'Multiple ledger lines can stack to reach extreme registers.',
        ],
        pedagogyTipAr: 'حيلة ذهنية: تخيل أصابع يدك الخمسة مفتوحة أفقياً؛ الإبهام هو الخط الأول، والخنصر هو الخط الخامس!',
        pedagogyTipEn: 'Mental Trick: Hold your hand flat with 5 fingers: pinky is line 1, thumb is line 5!',
      },
    ],
    quiz: [
      {
        id: 'q-1-1',
        questionAr: 'كم عدد خطوط المدرج الموسيقي وكم عدد مسافاته؟',
        questionEn: 'How many lines and spaces does the musical staff have?',
        optionsAr: [
          '5 خطوط و 4 مسافات',
          '4 خطوط و 5 مسافات',
          '6 خطوط و 5 مسافات',
          '3 خطوط و 3 مسافات',
        ],
        optionsEn: [
          '5 lines and 4 spaces',
          '4 lines and 5 spaces',
          '6 lines and 5 spaces',
          '3 lines and 3 spaces',
        ],
        correctIndex: 0,
        explanationAr: 'يتكون المدرج الموسيقي دائماً من 5 خطوط متوازية تفصل بينها 4 مسافات تُعد من الأسفل للأعلى.',
        explanationEn: 'The standard staff always has 5 lines and 4 spaces counted from bottom to top.',
      },
      {
        id: 'q-1-2',
        questionAr: 'من أي اتجاه يتم ترقيم خطوط ومسافات المدرج الموسيقي؟',
        questionEn: 'From which direction are staff lines and spaces counted?',
        optionsAr: [
          'من الأسفل إلى الأعلى دائماً',
          'من الأعلى إلى الأسفل',
          'من اليمين إلى اليسار',
          'من المنتصف نحو الأطراف',
        ],
        optionsEn: [
          'Always from bottom to top',
          'From top to bottom',
          'From right to left',
          'From center outward',
        ],
        correctIndex: 0,
        explanationAr: 'يبدأ ترقيم خطوط ومسافات المدرج الموسيقي دوماً من الخط السفلي الأول صعوداً إلى الخامس العلوي.',
        explanationEn: 'Staff lines are numbered strictly from the bottom line (1) up to the top line (5).',
      },
      {
        id: 'q-1-3',
        questionAr: 'أين تستقر نغمة "دو الوسطى" (Middle C) بالنسبة لمفتاح صول؟',
        questionEn: 'Where is Middle C located relative to the treble clef staff?',
        optionsAr: [
          'على أول خط إضافي أسفل المدرج',
          'على الخط الثالث في المنتصف',
          'في المسافة الرابعة العلوية',
          'على الخط الأول مباشرة',
        ],
        optionsEn: [
          'On the first ledger line below the staff',
          'On the third middle line',
          'In the fourth top space',
          'Directly on line 1',
        ],
        correctIndex: 0,
        explanationAr: 'تستقر نغمة دو الوسطى (C4) على أول خط إضافي قصير أسفل خطوط مفتاح صول الخمسة.',
        explanationEn: 'Middle C (C4) sits on the first short ledger line below the treble clef staff.',
        audioMidi: 60,
      },
    ],
  },

  // =========================================================================
  // LESSON 2: Clefs (Treble, Bass, and Grand Staff)
  // =========================================================================
  {
    id: 'lesson-2',
    levelNumber: 1,
    levelBadgeAr: 'الدرس 2 · المفاتيح الموسيقية',
    levelBadgeEn: 'Lesson 2 · Clefs & Grand Staff',
    titleAr: 'المفاتيح الموسيقية: مفتاح صول ومفتاح فا والمدرج الكبير',
    titleEn: 'Musical Clefs: Treble, Bass & the Grand Staff',
    shortDescAr: 'سر المفاتيح الموسيقية التي تمنح الخطوط أسماءها، وكيف يربط المدرج الكبير بين الأصوات الحادة والعميقة.',
    shortDescEn: 'The purpose of clefs in defining pitch, and how the Grand Staff connects high and low registers.',
    durationMinutes: 7,
    icon: '𝄞',
    difficulty: 'zero',
    summaryAr: [
      'المفتاح الموسيقي هو الرمز الذي يوضع في بداية المدرج ليحدد أسماء النغمات ومواقعها بدقة.',
      'مفتاح صول (Treble Clef): يلتف حول الخط الثاني ليجعله نغمة صول (G4)، مخصص للأصوات الحادة والمتوسطة.',
      'مفتاح فا (Bass Clef): تحيط نقطتاه بالخط الرابع ليجعله نغمة فا (F3)، مخصص للأصوات العميقة والباص.',
      'المدرج الكبير (Grand Staff): يجمع مفتاح صول ومفتاح فا بقوس جامع، ويفصل بينهما خط دو الوسطى.',
    ],
    summaryEn: [
      'A clef is the foundational symbol at the staff beginning that assigns pitch names to lines and spaces.',
      'Treble Clef (G Clef): Spirals around line 2, making it G4. Used for high & medium voices and treble instruments.',
      'Bass Clef (F Clef): Has two dots hugging line 4, making it F3. Used for low registers & bass instruments.',
      'The Grand Staff: Unites treble and bass staves with a brace, centered around Middle C.',
    ],
    sections: [
      {
        id: 'sec-2-1',
        headingAr: '1. لماذا نحتاج المفاتيح الموسيقية؟',
        headingEn: '1. Why Do We Need Musical Clefs?',
        paragraphsAr: [
          'الخطوط الخمسة بمفردها مجرد خطوط صامتة لا نعرف ما هي نغماتها. المفتاح الموسيقي (Clef) هو بمثابة "مفتاح الباب" الذي يفتح المعنى ويثبّت نقطة مرجعية أساسية.',
          'عندما نضع مفتاح صول، نقول للمدرج: "الخط الثاني من الأسفل هو نغمة صول!". ومن هذه النغمة المرجعية، نستطيع استنتاج كل النغمات التي فوقها وتحتها بالترتيب الأبجدي.',
        ],
        paragraphsEn: [
          'Blank staff lines without a clef are mute lines with no assigned pitches. A clef is the master key that anchors a reference note.',
          'When we draw a treble clef, its spiral identifies line 2 as G4. From that landmark, all adjacent pitches fall naturally into place.',
        ],
        diagramType: 'clefs_comparison',
        diagramTitleAr: 'مقارنة مفتاح صول (Treble) ومفتاح فا (Bass)',
        diagramTitleEn: 'Treble Clef vs Bass Clef Comparison',
      },
      {
        id: 'sec-2-2',
        headingAr: '2. مفتاح صول ومفتاح فا: الصوت الحاد والقرار العميق',
        headingEn: '2. Treble vs Bass: Treble Brilliance and Deep Resonance',
        paragraphsAr: [
          'مفتاح صول (𝄞): يُسمى أيضاً "مفتاح G". يبدأ رسمه من حلزون يدور حول الخط الثاني. يُستخدم لأصوات السوبرانو والتينور والآلات مثل الكمان، الجيتار، العود، واليد اليمنى على البيانو.',
          'مفتاح فا (𝄢): يُسمى أيضاً "مفتاح F". يبدأ بنقطة على الخط الرابع ونقطتين تحيطان به. يُستخدم لأصوات الباس والباريتون والآلات العميقة مثل التشيلو والكونترباص واليد اليسرى للبيانو.',
        ],
        paragraphsEn: [
          'Treble Clef (𝄞): Starts circling line 2. Used for soprano and tenor vocal parts, violin, oud, guitar, and the pianist’s right hand.',
          'Bass Clef (𝄢): Anchors line 4 between two dots. Used for baritone and bass vocals, cello, double bass, and the pianist’s left hand.',
        ],
        diagramType: 'grand_staff',
        diagramTitleAr: 'المدرج الكبير (Grand Staff) مع دو الوسطى في المنتصف',
        diagramTitleEn: 'The Grand Staff with Middle C as the central bridge',
        audioNotes: [53, 57, 60, 64, 67],
      },
    ],
    quiz: [
      {
        id: 'q-2-1',
        questionAr: 'حول أي خط يلتف مركز حلزون مفتاح صول (Treble Clef)؟',
        questionEn: 'Which line does the spiral of the Treble Clef circle around?',
        optionsAr: [
          'الخط الثاني من الأسفل (نغمة صول G4)',
          'الخط الأول من الأسفل',
          'الخط الرابع',
          'الخط الخامس العلوي',
        ],
        optionsEn: [
          'Line 2 from the bottom (Note G4)',
          'Line 1 from the bottom',
          'Line 4',
          'Line 5 from the top',
        ],
        correctIndex: 0,
        explanationAr: 'يلتف مركز مفتاح صول حول الخط الثاني ليجعله نغمة صول (G4).',
        explanationEn: 'The treble clef spirals around line 2, establishing it as the note G4.',
        audioMidi: 67,
      },
      {
        id: 'q-2-2',
        questionAr: 'ما هو المفتاح الموسيقي المخصص للأصوات الرجالية العميقة واليد اليسرى للبيانو؟',
        questionEn: 'Which clef is used for deep bass voices and the left hand on the piano?',
        optionsAr: [
          'مفتاح فا (Bass Clef)',
          'مفتاح صول (Treble Clef)',
          'مفتاح دو ألتو',
          'مفتاح الإيقاع',
        ],
        optionsEn: [
          'Bass Clef (F Clef)',
          'Treble Clef (G Clef)',
          'Alto Clef',
          'Percussion Clef',
        ],
        correctIndex: 0,
        explanationAr: 'مفتاح فا هو المخصص للطبقات العميقة والقرار وآلات الباص واليد اليسرى في العزف.',
        explanationEn: 'The bass clef is designated for low pitches, bass instruments, and the piano left hand.',
      },
      {
        id: 'q-2-3',
        questionAr: 'ما هي النغمة التي تشكل الجسر بين مدرج مفتاح صول ومدرج مفتاح فا في المدرج الكبير؟',
        questionEn: 'What note bridges the treble staff and the bass staff in the Grand Staff?',
        optionsAr: [
          'دو الوسطى (Middle C / C4)',
          'صول العالية (G5)',
          'لا 440 هرتز',
          'فا القرار (F2)',
        ],
        optionsEn: [
          'Middle C (C4)',
          'High G (G5)',
          'Concert A (A440)',
          'Low F (F2)',
        ],
        correctIndex: 0,
        explanationAr: 'دو الوسطى (C4) تقع في المنتصف تماماً بين المدرجين على خط إضافي واحد يصلهما.',
        explanationEn: 'Middle C (C4) sits directly between both staves on a single connecting ledger line.',
        audioMidi: 60,
      },
    ],
  },

  // =========================================================================
  // LESSON 3: Treble Staff Note Reading & Solfege
  // =========================================================================
  {
    id: 'lesson-3',
    levelNumber: 2,
    levelBadgeAr: 'الدرس 3 · قراءة النغمات',
    levelBadgeEn: 'Lesson 3 · Reading Treble Notes',
    titleAr: 'قراءة نغمات مفتاح صول: الخطوط والمسافات',
    titleEn: 'Reading Treble Staff Notes: Lines & Spaces',
    shortDescAr: 'حفظ نغمات مفتاح صول بأسرع الطرق الذهنية: مي صول سي ري فا للخطوط، وفا لا دو مي للمسافات.',
    shortDescEn: 'Master treble notes: E-G-B-D-F for lines, and F-A-C-E for spaces.',
    durationMinutes: 8,
    icon: '🎼',
    difficulty: 'beginner',
    summaryAr: [
      'نغمات الخطوط في مفتاح صول من الأسفل للأعلى: مي (E)، صول (G)، سي (B)، ري (D)، فا (F).',
      'نغمات المسافات في مفتاح صول من الأسفل للأعلى: فا (F)، لا (A)، دو (C)، مي (E) وتجمعها كلمة FACE.',
      'ترتيب السلم الطبيعي المتصاعد: دو - ري - مي - فا - صول - لا - سي - دو.',
      'التبديل بين خط ومسافة يمثل خطوة خطية صوتية ناعمة (Stepwise motion).',
    ],
    summaryEn: [
      'Treble lines from bottom to top: E - G - B - D - F (Every Good Boy Does Fine).',
      'Treble spaces from bottom to top: F - A - C - E (spells the word FACE).',
      'Ascending natural diatonic scale: C - D - E - F - G - A - B - C.',
      'Moving from a line to the adjacent space represents a 1-step musical interval.',
    ],
    sections: [
      {
        id: 'sec-3-1',
        headingAr: '1. نغمات خطوط مفتاح صول (Lines)',
        headingEn: '1. Treble Staff Line Notes',
        paragraphsAr: [
          'لحفظ نغمات الخطوط الخمسة لمفتاح صول بسهولة تامة، انظر إليها من الأسفل للأعلى:',
          '• الخط الأول: مي (E4)\n• الخط الثاني: صول (G4)\n• الخط الثالث: سي (B4)\n• الخط الرابع: ري (D5)\n• الخط الخامس: فا (F5)',
          'الجملة الموسيقية الشهيرة بالإنجليزية للحفظ: Every Good Boy Does Fine (E - G - B - D - F).',
        ],
        paragraphsEn: [
          'To memorize the 5 treble lines from bottom to top:\n• Line 1: E4\n• Line 2: G4\n• Line 3: B4\n• Line 4: D5\n• Line 5: F5',
          'Classic mnemonic: Every Good Boy Does Fine (E - G - B - D - F).',
        ],
        diagramType: 'treble_notes',
        diagramTitleAr: 'نغمات الخطوط والمسافات على مفتاح صول',
        diagramTitleEn: 'Treble Clef Notes: Lines & Spaces Map',
        audioNotes: [64, 67, 71, 74, 77],
      },
      {
        id: 'sec-3-2',
        headingAr: '2. نغمات مسافات مفتاح صول (Spaces)',
        headingEn: '2. Treble Staff Space Notes',
        paragraphsAr: [
          'المسافات الأربع بين الخطوط سهلة جداً لأنها تُشكل كلمة "FACE" بالإنجليزية:',
          '• المسافة الأولى: فا (F4)\n• المسافة الثانية: لا (A4) - وهي نغمة الدوزان العالمية 440 هرتز!\n• المسافة الثالثة: دو (C5)\n• المسافة الرابعة: مي (E5)',
        ],
        paragraphsEn: [
          'The 4 spaces spell the friendly word FACE:\n• Space 1: F4\n• Space 2: A4 (Concert pitch 440 Hz standard!)\n• Space 3: C5\n• Space 4: E5',
        ],
        pedagogyTipAr: 'إذا أردت معرفة أي نغمة، تذكر: خط، ثم مسافة، ثم خط، ثم مسافة! دو (تحت)، ري (ملامسة للخط الأول)، مي (خط 1)، فا (مسافة 1)، صول (خط 2)... وهكذا!',
        pedagogyTipEn: 'Remember the alternating ladder: Line, Space, Line, Space! E (Line 1), F (Space 1), G (Line 2)...',
        audioNotes: [65, 69, 72, 76],
      },
    ],
    quiz: [
      {
        id: 'q-3-1',
        questionAr: 'ما هي النوتة التي تستقر في المسافة الثانية من مفتاح صول؟',
        questionEn: 'Which note sits in the second space of the treble staff?',
        optionsAr: [
          'نغمة لا (A4) - نغمة الدوزان القياسية',
          'نغمة دو (C4)',
          'نغمة فا (F4)',
          'نغمة مي (E4)',
        ],
        optionsEn: [
          'Note A4 (Concert pitch 440 Hz)',
          'Note C4',
          'Note F4',
          'Note E4',
        ],
        correctIndex: 0,
        explanationAr: 'مسافات مفتاح صول تشكل F-A-C-E؛ إذن المسافة الثانية هي نغمة لا (A4).',
        explanationEn: 'The spaces spell F-A-C-E, so space 2 is Note A4.',
        audioMidi: 69,
      },
      {
        id: 'q-3-2',
        questionAr: 'ما هي نغمة الخط الأول في مفتاح صول؟',
        questionEn: 'What note is on Line 1 of the treble staff?',
        optionsAr: [
          'مي (E4)',
          'صول (G4)',
          'دو (C4)',
          'ري (D4)',
        ],
        optionsEn: [
          'E4',
          'G4',
          'C4',
          'D4',
        ],
        correctIndex: 0,
        explanationAr: 'الخط الأول الأدنى في مفتاح صول هو نغمة مي (E4).',
        explanationEn: 'Line 1 at the bottom of the treble staff is Note E4.',
        audioMidi: 64,
      },
    ],
  },

  // =========================================================================
  // LESSON 4: Bass Staff Note Reading
  // =========================================================================
  {
    id: 'lesson-4',
    levelNumber: 2,
    levelBadgeAr: 'الدرس 4 · مفتاح فا',
    levelBadgeEn: 'Lesson 4 · Bass Clef Notes',
    titleAr: 'قراءة نغمات مفتاح فا (Bass Clef)',
    titleEn: 'Reading Bass Clef Notes',
    shortDescAr: 'إتقان نغمات القرار: صول سي ري فا لا للخطوط، ولا دو مي صول للمسافات.',
    shortDescEn: 'Master bass clef: G-B-D-F-A for lines, and A-C-E-G for spaces.',
    durationMinutes: 7,
    icon: '𝄢',
    difficulty: 'beginner',
    summaryAr: [
      'خطوط مفتاح فا من الأسفل للأعلى: صول (G2)، سي (B2)، ري (D3)، فا (F3)، لا (A3).',
      'مسافات مفتاح فا من الأسفل للأعلى: لا (A2)، دو (C3)، مي (E3)، صول (G3).',
      'الجملة الإنجليزية لحفظ الخطوط: Good Boys Do Fine Always.',
      'الجملة الإنجليزية لحفظ المسافات: All Cows Eat Grass.',
    ],
    summaryEn: [
      'Bass lines from bottom to top: G - B - D - F - A (Good Boys Do Fine Always).',
      'Bass spaces from bottom to top: A - C - E - G (All Cows Eat Grass).',
      'Middle C sits on the first ledger line ABOVE the bass staff.',
    ],
    sections: [
      {
        id: 'sec-4-1',
        headingAr: '1. نغمات خطوط ومسافات مفتاح فا',
        headingEn: '1. Lines & Spaces of the Bass Clef',
        paragraphsAr: [
          'في مفتاح فا، تكون النغمات أغلظ بأوكتاف كامل تقريباً. الخط الرابع يستقر بين نقطتي المفتاح وهو نغمة فا (F3).',
          'خطوط مفتاح فا: صول (1)، سي (2)، ري (3)، فا (4)، لا (5).',
          'مسافات مفتاح فا: لا (1)، دو (2)، مي (3)، صول (4).',
        ],
        paragraphsEn: [
          'In the bass clef, notes sound roughly an octave lower. Line 4 is flanked by the two dots and represents F3.',
          'Bass Lines: G2, B2, D3, F3, A3 (Good Boys Do Fine Always).\nBass Spaces: A2, C3, E3, G3 (All Cows Eat Grass).',
        ],
        diagramType: 'bass_notes',
        diagramTitleAr: 'خريطة نغمات مفتاح فا',
        diagramTitleEn: 'Bass Clef Notes Map',
        audioNotes: [43, 47, 50, 53, 57],
      },
    ],
    quiz: [
      {
        id: 'q-4-1',
        questionAr: 'ما هي نغمة الخط الرابع في مفتاح فا (بين النقطتين)؟',
        questionEn: 'Which note is on Line 4 of the bass clef (between the two dots)?',
        optionsAr: [
          'فا (F3)',
          'صول (G3)',
          'دو (C3)',
          'لا (A3)',
        ],
        optionsEn: [
          'F3',
          'G3',
          'C3',
          'A3',
        ],
        correctIndex: 0,
        explanationAr: 'يُسمى مفتاح فا بهذا الاسم لأن الخط الرابع الواقع بين نقطتيه هو نغمة فا (F3).',
        explanationEn: 'The F clef is named so because line 4 between the two dots is Note F3.',
        audioMidi: 53,
      },
    ],
  },

  // =========================================================================
  // LESSON 5: Note Durations & The Rhythm Tree
  // =========================================================================
  {
    id: 'lesson-5',
    levelNumber: 3,
    levelBadgeAr: 'الدرس 5 · الأزمنة والإيقاع',
    levelBadgeEn: 'Lesson 5 · Note Durations',
    titleAr: 'الأشكال الزمنية للنغمات وشجرة الإيقاع',
    titleEn: 'Note Durations & The Rhythmic Tree',
    shortDescAr: 'المستديرة (4 أزمنة)، البيضاء (زمنان)، السوداء (زمن واحد)، وذات السن (نصف زمن).',
    shortDescEn: 'Whole note (4 beats), half note (2 beats), quarter note (1 beat), and eighth note (1/2 beat).',
    durationMinutes: 9,
    icon: '⏱️',
    difficulty: 'beginner',
    summaryAr: [
      'النوتة المستديرة (Whole Note / الروند): دائرة مفرغة بدون ساق، قيمتها 4 ضربات كاملة.',
      'النوتة البيضاء (Half Note / البلانش): رأس مفرغ مع ساق، قيمتها ضربتان (2).',
      'النوتة السوداء (Quarter Note / النوار): رأس مصمت مع ساق، قيمتها ضربة واحدة (1).',
      'ذات السن (Eighth Note / الكروش): رأس مصمت وساق مع راية سن، قيمتها نصف ضربة (0.5).',
      'ذات السنين (16th Note / دوبل كروش): رايتان، قيمتها ربع ضربة (0.25).',
    ],
    summaryEn: [
      'Whole Note (Semibreve): Hollow oval without stem, lasts 4 full beats.',
      'Half Note (Minim): Hollow oval with stem, lasts 2 beats.',
      'Quarter Note (Crotchet): Filled oval with stem, lasts 1 beat.',
      'Eighth Note (Quaver): Filled oval with stem and flag, lasts 1/2 beat.',
      'Sixteenth Note (Semiquaver): Two flags or beams, lasts 1/4 beat.',
    ],
    sections: [
      {
        id: 'sec-5-1',
        headingAr: '1. كيف نقيس زمن النغمة في الموسيقى؟',
        headingEn: '1. Measuring Time in Music: Beats & Durations',
        paragraphsAr: [
          'الموسيقى ليست مجرد نغمات عالية ومنخفضة، بل هي "نغمات تعيش في الزمن". مثل دقات قلب الإنسان المنتظمة، نبض الموسيقى يسمى "الضربة" أو "النبضة" (Beat).',
          'شكل رأس النوتة، وما إذا كان مفرغاً أو ممتلئاً، ووجود ساق أو رايات، هو ما يخبر العازف أو المغني: "كم من الوقت يجب أن يستمر هذا الصوت؟".',
        ],
        paragraphsEn: [
          'Music is pitch living through time. Just like a steady heartbeat, the underlying pulse of music is called the "Beat".',
          'The anatomy of a note symbol (hollow or filled head, presence of stem, flags or beams) dictates exactly how long the note sounds.',
        ],
        diagramType: 'durations_tree',
        diagramTitleAr: 'شجرة التفرع الإيقاعي لنغمات الموسيقى',
        diagramTitleEn: 'The Note Duration Pyramid Tree',
      },
      {
        id: 'sec-5-2',
        headingAr: '2. تفصيل قيم النغمات الحسابية',
        headingEn: '2. Mathematical Rhythmic Breakdown',
        paragraphsAr: [
          'تخيل رغيف خبز كامل أو بيتزا كاملة:\n• الرغيف الكامل = نوتة مستديرة (4 ضربات).\n• نصف الرغيف = نوتة بيضاء (ضربتان).\n• ربع الرغيف = نوتة سوداء (ضربة واحدة).\n• ثمن الرغيف = ذات السن (نصف ضربة).\n• جزء من 16 = ذات السنين (ربع ضربة).',
          'إذن: المستديرة الواحدة تساوي نوتتين بيضاوين، أو 4 نغمات سوداء، أو 8 نغمات ذات سن!',
        ],
        paragraphsEn: [
          'Think of note values like slicing a whole pie:\n• Whole pie = Whole Note (4 beats)\n• Half pie = Half Note (2 beats)\n• Quarter pie = Quarter Note (1 beat)\n• 1/8 slice = 8th Note (1/2 beat)\n• 1/16 slice = 16th Note (1/4 beat)',
          'Therefore: 1 Whole Note = 2 Half Notes = 4 Quarter Notes = 8 Eighth Notes!',
        ],
        bulletPointsAr: [
          'مستديرة = 4',
          'بيضاء = 2',
          'سوداء = 1',
          'ذات سن = 1/2',
          'ذات سنين = 1/4',
        ],
        bulletPointsEn: [
          'Whole = 4',
          'Half = 2',
          'Quarter = 1',
          'Eighth = 1/2',
          'Sixteenth = 1/4',
        ],
        pedagogyTipAr: 'عدّ الضربات بصوتك أثناء النقر بيدك: (وا-حد، اث-نان، ثلا-ثة، أر-بعة)!',
        pedagogyTipEn: 'Count beats aloud as you tap: (One, Two, Three, Four)!',
      },
    ],
    quiz: [
      {
        id: 'q-5-1',
        questionAr: 'كم ضربة تستمر النوتة البيضاء (Half Note) في ميزان 4/4؟',
        questionEn: 'How many beats does a Half Note receive in 4/4 time?',
        optionsAr: [
          'ضربتان (2)',
          '4 ضربات',
          'ضربة واحدة (1)',
          'نصف ضربة (0.5)',
        ],
        optionsEn: [
          '2 beats',
          '4 beats',
          '1 beat',
          '1/2 beat',
        ],
        correctIndex: 0,
        explanationAr: 'النوتة البيضاء (البلانش) تساوي زمنين كاملين (ضربتان).',
        explanationEn: 'A half note equals 2 full beats in standard meter.',
      },
      {
        id: 'q-5-2',
        questionAr: 'كم نوتة سوداء (Quarter Note) نحتاج لنساوي نوتة مستديرة واحدة (Whole Note)؟',
        questionEn: 'How many quarter notes equal one whole note?',
        optionsAr: [
          '4 نغمات سوداء (1 + 1 + 1 + 1 = 4)',
          'نوتتان سوداوان',
          '8 نغمات',
          '3 نغمات',
        ],
        optionsEn: [
          '4 quarter notes (1 + 1 + 1 + 1 = 4)',
          '2 quarter notes',
          '8 quarter notes',
          '3 quarter notes',
        ],
        correctIndex: 0,
        explanationAr: 'النوتة المستديرة = 4 ضربات، وكل نوتة سوداء = 1 ضربة، إذن نحتاج 4 نغمات سوداء.',
        explanationEn: 'A whole note is 4 beats; each quarter note is 1 beat. 4 × 1 = 4.',
      },
    ],
  },

  // =========================================================================
  // LESSON 6: Rests, Dotted Notes & Ties
  // =========================================================================
  {
    id: 'lesson-6',
    levelNumber: 3,
    levelBadgeAr: 'الدرس 6 · السكتات والمد',
    levelBadgeEn: 'Lesson 6 · Rests & Modifiers',
    titleAr: 'السكتات الموسيقية، النقطة الزمنية، وقوس الوصل',
    titleEn: 'Musical Rests, Dotted Notes & Ties',
    shortDescAr: 'فن الصمت الإيقاعي: سكتات المستديرة والبيضاء والسوداء، وقواعد النقطة الموسيقية وقوس الوصل.',
    shortDescEn: 'The art of musical silence: whole, half, and quarter rests, plus dotted notes and ties.',
    durationMinutes: 8,
    icon: '𝄽',
    difficulty: 'intermediate',
    summaryAr: [
      'السكتة الموسيقية (Rest) هي علامة صمت محسوبة بدقة في الزمن.',
      'لكل شكل نوتة سكتة مقابلة بنفس القيمة الزمنية تماماً.',
      'سكتة المستديرة (4 أزمنة): صندوق صغير يتدلى أسفل الخط الرابع.',
      'سكتة البيضاء (زمنان): صندوق صغير يجلس فوق الخط الثالث (مثل القبعة).',
      'سكتة السوداء (زمن واحد): رمز زجزاج يشبه البرق.',
      'النقطة الزمنية (Dotted Note): تضيف نصف قيمة النوتة الأصلية إليها.',
      'قوس الوصل (Tie): يربط نغمتين متطابقتين في النغمة لجمع زمنيهما معاً.',
    ],
    summaryEn: [
      'A rest represents measured, intentional silence in musical time.',
      'Every note duration has an exact corresponding rest of equal duration.',
      'Whole rest hangs below line 4 (4 beats).',
      'Half rest sits atop line 3 like a hat (2 beats).',
      'Quarter rest looks like a lightning squiggle (1 beat).',
      'A dot adds 50% of the note’s original duration to itself.',
      'A tie connects two identical notes, sustaining across them without re-attacking.',
    ],
    sections: [
      {
        id: 'sec-6-1',
        headingAr: '1. السكتات الموسيقية: الصمت الذهبي في الموسيقى',
        headingEn: '1. Musical Rests: Intentional Silence',
        paragraphsAr: [
          'قال الموسيقار العالمي موزارت: "الموسيقى ليست في النوتات فقط، بل في الصمت بين النوتات!".',
          'السكتة ليست توقفاً عن العزف أو راحة عشوائية، بل هي نبضات صامتة محسوبة بدقة مثل أي نوتة موسيقية.',
        ],
        paragraphsEn: [
          'As Mozart famously observed: "The music is not in the notes, but in the silence between them."',
          'A rest is not an idle pause; it is an active, precisely measured silence.',
        ],
        diagramType: 'rests_table',
        diagramTitleAr: 'جدول مقارنة النغمات بالسكتات المقابلة لها',
        diagramTitleEn: 'Notes vs Corresponding Rests Table',
      },
      {
        id: 'sec-6-2',
        headingAr: '2. النقطة الزمنية (Dot) وقوس الوصل (Tie)',
        headingEn: '2. The Dotted Note & The Tie',
        paragraphsAr: [
          '• النقطة الزمنية (Dotted Note): حين توضع نقطة صغيرة على يمين رأس النوتة، فإنها تضيف نصف قيمتها!\nمثال: نوتة بيضاء (2 ضربات) + نقطة (نصف الـ 2 = 1) = 3 ضربات كاملة!\nمثال: نوتة سوداء (1 ضربة) + نقطة (نصف الـ 1 = 0.5) = 1.5 ضربة.',
          '• قوس الوصل (Tie): قوس منحني يصل بين رأس نغمتين متطابقتين تماماً في الطبقة الصوتية. بدلاً من عزف النغمة مرتين، تعزف الأولى وتمد الصوت طوال مدة النغمتين معاً!',
        ],
        paragraphsEn: [
          '• The Dot: Placed immediately after a note head, adds half of its original value.\nExample: Dotted Half Note = 2 + 1 = 3 beats.\nExample: Dotted Quarter Note = 1 + 0.5 = 1.5 beats.',
          '• The Tie: A curved line linking two notes of the identical pitch. The sound continues across both values without re-striking.',
        ],
        diagramType: 'dotted_and_ties',
        diagramTitleAr: 'أثر النقطة الزمنية وقوس الوصل',
        diagramTitleEn: 'Dotted Notes and Ties Visual Explanation',
      },
    ],
    quiz: [
      {
        id: 'q-6-1',
        questionAr: 'كم ضربة تستمر النوتة البيضاء المنقوطة (Dotted Half Note)؟',
        questionEn: 'How many beats does a Dotted Half Note receive?',
        optionsAr: [
          '3 ضربات (2 الأصلية + 1 نصف القيمة = 3)',
          '4 ضربات',
          '2 ضربات ونصف',
          'ضربة واحدة',
        ],
        optionsEn: [
          '3 beats (2 original + 1 half value = 3)',
          '4 beats',
          '2.5 beats',
          '1 beat',
        ],
        correctIndex: 0,
        explanationAr: 'البيضاء = 2، والنقطة تضيف نصفها (1)، فيصبح المجموع 3 ضربات كاملة.',
        explanationEn: 'Half note = 2; dot adds half (1), totaling 3 full beats.',
      },
    ],
  },

  // =========================================================================
  // LESSON 7: Time Signatures & Measures
  // =========================================================================
  {
    id: 'lesson-7',
    levelNumber: 4,
    levelBadgeAr: 'الدرس 7 · الميزان الموسيقي',
    levelBadgeEn: 'Lesson 7 · Time Signatures',
    titleAr: 'الميزان الموسيقي والبارات (4/4, 3/4, 2/4)',
    titleEn: 'Time Signatures & Measures (4/4, 3/4, 2/4)',
    shortDescAr: 'فهم الرقم العلوي والرقم السفلي في الميزان، والمازورات، وميزان الفالس والمارش.',
    shortDescEn: 'Decoding the top and bottom numbers in meter, measure bar lines, waltz & march time.',
    durationMinutes: 9,
    icon: '🥁',
    difficulty: 'intermediate',
    summaryAr: [
      'الميزان الموسيقي (Time Signature) يُكتب في بداية القطعة برقمين أحدهما فوق الآخر.',
      'الرقم العلوي: يحدد عدد الضربات (النبضات) داخل كل مازورة (بار).',
      'الرقم السفلي: يحدد شكل النوتة التي تعادل ضربة واحدة (4 تعني نوتة سوداء Quarter note).',
      'ميزان 4/4 (Common Time): يحتوي على 4 ضربات سوداء في كل مازورة، وهو الميزان الأكثر شيوعاً.',
      'ميزان 3/4: ميزان الفالس الثلاثي (دم تك تك).',
      'ميزان 2/4: ميزان المارش العسكري والإيقاعات السريعة.',
    ],
    summaryEn: [
      'Time signatures appear at the start of music as two stacked numbers.',
      'Top number: specifies how many beats occur per measure.',
      'Bottom number: indicates which note value represents one beat (4 = quarter note).',
      '4/4 (Common Time): 4 quarter note beats per measure.',
      '3/4 (Triple Meter): 3 beats per measure (waltz feel: Strong-weak-weak).',
      '2/4 (Duple Meter): 2 beats per measure (march feel: Left-Right).',
    ],
    sections: [
      {
        id: 'sec-7-1',
        headingAr: '1. لغز الرقمين في الميزان الموسيقي',
        headingEn: '1. The Secret of the Two Stacked Numbers',
        paragraphsAr: [
          'حين تنظر إلى بداية النوتة، ستجد رقمين مثل 4/4 أو 3/4. إليك القاعدة الذهبية لفك رموزهما:\n• الرقم العلوي (Top Number): "كم ضربة في الصندوق؟" (3 تعني 3 ضربات، 4 تعني 4 ضربات).\n• الرقم السفلي (Bottom Number): "ما هو نوع النوتة؟" (الرقم 4 يعني نوتة سوداء ربعية).',
          'خطوط البار (Bar Lines) تقسم المدرج إلى صناديق متساوية تسمى "مازورات" (Measures). لا يمكن لمازورة في ميزان 4/4 أن تحتوي على أكثر أو أقل من 4 ضربات!',
        ],
        paragraphsEn: [
          'At the beginning of sheet music, two numbers appear stacked:\n• Top Number: "How many beats in each box?" (3 means 3 beats, 4 means 4 beats).\n• Bottom Number: "What note gets one beat?" (4 signifies the quarter note).',
          'Vertical bar lines divide the staff into equal cells called measures. In 4/4 time, every measure must add up to exactly 4 beats.',
        ],
        diagramType: 'time_signature_meter',
        diagramTitleAr: 'تشريح موازين 4/4 و 3/4 و 2/4',
        diagramTitleEn: 'Anatomy of 4/4, 3/4 and 2/4 Time Signatures',
      },
    ],
    quiz: [
      {
        id: 'q-7-1',
        questionAr: 'ماذا يعني الرقم العلوي في الميزان الموسيقي؟',
        questionEn: 'What does the top number in a time signature indicate?',
        optionsAr: [
          'عدد الضربات في كل مازورة (بار)',
          'نوع النوتة المستخدمة',
          'سرعة العزف بالمترونوم',
          'عدد العازفين في الفرقة',
        ],
        optionsEn: [
          'The number of beats per measure',
          'The type of note',
          'The tempo in BPM',
          'The number of musicians',
        ],
        correctIndex: 0,
        explanationAr: 'الرقم العلوي يحدد بدقة عدد الضربات التي يجب أن تحتويها كل مازورة.',
        explanationEn: 'The top number strictly specifies how many beats fit into each measure.',
      },
      {
        id: 'q-7-2',
        questionAr: 'أي ميزان من الموازين التالية يُعرف بميزان "الفالس" الثلاثي؟',
        questionEn: 'Which of the following meters is known as the "Waltz" meter?',
        optionsAr: [
          'ميزان 3/4 (3 ضربات في المازورة)',
          'ميزان 4/4',
          'ميزان 2/4',
          'ميزان 5/4',
        ],
        optionsEn: [
          '3/4 meter (3 beats per measure)',
          '4/4 meter',
          '2/4 meter',
          '5/4 meter',
        ],
        correctIndex: 0,
        explanationAr: 'ميزان 3/4 هو ميزان الفالس الكلاسيكي الشهير (دم تك تك / ضربة قوية واثنتان ضعيفتان).',
        explanationEn: '3/4 is the quintessential waltz time signature (ONE-two-three, ONE-two-three).',
      },
    ],
  },

  // =========================================================================
  // LESSON 8: Compound Meter & 6/8
  // =========================================================================
  {
    id: 'lesson-8',
    levelNumber: 4,
    levelBadgeAr: 'الدرس 8 · الموازين المركبة',
    levelBadgeEn: 'Lesson 8 · Compound 6/8 Meter',
    titleAr: 'الموازين المركبة وإيقاع 6/8 في الموسيقى العربية والعالمية',
    titleEn: 'Compound Meters & 6/8 in Arab & World Music',
    shortDescAr: 'الفرق بين التقسيم الثنائي البسيط والتقسيم الثلاثي المركب، وإيقاعات الدارج والجورجينا.',
    shortDescEn: 'Simple vs compound pulse division, feeling the two dotted-quarter pulses of 6/8.',
    durationMinutes: 8,
    icon: '🪘',
    difficulty: 'intermediate',
    summaryAr: [
      'في الميزان البسيط، تنقسم الضربة إلى اثنتين (1 و 2 و).',
      'في الميزان المركب (مثل 6/8)، تنقسم الضربة الرئيسية إلى 3 أجزاء متساوية (1-2-3، 4-5-6).',
      'ميزان 6/8 يُعزف عملياً كنبضتين رئيسيتين كبيرتين، كل نبضة تساوي نوتة سوداء منقوطة.',
      'ميزان 6/8 واسع الانتشار في التراث العربي (إيقاع الجورجينا، الدارج المغربي، والسامبا والبلوز).',
    ],
    summaryEn: [
      'In simple meter, each beat divides into 2 equal parts.',
      'In compound meter (e.g. 6/8), each main beat divides into 3 micro-pulses (1-2-3, 4-5-6).',
      '6/8 is felt musically in 2 dotted-quarter pulses.',
      'Pervasive in Arabic heritage (Jorjina, Darej) as well as global Celtic and blues music.',
    ],
    sections: [
      {
        id: 'sec-8-1',
        headingAr: '1. سحر ميزان 6/8 والنبض المتمايل',
        headingEn: '1. The Swaying Magic of 6/8 Compound Time',
        paragraphsAr: [
          'في ميزان 6/8، الرقم 6 يعني وجود 6 نغمات ذات سن (كروش) في المازورة، ولكن في الأداء العملي تشعر بنبضتين متمايلتين مثل قارب فوق الأمواج:\n• النبضة الأولى تضم: 1 - 2 - 3\n• النبضة الثانية تضم: 4 - 5 - 6',
          'هذا التدفق الثلاثي المتكرر يعطي شعوراً دافئاً بالانسيابية والرقص الموسيقي.',
        ],
        paragraphsEn: [
          'In 6/8, the 6 signifies 6 eighth notes per measure, but musicians feel it as two swaying macro-beats:\n• Beat 1: 1 - 2 - 3\n• Beat 2: 4 - 5 - 6',
          'This creates an energetic, rolling, buoyant groove.',
        ],
      },
    ],
    quiz: [
      {
        id: 'q-8-1',
        questionAr: 'كم نبضة رئيسية يشعر بها العازف أو المغني في ميزان 6/8؟',
        questionEn: 'How many main macro-beats are typically felt in 6/8 compound meter?',
        optionsAr: [
          'نبضتان رئيسيتان (كل نبضة تضم 3 كروش)',
          '6 نبضات ثقيلة منفصلة',
          '4 نبضات',
          'نبضة واحدة فقط',
        ],
        optionsEn: [
          '2 main macro-beats (each grouping 3 eighth notes)',
          '6 heavy separate pulses',
          '4 beats',
          'Only 1 beat',
        ],
        correctIndex: 0,
        explanationAr: 'في ميزان 6/8، يجمع العازف كل 3 كروش في نبضة سوداء منقوطة، فيكون الإحساس بنبضتين رئيستين.',
        explanationEn: 'Musicians feel 6/8 as two dotted-quarter beats, each containing 3 eighth-note pulses.',
      },
    ],
  },

  // =========================================================================
  // LESSON 9: Accidentals (Sharps, Flats & Naturals)
  // =========================================================================
  {
    id: 'lesson-9',
    levelNumber: 5,
    levelBadgeAr: 'الدرس 9 · علامات التحويل',
    levelBadgeEn: 'Lesson 9 · Accidentals',
    titleAr: 'علامات التحويل: الديز (♯)، البيمول (♭)، والبيكار (♮)',
    titleEn: 'Accidentals: Sharps (♯), Flats (♭) & Naturals (♮)',
    shortDescAr: 'أنصاف الأبعاد، المفاتيح السوداء على البيانو، وكيف تغير علامات التحويل حِدة النوتة.',
    shortDescEn: 'Semitones, black keys on the piano, and how accidentals alter musical pitch.',
    durationMinutes: 9,
    icon: '♯',
    difficulty: 'intermediate',
    summaryAr: [
      'نصف البعد (Semitone / Half step) هو أصغر مسافة موسيقية في النظام الغربي القياسي (مفتاحان متجاوران مباشرة على البيانو).',
      'علامة الديز (Sharp ♯): ترفع النغمة نصف بعد للأعلى نحو اليمين.',
      'علامة البيمول (Flat ♭): تخفض النغمة نصف بعد للأسفل نحو اليسار.',
      'علامة البيكار (Natural ♮): تُلغي تأثير الديز أو البيمول وتعيد النوتة إلى حالتها الأصلية الطبيعية.',
      'النغمات المترادفة (Enharmonic): نغمتان بنفس الصوت تماماً ولكن باسمين مختلفين، مثل دو ديز (C#) و ري بيمول (D♭).',
    ],
    summaryEn: [
      'A semitone (half step) is the smallest interval in standard Western 12-TET tuning.',
      'Sharp (♯): Raises a note by one half step upward.',
      'Flat (♭): Lowers a note by one half step downward.',
      'Natural (♮): Cancels any preceding sharp or flat, restoring the natural pitch.',
      'Enharmonic Equivalents: Two different note names sharing the exact same acoustic pitch (e.g., C♯ and D♭).',
    ],
    sections: [
      {
        id: 'sec-9-1',
        headingAr: '1. المفاتيح البيضاء والسوداء وأنصاف الأبعاد',
        headingEn: '1. White & Black Piano Keys and Semitones',
        paragraphsAr: [
          'إذا نظرت إلى لوحة مفاتيح البيانو، ستجد مفاتيح بيضاء ومفاتيح سوداء. الانتقال من أي مفتاح إلى المفتاح المجاور له مباشرة (سواء كان أبيض أو أسود) هو "نصف بُعد" (Half step / Semitone).',
          'بين دو و ري يوجد مفتاح أسود (بُعد كامل). لكن بين مي وفا، وبين سي ودو، لا يوجد مفتاح أسود يفصل بينهما! المسافة بين مي وفا هي نصف بعد طبيعي أصلي.',
        ],
        paragraphsEn: [
          'On a piano keyboard, moving to the very next adjacent key (black or white) is a semitone (half step).',
          'Notice that between E and F, and between B and C, there is NO black key! They are naturally spaced a half step apart.',
        ],
        diagramType: 'accidentals_piano',
        diagramTitleAr: 'مخطط المفاتيح السوداء وعلامات التحويل ♯ و ♭',
        diagramTitleEn: 'Piano Keyboard Accidentals & Enharmonics',
        audioNotes: [60, 61, 62, 63, 64],
      },
      {
        id: 'sec-9-2',
        headingAr: '2. قواعد سريان علامة التحويل في المازورة',
        headingEn: '2. Accidental Rules within a Measure',
        paragraphsAr: [
          'حين تظهر علامة الديز أو البيمول أمام نغمة داخل المازورة، فإنها تظل سارية على كل النغمات المتشابهة في نفس المازورة فقط، حتى ينتهي خط البار!',
          'إذا أردت إلغاء الديز قبل نهاية المازورة، تضع علامة "البيكار" (♮) أمام النوتة.',
        ],
        paragraphsEn: [
          'When an accidental appears before a note in a measure, it remains active for that same pitch for the rest of that measure only, until the bar line.',
          'To cancel an accidental early within that measure, a natural sign (♮) is explicitly placed.',
        ],
      },
    ],
    quiz: [
      {
        id: 'q-9-1',
        questionAr: 'ماذا تفعل علامة الديز (♯) عند وضعها أمام النغمة؟',
        questionEn: 'What does a sharp (♯) accidental do to a note?',
        optionsAr: [
          'ترفع النغمة نصف بعد للأعلى',
          'تخفض النغمة نصف بعد للأسفل',
          'تزيد زمن النغمة للضعف',
          'تلغي النغمة وتجعلها صامتة',
        ],
        optionsEn: [
          'Raises the pitch by one half step',
          'Lowers the pitch by one half step',
          'Doubles the duration',
          'Mutes the note',
        ],
        correctIndex: 0,
        explanationAr: 'علامة الديز (Sharp) ترفع النغمة نصف درجة صوتية (نصف بعد) للأعلى.',
        explanationEn: 'A sharp raises the pitch of a note by one half step (semitone).',
        audioMidi: 61,
      },
      {
        id: 'q-9-2',
        questionAr: 'ما هي وظيفة علامة البيكار (Natural ♮)؟',
        questionEn: 'What is the function of the natural sign (♮)?',
        optionsAr: [
          'إلغاء أثر الديز أو البيمول وإعادة النغمة لطبيعتها',
          'خفض النغمة بمقدار بعد كامل',
          'جعل النغمة تعزف بسرعة شديدة',
          'تكرار المازورة مرتين',
        ],
        optionsEn: [
          'Cancels preceding sharps or flats, restoring natural pitch',
          'Lowers the pitch by a whole step',
          'Plays the note very fast',
          'Repeats the measure',
        ],
        correctIndex: 0,
        explanationAr: 'علامة البيكار تحيد أي تعديل سابق وتعيد النغمة بيضاء طبيعية.',
        explanationEn: 'The natural sign cancels any preceding accidental on that pitch.',
      },
    ],
  },

  // =========================================================================
  // LESSON 10: Arabic Quarter Tones & Maqamat
  // =========================================================================
  {
    id: 'lesson-10',
    levelNumber: 5,
    levelBadgeAr: 'الدرس 10 · المقامات والربع تون',
    levelBadgeEn: 'Lesson 10 · Microtones & Maqam',
    titleAr: 'علامات الربع تون والمقامات الموسيقية الشرقية',
    titleEn: 'Quarter Tones & Arabic Maqamat Notation',
    shortDescAr: 'نصف البيمول (السيكاه)، ونصف الديز، وسر شجن وتطريب المقامات العربية (البياتي، الرست، الهزام).',
    shortDescEn: 'Half-flat, half-sharp, and the evocative microtonal soul of Arabic Maqamat (Bayati, Rast).',
    durationMinutes: 10,
    icon: '🪕',
    difficulty: 'advanced',
    summaryAr: [
      'الموسيقى العربية الشرقية تحتوي على مسافات نغمية دقيقة جداً تسمى "أرباع التون" (Quarter tones / 50 cents).',
      'علامة نصف البيمول (Half Flat / د المقلوبة): تخفض النغمة ربع بعد صوتي فقط (50 سنت).',
      'علامة نصف الديز (Half Sharp): ترفع النغمة ربع بعد صوتي للأعلى.',
      'مقام الرست يبدأ من دو ويحتوي على مي نصف بيمول وسي نصف بيمول.',
      'مقام البياتي يبدأ من ري ويحتوي على مي نصف بيمول.',
    ],
    summaryEn: [
      'Arabic music possesses rich microtonal intervals called quarter tones (50 cents).',
      'Half-flat (Arabic Sikah mark): Lowers the note by 25-50 cents (quarter step).',
      'Half-sharp: Raises the note by a quarter step.',
      'Maqam Rast tonicizes C with E-half-flat and B-half-flat.',
      'Maqam Bayati tonicizes D with its characteristic E-half-flat signature.',
    ],
    sections: [
      {
        id: 'sec-10-1',
        headingAr: '1. ما هو ربع التون ولماذا يميز الموسيقى العربية؟',
        headingEn: '1. What is a Quarter Tone and Why is it Essential to Arabic Music?',
        paragraphsAr: [
          'في الموسيقى الغربية الكلاسيكية، يقسم البعد الكامل إلى نصفين فقط. أما في الموسيقى العربية والشرقية، فقد قسّم الفلاسفة والموسيقيون (مثل الفارابي والكندي وصفي الدين الأرموي) البعد إلى أجزاء أدق، مما أتاح مسافات ساحرة مثل ربع التون والكوما.',
          'علامة نصف البيمول تُرسم كحرف (b مقلوب) أو علامة بيمول مع شرطة مائلة. حين تطبق على نغمة "مي" في مقام البياتي، تصبح نغمة دافئة شجية لا تجدها على مفاتيح البيانو الغربي التقليدي!',
        ],
        paragraphsEn: [
          'While standard Western music divides the whole step into 2 semitones, Arabic musical tradition divides tones into microtonal intervals (quarter tones, ~50 cents).',
          'The half-flat accidental lowers a pitch by one quarter-tone. On Note E in Maqam Bayati, it creates the evocative, soul-stirring resonance unique to Eastern music.',
        ],
        diagramType: 'arabic_quarter_tones',
        diagramTitleAr: 'مقارنة علامات ربع التون والمسافات الشرقية',
        diagramTitleEn: 'Quarter Tone Symbols & Eastern Maqamat Scale Intervals',
      },
    ],
    quiz: [
      {
        id: 'q-10-1',
        questionAr: 'كم مقدار الخفض الذي تحدثه علامة "نصف البيمول" الشرقية؟',
        questionEn: 'How much does the Arabic "half-flat" accidental lower a pitch?',
        optionsAr: [
          'ربع بعد صوتي (حوالي 50 سنت)',
          'نصف بعد صوتي كامل',
          'بعدان كاملان',
          'أوكتاف كامل',
        ],
        optionsEn: [
          'A quarter-step (~50 cents)',
          'A full semitone',
          'Two whole steps',
          'A full octave',
        ],
        correctIndex: 0,
        explanationAr: 'علامة نصف البيمول تخفض النغمة ربع تون (50 سنت تقريباً) وهي مفتاح مقامات البياتي والرست.',
        explanationEn: 'The half-flat symbol lowers pitch by approximately 50 cents (one quarter-tone).',
      },
    ],
  },

  // =========================================================================
  // LESSON 11: Dynamics & Acoustic Intensity
  // =========================================================================
  {
    id: 'lesson-11',
    levelNumber: 6,
    levelBadgeAr: 'الدرس 11 · التعبير والديناميكية',
    levelBadgeEn: 'Lesson 11 · Musical Dynamics',
    titleAr: 'ديناميكية الصوت وشدة التعبير (من pp إلى ff)',
    titleEn: 'Dynamics & Expressive Intensity (pp to ff)',
    shortDescAr: 'المصطلحات الإيطالية للشدة: بيانِسيمو، بيانو، فورتي، فورتِسيمو، والكريشيندو.',
    shortDescEn: 'Italian dynamics: Pianissimo, Piano, Mezzo, Forte, Fortissimo, and Crescendo.',
    durationMinutes: 8,
    icon: '🔉',
    difficulty: 'advanced',
    summaryAr: [
      'الديناميكية (Dynamics) تشير إلى درجة شدة وقوة الصوت أثناء الأداء.',
      'Pianissimo (pp): هادئ وخافت جداً.',
      'Piano (p): هادئ ورقيق.',
      'Mezzo Piano (mp): متوسط الهدوء.',
      'Mezzo Forte (mf): متوسط القوة.',
      'Forte (f): قوي وواضح.',
      'Fortissimo (ff): قوي وهدار جداً.',
      'Crescendo (<): التدرج التدريجي من الهدوء إلى القوة.',
      'Decrescendo / Diminuendo (>): التدرج من القوة إلى الهدوء.',
    ],
    summaryEn: [
      'Dynamics dictate the volume and energetic intensity of music.',
      'pp (Pianissimo): Very soft.',
      'p (Piano): Soft.',
      'mp (Mezzo-piano): Moderately soft.',
      'mf (Mezzo-forte): Moderately loud.',
      'f (Forte): Loud.',
      'ff (Fortissimo): Very loud.',
      'Crescendo (<): Gradually getting louder.',
      'Decrescendo (>): Gradually getting softer.',
    ],
    sections: [
      {
        id: 'sec-11-1',
        headingAr: '1. سلم درجات الشدة الصوتية في الموسيقى',
        headingEn: '1. The Dynamic Ladder of Sound Intensity',
        paragraphsAr: [
          'الموسيقى دون تباين ديناميكي تشبه قراءة نص كامل بنبرة صوت آلية واحدة ومملة. الديناميكية هي روح المشاعر: الهمس الحنون، ثم التدرج حتى الانفجار الصوتي المهيب!',
          'استخدم الموسيقيون مصطلحات اللغة الإيطالية منذ عصر النهضة لأنها أصبحت لغة التدوين العالمية.',
        ],
        paragraphsEn: [
          'Music without dynamics sounds like a flat robotic voice. Dynamics infuse emotional color: from an intimate whisper to a thunderous climax.',
          'Italian terms became the universal standard for musical notation across all continents.',
        ],
        diagramType: 'dynamics_meter',
        diagramTitleAr: 'مؤشر درجات الديناميكية الصوتية من pp إلى ff',
        diagramTitleEn: 'Dynamic Volume Ladder Gauge (pp to ff)',
      },
    ],
    quiz: [
      {
        id: 'q-11-1',
        questionAr: 'ماذا يعني مصطلح فورتي (Forte - f) في النوتة الموسيقية؟',
        questionEn: 'What does the term Forte (f) indicate in sheet music?',
        optionsAr: [
          'العزف أو الغناء بقوة وجهارة',
          'العزف بهدوء شديد وهمس',
          'التوقف التام عن العزف',
          'تسريع الإيقاع',
        ],
        optionsEn: [
          'Singing or playing loudly with strong projection',
          'Very soft whisper',
          'Complete silence',
          'Speeding up the tempo',
        ],
        correctIndex: 0,
        explanationAr: 'كلمة Forte الإيطالية تعني قوي (Loud)، وترمز إلى الأداء بجهارة ووضوح صوتي قوي.',
        explanationEn: 'Forte is Italian for strong/loud, directing the performer to project with full intensity.',
      },
      {
        id: 'q-11-2',
        questionAr: 'ما هو معنى علامة "الكيرشيندو" (Crescendo <)؟',
        questionEn: 'What is the meaning of a Crescendo (<) hairpin mark?',
        optionsAr: [
          'الارتفاع التدريجي في قوة الصوت من الهدوء إلى القوة',
          'الهبوط التدريجي في شدة الصوت حتى الهمس',
          'إيقاف العزف فوراً',
          'إعادة النغمة السابقة',
        ],
        optionsEn: [
          'Gradually increasing volume from soft to loud',
          'Gradually decreasing volume',
          'Instant silence',
          'Repeat previous note',
        ],
        correctIndex: 0,
        explanationAr: 'الكيرشيندو يعني الصعود والنمو التدريجي في قوة الصوت من الهدوء نحو القوة.',
        explanationEn: 'Crescendo signifies a gradual swell and increase in acoustic loudness.',
      },
    ],
  },

  // =========================================================================
  // LESSON 12: Tempi, Articulations & Advanced Expressive Terms
  // =========================================================================
  {
    id: 'lesson-12',
    levelNumber: 6,
    levelBadgeAr: 'الدرس 12 · السرعات والأداء',
    levelBadgeEn: 'Lesson 12 · Tempi & Articulations',
    titleAr: 'مصطلحات السرعات الإيطالية وطرق الأداء الفني (Articulations)',
    titleEn: 'Italian Tempo Markings & Expressive Articulations',
    shortDescAr: 'أليجرو، أندانتي، لارغو، بريستو، وطرق العزف كالليغاتو المتصل والستيكاتو المتقطع والفرماتا.',
    shortDescEn: 'Allegro, Andante, Largo, Presto, plus performance styles: Legato, Staccato, and Fermata.',
    durationMinutes: 9,
    icon: '🎭',
    difficulty: 'advanced',
    summaryAr: [
      'مصطلح السرعة (Tempo) يحدد سرعة تدفق الضربات بالمترونوم (BPM).',
      'Largo (بطيء جداً وهادئ وقور: 40-60 BPM).',
      'Adagio (هادئ مسترسل: 66-76 BPM).',
      'Andante (بسرعة المشي المعتدل: 76-108 BPM).',
      'Moderato (متوسط السرعة: 108-120 BPM).',
      'Allegro (سريع، مبهج، وحيوي: 120-156 BPM).',
      'Presto (سريع جداً وعاصف: 168-200 BPM).',
      'Legato: ربط النغمات بسلاسة دون فواصل.',
      'Staccato (نقطة فوق رأس النوتة): تقطيع النغمات بخفة وتطاير.',
      'Fermata (قوس ونقطة فوق النوتة): تمديد النوتة ووقفة تأملية حرة.',
    ],
    summaryEn: [
      'Tempo marks define the speed of beats measured in BPM.',
      'Largo: Very slow, broad and stately (40-60 BPM).',
      'Adagio: Slow and leisurely (66-76 BPM).',
      'Andante: Walking tempo, graceful motion (76-108 BPM).',
      'Moderato: Moderate pace (108-120 BPM).',
      'Allegro: Fast, bright, joyful (120-156 BPM).',
      'Presto: Very fast, fiery rush (168-200 BPM).',
      'Legato: Smooth, unbroken, connected phrasing.',
      'Staccato (dot over note): Short, crisp, detached articulation.',
      'Fermata (bird’s eye): Note held beyond its normal written duration.',
    ],
    sections: [
      {
        id: 'sec-12-1',
        headingAr: '1. مقياس السرعات الموسيقية الإيطالية بالمترونوم',
        headingEn: '1. The Italian Tempo Spectrum & Metronome BPM',
        paragraphsAr: [
          'المصطلحات الإيطالية للسرعة لا تصف مجرد أرقام جافة على المترونوم، بل تصف "الحالة الشعورية" للقطعة:\n• Largo: هيبة ووقار بطيء كالمحيط الهادئ.\n• Andante: مشية إنسان مسترخي في نزهة لطيفة.\n• Allegro: بهجة وفرح وحيوية متدفقة.\n• Presto: حماس وسباق خاطف!',
        ],
        paragraphsEn: [
          'Italian tempo terms describe emotional states as much as metronome beats:\n• Largo: Broad, solemn grandeur.\n• Andante: Graceful walking pace.\n• Allegro: Joyful, lively, energetic forward motion.\n• Presto: Rapid, breathtaking momentum.',
        ],
        diagramType: 'tempi_gauge',
        diagramTitleAr: 'مقياس السرعات الإيطالية والمترونوم (Largo to Presto)',
        diagramTitleEn: 'Italian Tempi Metronome Speedometer',
      },
      {
        id: 'sec-12-2',
        headingAr: '2. طرق الأداء التعبيري (Articulations)',
        headingEn: '2. Articulation Marks: Legato, Staccato & Fermata',
        paragraphsAr: [
          '• ليغاتو (Legato): خط منحني طويل يربط جملة نغمات مختلفة ليعني: "اعزف أو غنِّ هذه النغمات متصلة بماء واحد دون تقطيع".',
          '• ستيكاتو (Staccato): نقطة صغيرة توضع مباشرة فوق أو تحت رأس النوتة، تعني: "اقطع النوتة بخفة، واجعلها قصيرة ومفصولة عن التي تليها".',
          '• فرماتا (Fermata): رمز يشبه "عين الصقر" (قوس فوقه نقطة)، يعني: "أوقف الوقت! مد هذه النغمة بقدر ما يمليه إحساسك الموسيقي قبل المتابعة".',
        ],
        paragraphsEn: [
          '• Legato: A slur line connecting different pitches instructing a seamless, flowing stream of sound.',
          '• Staccato: A dot above or below the note head commanding a crisp, shortened, detached delivery.',
          '• Fermata: The iconic "bird’s eye" symbol pausing the regular tempo to sustain the note dramatically.',
        ],
      },
    ],
    quiz: [
      {
        id: 'q-12-1',
        questionAr: 'ماذا تعني نقطة الستيكاتو (Staccato) الموضوعة فوق رأس النوتة؟',
        questionEn: 'What does a staccato dot placed above a note head signify?',
        optionsAr: [
          'أداء النغمة بشكل مقطوع وقصير وخفيف',
          'أداء النغمة متصلة وممتدة',
          'رفع النغمة نصف بعد للأعلى',
          'خفض سرعة الأغنية',
        ],
        optionsEn: [
          'Play or sing the note short, crisp and detached',
          'Perform smoothly and connected',
          'Raise pitch by a half step',
          'Slow down the tempo',
        ],
        correctIndex: 0,
        explanationAr: 'الستيكاتو تعني فصل وتقطيع النغمة لتصبح رشيقة وقصيرة وغير متصلة بما بعدها.',
        explanationEn: 'Staccato commands the performer to detach the note cleanly, making it crisp and brief.',
      },
      {
        id: 'q-12-2',
        questionAr: 'ما هو الرمز الموسيقي الشهير الذي يطلب من العازف تعليق النوتة ومدها حراً (وقفة حرة)؟',
        questionEn: 'What is the musical symbol directing the performer to hold a note indefinitely?',
        optionsAr: [
          'الفرماتا (Fermata - عين الصقر)',
          'الديز',
          'السكتة',
          'المدرج',
        ],
        optionsEn: [
          'Fermata (bird’s eye symbol)',
          'Sharp',
          'Rest',
          'Staff',
        ],
        correctIndex: 0,
        explanationAr: 'الفرماتا تمنح العازف أو قائد الأوركسترا حرية تعليق وتمديد النغمة فوق وقتها الطبيعي قبل المتابعة.',
        explanationEn: 'A fermata invites the performer or conductor to sustain the note dramatically.',
      },
    ],
  },
];

// ===========================================================================
// MUSICAL TERMS GLOSSARY
// ===========================================================================

export const MUSICAL_TERMS_GLOSSARY: TheoryKeyTerm[] = [
  {
    termAr: 'المدرج الموسيقي',
    termEn: 'Staff / Stave',
    category: 'clef',
    symbol: '🎼',
    defAr: 'مجموعة من خمسة خطوط أفقية متوازية تفصل بينها أربع مسافات يُكتب عليها الرموز الموسيقية.',
    defEn: 'A set of five parallel horizontal lines and four spaces used to notate musical pitches.',
  },
  {
    termAr: 'مفتاح صول',
    termEn: 'Treble Clef (G Clef)',
    category: 'clef',
    symbol: '𝄞',
    defAr: 'المفتاح الموسيقي الذي يلتف حول الخط الثاني ليجعله نغمة صول (G4)، مخصص للأصوات الحادة.',
    defEn: 'Clef spiraling around the second staff line (G4), used for higher registers and voices.',
    audioMidi: 67,
  },
  {
    termAr: 'مفتاح فا',
    termEn: 'Bass Clef (F Clef)',
    category: 'clef',
    symbol: '𝄢',
    defAr: 'المفتاح الموسيقي المخصص للأصوات والآلات العميقة، وتحيط نقطتاه بالخط الرابع (F3).',
    defEn: 'Clef designated for lower pitches, with two dots flanking line 4 (F3).',
    audioMidi: 53,
  },
  {
    termAr: 'المدرج الكبير',
    termEn: 'Grand Staff',
    category: 'clef',
    symbol: '🎹',
    defAr: 'مدرجان معاً (مفتاح صول في الأعلى ومفتاح فا في الأسفل) موصولان بقوس جامع ودو الوسطى في المنتصف.',
    defEn: 'Combination of treble and bass staves joined by a brace, centered around Middle C.',
  },
  {
    termAr: 'دو الوسطى',
    termEn: 'Middle C (C4)',
    category: 'pitch',
    symbol: 'C4',
    defAr: 'النغمة المركزية الواقعة في منتصف لوحة مفاتيح البيانو على خط إضافي أسفل مفتاح صول.',
    defEn: 'The central landmark pitch on a piano keyboard (261.6 Hz), situated on the ledger line between staves.',
    audioMidi: 60,
  },
  {
    termAr: 'خطوط الإضافة',
    termEn: 'Ledger Lines',
    category: 'clef',
    symbol: '—',
    defAr: 'خطوط أفقية قصيرة مخصصة تُضاف فوق المدرج أو تحته لمد مجاله الصوتي للنغمات العالية أو المنخفضة.',
    defEn: 'Short horizontal lines drawn above or below the staff to accommodate pitches outside standard lines.',
  },
  {
    termAr: 'النوتة المستديرة',
    termEn: 'Whole Note (Semibreve)',
    category: 'rhythm',
    symbol: '𝅝',
    defAr: 'نوتة مفرغة بدون ساق، قيمتها 4 ضربات زمنية كاملة.',
    defEn: 'Hollow oval note without a stem, lasting 4 full beats.',
  },
  {
    termAr: 'النوتة البيضاء',
    termEn: 'Half Note (Minim)',
    category: 'rhythm',
    symbol: '𝅗𝅥',
    defAr: 'نوتة مفرغة مع ساق، قيمتها ضربتان زمنيتان.',
    defEn: 'Hollow note with a vertical stem, worth 2 beats.',
  },
  {
    termAr: 'النوتة السوداء',
    termEn: 'Quarter Note (Crotchet)',
    category: 'rhythm',
    symbol: '𝅘𝅥',
    defAr: 'نوتة مصمتة سوداء مع ساق، قيمتها ضربة زمنية واحدة.',
    defEn: 'Filled note with a stem, worth 1 beat.',
  },
  {
    termAr: 'ذات السن',
    termEn: 'Eighth Note (Quaver)',
    category: 'rhythm',
    symbol: '𝅘𝅥𝅮',
    defAr: 'نوتة مصمتة ذات راية سن واحدة على ساقها، قيمتها نصف ضربة.',
    defEn: 'Filled note with one flag, worth 1/2 of a beat.',
  },
  {
    termAr: 'ذات السنين',
    termEn: 'Sixteenth Note (Semiquaver)',
    category: 'rhythm',
    symbol: '𝅘𝅥𝅯',
    defAr: 'نوتة مصمتة ذات رايتين على ساقها، قيمتها ربع ضربة.',
    defEn: 'Filled note with two flags, worth 1/4 of a beat.',
  },
  {
    termAr: 'السكتة الموسيقية',
    termEn: 'Musical Rest',
    category: 'rest',
    symbol: '𝄽',
    defAr: 'رمز يدل على الصمت الموسيقي المحسوب بدقة في الزمن بدلاً من إصدار صوت.',
    defEn: 'A symbol designating a measured duration of silence.',
  },
  {
    termAr: 'النقطة الزمنية',
    termEn: 'Dotted Note',
    category: 'rhythm',
    symbol: '·',
    defAr: 'نقطة توضع على يمين رأس النوتة لتضيف نصف قيمتها الأصلية إليها.',
    defEn: 'A dot placed after a note increasing its duration by 50%.',
  },
  {
    termAr: 'قوس الوصل',
    termEn: 'Tie',
    category: 'rhythm',
    symbol: '‿',
    defAr: 'قوس يصل بين نغمتين متطابقتين في الطبقة الصوتية لجمع زمنيهما معاً دون إعادة العزف.',
    defEn: 'A curved line linking two notes of the same pitch to combine their durations.',
  },
  {
    termAr: 'المازورة (البار)',
    termEn: 'Measure / Bar',
    category: 'rhythm',
    symbol: '|',
    defAr: 'المسافة المحصورة بين خطين عموديين على المدرج تحتوي على عدد محدد من الضربات وفقاً للميزان.',
    defEn: 'The segment between two vertical bar lines holding a fixed number of beats defined by meter.',
  },
  {
    termAr: 'الميزان الموسيقي',
    termEn: 'Time Signature',
    category: 'rhythm',
    symbol: '4/4',
    defAr: 'رقم كسر يكتب في بداية القطعة يحدد عدد الضربات في كل مازورة وشكل النوتة التي تأخذ ضربة واحدة.',
    defEn: 'Notation indicating the number of beats per measure and which note value equals one beat.',
  },
  {
    termAr: 'الديز',
    termEn: 'Sharp',
    category: 'accidental',
    symbol: '♯',
    defAr: 'علامة تحويل ترفع النغمة نصف بعد صوتي للأعلى.',
    defEn: 'Accidental raising the pitch of a note by one half step.',
  },
  {
    termAr: 'البيمول',
    termEn: 'Flat',
    category: 'accidental',
    symbol: '♭',
    defAr: 'علامة تحويل تخفض النغمة نصف بعد صوتي للأسفل.',
    defEn: 'Accidental lowering the pitch of a note by one half step.',
  },
  {
    termAr: 'البيكار',
    termEn: 'Natural',
    category: 'accidental',
    symbol: '♮',
    defAr: 'علامة تحويل تلغي أثر أي ديز أو بيمول سابق وتعيد النغمة لحالتها الطبيعية الأصلية.',
    defEn: 'Accidental canceling a previous sharp or flat.',
  },
  {
    termAr: 'نصف البيمول (السيكاه)',
    termEn: 'Half-Flat (Quarter Tone)',
    category: 'arabic',
    symbol: '𝄳',
    defAr: 'علامة تحويل شرقية تخفض النغمة ربع بعد صوتي (50 سنت تقريباً)، وهي سر مقامات البياتي والرست.',
    defEn: 'Oriental microtonal accidental lowering pitch by a quarter step (~50 cents).',
  },
  {
    termAr: 'نصف الديز',
    termEn: 'Half-Sharp',
    category: 'arabic',
    symbol: '𝄲',
    defAr: 'علامة تحويل شرقية ترفع النغمة ربع بعد صوتي للأعلى.',
    defEn: 'Oriental microtonal accidental raising pitch by a quarter step.',
  },
  {
    termAr: 'مقام البياتي',
    termEn: 'Maqam Bayati',
    category: 'arabic',
    symbol: 'بياتي',
    defAr: 'أشهر وأحب المقامات الشرقية، يرتكز على درجة الري ويحتوي على مي نصف بيمول.',
    defEn: 'Iconic Arabic maqam on D with characteristic E-half-flat.',
    audioMidi: 62,
  },
  {
    termAr: 'مقام الرست',
    termEn: 'Maqam Rast',
    category: 'arabic',
    symbol: 'رست',
    defAr: 'سيد المقامات العربية، يرتكز على درجة الدو ويحتوي على مي نصف بيمول وسي نصف بيمول.',
    defEn: 'The master Arabic maqam on C with E-half-flat and B-half-flat.',
    audioMidi: 60,
  },
  {
    termAr: 'بيانو (هادئ)',
    termEn: 'Piano (p)',
    category: 'dynamic',
    symbol: 'p',
    defAr: 'علامة ديناميكية تدل على العزف أو الغناء بهدوء ورقة.',
    defEn: 'Dynamic mark indicating soft volume.',
  },
  {
    termAr: 'فورتي (قوي)',
    termEn: 'Forte (f)',
    category: 'dynamic',
    symbol: 'f',
    defAr: 'علامة ديناميكية تدل على العزف أو الغناء بجهارة وقوة.',
    defEn: 'Dynamic mark indicating loud, projected volume.',
  },
  {
    termAr: 'بيانِسيمو',
    termEn: 'Pianissimo (pp)',
    category: 'dynamic',
    symbol: 'pp',
    defAr: 'علامة ديناميكية تدل على العزف بهدوء وهمس شديدين.',
    defEn: 'Very soft dynamic level.',
  },
  {
    termAr: 'فورتِسيمو',
    termEn: 'Fortissimo (ff)',
    category: 'dynamic',
    symbol: 'ff',
    defAr: 'علامة ديناميكية تدل على العزف بقوة قصوى وهادرة.',
    defEn: 'Very loud dynamic level.',
  },
  {
    termAr: 'كيرشيندو',
    termEn: 'Crescendo',
    category: 'dynamic',
    symbol: '<',
    defAr: 'علامة تدل على التدرج التدريجي في قوة الصوت من الهدوء إلى القوة.',
    defEn: 'Gradually increasing in volume.',
  },
  {
    termAr: 'ديمينويندو',
    termEn: 'Decrescendo / Diminuendo',
    category: 'dynamic',
    symbol: '>',
    defAr: 'علامة تدل على التدرج التدريجي في هبوط الصوت من القوة إلى الهدوء.',
    defEn: 'Gradually decreasing in volume.',
  },
  {
    termAr: 'أليجرو',
    termEn: 'Allegro',
    category: 'tempo',
    symbol: '120-156 BPM',
    defAr: 'مصطلح سرعة إيطالي يعني سريع ومرح ومبهج (120 - 156 ضربة في الدقيقة).',
    defEn: 'Italian tempo meaning brisk, lively, joyful and fast.',
  },
  {
    termAr: 'أندانتي',
    termEn: 'Andante',
    category: 'tempo',
    symbol: '76-108 BPM',
    defAr: 'مصطلح سرعة إيطالي يعني بسرعة المشي المعتدل المنساب (76 - 108 ضربة في الدقيقة).',
    defEn: 'Italian tempo meaning at a moderate walking pace.',
  },
  {
    termAr: 'لارغو',
    termEn: 'Largo',
    category: 'tempo',
    symbol: '40-60 BPM',
    defAr: 'مصطلح سرعة إيطالي يعني بطيء جداً وهادئ ذو وقار وهيبة (40 - 60 ضربة في الدقيقة).',
    defEn: 'Broad, solemn, and very slow tempo.',
  },
  {
    termAr: 'بريستو',
    termEn: 'Presto',
    category: 'tempo',
    symbol: '168-200 BPM',
    defAr: 'مصطلح سرعة إيطالي يعني سريع جداً وعاصف (168 - 200 ضربة في الدقيقة).',
    defEn: 'Very fast and rapid tempo.',
  },
  {
    termAr: 'ليغاتو',
    termEn: 'Legato',
    category: 'articulation',
    symbol: '⁀',
    defAr: 'أسلوب أداء تعبيري يقضي بربط النغمات بسلاسة وانسيابية مائية دون أي انقطاع بينها.',
    defEn: 'Playing smoothly and connected without breaks between notes.',
  },
  {
    termAr: 'ستيكاتو',
    termEn: 'Staccato',
    category: 'articulation',
    symbol: '•',
    defAr: 'أسلوب أداء تعبيري يقضي بعزف النوتة مقطوعة وخفيفة وقصيرة مفصولة عما بعدها.',
    defEn: 'Playing notes detached, crisp, and short.',
  },
  {
    termAr: 'فرماتا',
    termEn: 'Fermata',
    category: 'articulation',
    symbol: '𝄐',
    defAr: 'رمز يشبه عين الصقر يوضع فوق النوتة ليأمر بمدها وتعليق زمنها حسب إحساس العازف.',
    defEn: 'Pause symbol directing a note to be held beyond its written duration.',
  },
];
