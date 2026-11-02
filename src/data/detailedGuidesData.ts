export interface DetailedGuideItem {
  id: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  categoryAr: string;
  categoryEn: string;
  icon: string;
  accentColor: string; // e.g. 'pink', 'cyan', 'amber', 'emerald', 'indigo'
  physiologicalGoalAr: string;
  physiologicalGoalEn: string;
  anatomicalMechanismAr: string;
  anatomicalMechanismEn: string;
  stepsAr: string[];
  stepsEn: string[];
  commonMistakesAr: string[];
  commonMistakesEn: string[];
  expectedBenefitsAr: string[];
  expectedBenefitsEn: string[];
  targetMusclesAndCavitiesAr: string[];
  targetMusclesAndCavitiesEn: string[];
}

export const DETAILED_GUIDES: Record<string, DetailedGuideItem> = {
  // ===========================================================================
  // 1. VOCAL LADDER SYLLABLES & TECHNIQUES
  // ===========================================================================
  'vocal_aah': {
    id: 'vocal_aah',
    titleAr: 'تمرين «آآآآه» (Aaaah) – إطلاق الرنين وتوسيع التجويف الفمي',
    titleEn: 'Aaaah [aː] Open Vowel – Pharyngeal Space & Bel Canto Resonance',
    subtitleAr: 'التمرين الذهبي لفتح الحلق وخفض الحنجرة بمرونة وإطلاق رنين بل كانتو',
    subtitleEn: 'The quintessential exercise for pharyngeal width and unconstrained projection',
    categoryAr: 'تمارين الرنين والتجويف',
    categoryEn: 'Resonance & Cavity Expansion',
    icon: '🗣️',
    accentColor: 'pink',
    physiologicalGoalAr: 'توسيع التجويف البلعومي والفمي (Pharyngeal Cavity Expansion)، رفع سقف الحلق الرخو (Soft Palate)، وخفض الحنجرة إلى وضع مريح مستقر مما يضاعف حجم رنين الصوت الطبيعي بدون أي شد عضلي أو ضغط على الحبال الصوتية.',
    physiologicalGoalEn: 'Expands pharyngeal & oral cavity space, elevates the soft palate (velum), and naturally anchors a relaxed neutral larynx for amplified projection.',
    anatomicalMechanismAr: 'عند نطق حرف العلة المفتوح «آه» [aː]، يستقر اللسان منبسطاً في قاع الفم، ويتسع التجويف البلعومي الفموي (Oropharynx) كأنك تهم بالتثاؤب الخفيف. يعمل هذا الاتساع كمضخم صوتي طبيعي (Acoustic Resonator) يعزز نغمات الهارمونيك العالية وتشكيل الفورمانت الغنائي (Singer\'s Formant بين 2.5 إلى 3.2 كيلوهرتز).',
    anatomicalMechanismEn: 'During open [aː], the tongue lays flat and wide in the floor of the mouth, expanding the oropharyngeal tract like an incipient yawn. This acoustic chamber amplifies the Singer\'s Formant cluster (2.5–3.2 kHz).',
    stepsAr: [
      'قف أو اجلس بظهر مستقيم واسترخاء تام في الكتفين والرقبة.',
      'تخيل أنك تبدأ تثاؤباً خفيفاً لطيفاً (Incipient Yawn) للشعور بارتفاع سقف الحلق الرخو.',
      'افتح الفك عمودياً بنعومة (وليس أفقياً) بحيث تتسع المسافة بين الأسنان العلوية والسفلية بمقدار إصبعين.',
      'أطلق صوت «آآآآه» مسترسلاً ومرتاحاً، واشعر بأن الصوت يخرج من عمق الصدر ليرن في مؤخرة الحلق وقبة الفم.',
      'حافظ على استمرار تدفق الهواء الهادئ دون أن تجعل الصوت حاداً أو مضغوطاً في الحنجرة.',
    ],
    stepsEn: [
      'Stand or sit tall with shoulders and neck completely relaxed.',
      'Simulate the beginning of a gentle inner yawn to lift the soft palate.',
      'Drop your jaw vertically (two finger-widths) rather than stretching sideways.',
      'Release a round, resonant "Aaaah", feeling resonance bloom in the rear pharynx and roof of mouth.',
      'Maintain an unbroken, effortless stream of breath without pushing vocal fold pressure.',
    ],
    commonMistakesAr: [
      'سحب اللسان إلى الخلف أو رفعه في الحلق مما يخنق مجرى الصوت ويجعل الصوت مكتوماً.',
      'فتح الفم بالعرض كابتسامة مشدودة بدلاً من الفتح الرأسي البيضاوي المريح.',
      'الضغط على الأحبال الصوتية في النغمات العليا بدلاً من إعطاء مساحة أكبر للتنفس.',
      'رفع الحنجرة إلى الأعلى عند الصعود في الطبقات.',
    ],
    commonMistakesEn: [
      'Pulling or bunching the tongue back, blocking the airway.',
      'Spreading the mouth horizontally into a tense smile instead of a vertical oval.',
      'Pushing vocal fold compression on upper notes instead of enlarging acoustic space.',
      'Lifting the larynx skyward when climbing registers.',
    ],
    expectedBenefitsAr: [
      'زيادة سعة وحجم رنين الصوت بنسبة تزيد عن 40% دون بذل مجهود إضافي.',
      'التخلص من بحة الحلق وإجهاد الحبال الصوتية بعد الغناء المطول.',
      'صوت دافئ، جهوري، ونقي قادر على ملء القاعة بسهولة.',
    ],
    expectedBenefitsEn: [
      'Expands acoustic volume and natural projection by over 40% effortlessly.',
      'Eliminates vocal strain and fatigue during long singing sessions.',
      'Yields a warm, commanding tone with crystalline carrying power.',
    ],
    targetMusclesAndCavitiesAr: ['التجويف البلعومي الفموي', 'سقف الحلق الرخو (اللهاة)', 'الفك السفلي', 'قاعدة اللسان', 'الحجاب الحاجز'],
    targetMusclesAndCavitiesEn: ['Oropharyngeal Cavity', 'Soft Palate (Velum)', 'Lower Jaw (Mandible)', 'Tongue Base', 'Diaphragm'],
  },

  'vocal_mmm': {
    id: 'vocal_mmm',
    titleAr: 'تمرين «امممممم» (Humming) – الدندنة الأنفية وإيقاظ قناع الوجه',
    titleEn: 'Mmmmm [mː] Closed-Lip Hum – Nasal Resonance & Mask Awakening',
    subtitleAr: 'التمرين الأساسي لتهدئة الأوتار الصوتية وتنشيط رنين الجيوب الأنفية',
    subtitleEn: 'Gentle closed-lip hum to activate sinus twang and relieve vocal fold tension',
    categoryAr: 'تمارين الرنين والتجويف',
    categoryEn: 'Resonance & Cavity Expansion',
    icon: '🧘',
    accentColor: 'emerald',
    physiologicalGoalAr: 'تقليل ضغط الهواء المباشر على الحبال الصوتية، وتوجيه اهتزاز الصوت إلى العظام الوجهية وتجاويف الجيوب الأنفية (Nasal & Frontal Sinuses)، وإزالة التشنجات من عضلات الرقبة والفك.',
    physiologicalGoalEn: 'Minimizes direct subglottic air pressure, routes acoustic vibration into facial mask bones and sinuses, and releases neck and jaw tension.',
    anatomicalMechanismAr: 'إغلاق الشفتين مع إبقاء الأسنان متباعدة يمنع تسرب الصوت للخارج مباشرة، فيرتد جزء من الموجة الصوتية إلى الخلف (Acoustic Backpressure)، مما يساعد الحبال الصوتية على التلامس بنعومة متناهية وتنشيط الترددات الرنانة في جسر الأنف وقناع الوجه (Masque).',
    anatomicalMechanismEn: 'Closed lips with teeth apart create semi-occlusion; the resulting acoustic backpressure helps vocal folds approximate smoothly and triggers bone-conducted frontal buzz.',
    stepsAr: [
      'أغلق شفتيك بلطف شديد دون ضغطهما، وافصل بين أسنانك العلوية والسفلية (كأنك تحتفظ بحبة عنب داخل فمك).',
      'خذ نفساً هادئاً من الأنف أو الفم دون صوت.',
      'أطلق دندنة «اممممم» خفيفة وناعمة، وحاول أن تشعر بالدغدغة أو الاهتزاز في شفتيك وجسر أنفك.',
      'تخيل أنك تتذوق طعاماً شهياً وتقول بتلذذ: "امممم!".',
      'اصعد بالدندنة صعوداً وهبوطاً بنعومة كالأمواج.',
    ],
    stepsEn: [
      'Gently touch lips without squeezing; keep upper and lower teeth separated (like holding a grape).',
      'Inhale quietly through nose or mouth.',
      'Produce a gentle "Mmmmm", focusing on the tingle/buzz on your lips and nasal bridge.',
      'Imagine tasting your favorite dish and saying: "Mmm, delicious!".',
      'Glide pitch smoothly up and down like gentle ocean waves.',
    ],
    commonMistakesAr: [
      'إطباق الأسنان على بعضها بقوة مما يحبس الرنين ويمنع الصوت من الانتشار.',
      'شد الشفاه أو كتم الصوت في الحنجرة بدلاً من توجيهه للأمام.',
      'دفع الهواء بقوة مفرطة مما يسبب صوتاً مكتوماً أو حشرجة.',
    ],
    commonMistakesEn: [
      'Clenching teeth together, suffocating intra-oral resonance.',
      'Tensing lips or trapping sound in the throat instead of front mask.',
      'Blowing air forcefully, creating breathy turbulence.',
    ],
    expectedBenefitsAr: [
      'إحماء صوتي آمن 100% حتى في أوقات التعب أو الصباح الباكر.',
      'إيقاظ الرنين الأمامي اللامع الذي يمنح الصوت بريقاً ووضوحاً.',
      'استرخاء فوري لعضلات الفك والحنجرة المتوترة.',
    ],
    expectedBenefitsEn: [
      '100% safe, non-fatiguing warmup even when tired or early morning.',
      'Awakens brilliant forward placement giving vocals crisp clarity.',
      'Instant relaxation of tense jaw and laryngeal muscles.',
    ],
    targetMusclesAndCavitiesAr: ['الجيوب الأنفية والوجهية', 'الشفاه والفك', 'الأوتار الصوتية', 'الحنك الرخو'],
    targetMusclesAndCavitiesEn: ['Maxillary & Frontal Sinuses', 'Lips & Mandible', 'Vocal Folds', 'Soft Palate'],
  },

  'vocal_brrr': {
    id: 'vocal_brrr',
    titleAr: 'تمرين «برررررر» (Lip Trills / SOVT) – رفرفة الشفاه وصعود الجواب بأمان',
    titleEn: 'Brrrrrr Lip Trill (SOVT) – Vocal Fold Protection & Register Balancing',
    subtitleAr: 'التمرين السحري لأطباء الصوت ومدربي الغناء العالميين لحماية الحبال وصعود النغمات العالية',
    subtitleEn: 'The semi-occluded gold standard for effortless high range climbing without strain',
    categoryAr: 'تمارين المسالك شبه المغلقة (SOVT)',
    categoryEn: 'Semi-Occluded Vocal Tract (SOVT)',
    icon: '🌊',
    accentColor: 'amber',
    physiologicalGoalAr: 'موازنة الضغط الهيدروديناميكي فوق الحبال الصوتية وتحتها (Impedance Matching)، مما يسمح للحبال بالتذبذب بحرية تامة وصعود النغمات العالية في الجواب (High Do) دون أي شد أو إجهاد.',
    physiologicalGoalEn: 'Achieves vocal tract impedance matching via acoustic backpressure, allowing vocal folds to oscillate freely through high registers without muscular strain.',
    anatomicalMechanismAr: 'ينتمي هذا التمرين لتمارين المسالك الصوتية شبه المغلقة (SOVT - Semi-Occluded Vocal Tract). رفرفة الشفاه المستمرة تخلق مقاومة محسوبة لتيار الهواء الصاعد من الرئتين، فتنخفض قوة اصطدام الحبال الصوتية ببعضها البعض بنسبة 70%، مما يحمي الأنسجة الرقيقة ويتيح تمدد العضلة الحلقية الدرقية المسؤولة عن النغمات الحادة بأمان كامل.',
    anatomicalMechanismEn: 'Continuous lip flutter creates calibrated flow resistance. Impact stress between vocal fold edges drops by ~70%, shielding mucosal tissue while training cricothyroid stretch.',
    stepsAr: [
      'ضع إصبعيك بلطف على جانبي وجنتيك بجوار زوايا فمك وارفع الوجنتين قليلاً لتسهيل رفرفة الشفتين.',
      'انفخ هواءً خفيفاً عبر شفتيك المغلقتين لتبدأ بالرفرفة مثل صوت محرك السيارة أو قارب هادئ: "برررررر".',
      'أضف الصوت تدريجياً إلى الرفرفة دون أن توقف اهتزاز الشفاه.',
      'اصعد بالنغمة درجة درجة من دو القرار حتى دو الجواب ولا تقلق من النغمات العالية فالشفاه تحمي حنجرتك.',
      'حافظ على هواء مستمر من البطن وتجنب انقطاع الرفرفة.',
    ],
    stepsEn: [
      'Place fingertips gently on your cheeks near mouth corners, lifting slightly to ease fluttering.',
      'Blow steady air through relaxed lips to produce a motorboat flutter: "Brrrrrr".',
      'Add voice pitch to the flutter without stalling the lip vibration.',
      'Glide smoothly up the scale from Root Do to High Do without fear—the backpressure cushions your cords.',
      'Maintain an even column of abdominal breath support.',
    ],
    commonMistakesAr: [
      'شد الشفاه بقوة مما يمنع الرفرفة أو يجعلها تتوقف بسرعة.',
      'نفخ كمية هواء هائلة دفعة واحدة بدلاً من تيار هادئ مستقر.',
      'التوقف عن رفرفة الشفاه عند الوصول إلى النغمات العالية.',
    ],
    commonMistakesEn: [
      'Tensing lips too tightly, arresting the flutter.',
      'Blasting a sudden burst of air rather than a sustained, controlled stream.',
      'Letting lips stall when approaching higher pitches.',
    ],
    expectedBenefitsAr: [
      'الوصول إلى أقصى نغمات طبقة الجواب العالية براحة متناهية دون بحة أو ألم.',
      'علاج بحة الصوت وإعادة تأهيل الحبال الصوتية المجهدة.',
      'دمج سلس للطبقات (الصدر، المكس، والرأس) دون انقطاع أو كسر صوتي (Vocal Break).',
    ],
    expectedBenefitsEn: [
      'Effortlessly hits top notes in upper tessitura without cracking or strain.',
      'Rehabilitates tired or hoarse vocal folds after strenuous sessions.',
      'Smooths transitions across chest, mixed, and head registers seamlessly.',
    ],
    targetMusclesAndCavitiesAr: ['عضلات الشفاه (Orbicularis Oris)', 'العضلة الحلقية الدرقية (Cricothyroid)', 'الحبال الصوتية', 'الحجاب الحاجز وجدار البطن'],
    targetMusclesAndCavitiesEn: ['Orbicularis Oris', 'Cricothyroid Muscle', 'Vocal Fold Mucosa', 'Diaphragm & Abdominal Wall'],
  },

  'vocal_solfege': {
    id: 'vocal_solfege',
    titleAr: 'تمرين «دو - ري - مي» (Solfeggio) – الذاكرة السمعية والنطق اللفظي',
    titleEn: 'Do-Re-Mi (Solfeggio) – Auditory Scale Mastery & Articulation',
    subtitleAr: 'النظام العالمي المعتمد لترسيخ أسماء الدرجات وتطابق الترددات بدقة متناهية',
    subtitleEn: 'Universal ear training standard for instant pitch memory and interval accuracy',
    categoryAr: 'الصولفيج والتربية السمعية',
    categoryEn: 'Solfège & Ear Calibration',
    icon: '🎵',
    accentColor: 'cyan',
    physiologicalGoalAr: 'ربط السمع الإدراكي الداخلي (Audiation) بالنطق الحركي للسان والشفتين، لترسيخ المسافات الموسيقية (الأبعاد والنصف أبعاد) في الدماغ والحنجرة تلقائياً.',
    physiologicalGoalEn: 'Coordinates internal mental pitch imaging (audiation) with motor articulators to cement intervals and scale steps into muscle memory.',
    anatomicalMechanismAr: 'نطق المقاطع المتغيرة (دو، ري، مي، فا، صول، لا، سي) يدرب اللسان وعضلات البلعوم على تغيير مواضع الحروف دون المساس بثبات الحنجرة ودقة التردد الأساسي (F0)، مما يعزل حركة النطق عن ميكانيزم ضبط النغمة في الحنجرة.',
    anatomicalMechanismEn: 'Articulating varying syllables (Do, Re, Mi, Fa, Sol, La, Ti) trains the tongue and articulators to move independently of laryngeal height and fundamental pitch (F0).',
    stepsAr: [
      'استمع للنغمة المرجعية التي يعزفها التطبيق بدقة قبل أن تغني.',
      'تصور النغمة في ذهنك أولاً (Audiation) لثانية واحدة.',
      'انطق اسم الدرجة الموسيقية بنقاء: "دوووو"، ثم "ريييي"، وهكذا.',
      'راقب مؤشر السنت (Cents) اللحظي على الشاشة لتتأكد من وجودك في قلب النغمة (أخضر).',
      'اصعد السلم كاملاً حتى دو الجواب ثم اهبط حتى دو القرار.',
    ],
    stepsEn: [
      'Listen attentively to the reference tone before phonating.',
      'Audiate (hear in your mind) the pitch for a fraction of a second.',
      'Pronounce the syllable cleanly: "Doooo", "Reeeee", etc.',
      'Watch the live cents needle to settle precisely in the emerald center zone.',
      'Climb the entire octave up to High Do, then descend back to Root Do.',
    ],
    commonMistakesAr: [
      'التسرع في الغناء قبل الاستماع الكافي لتردد النغمة المرجعية.',
      'الانزلاق المتردد (Scooping) نحو النغمة بدلاً من إصابتها بدقة فورية.',
      'تغيير شدة الصوت فجأة بين النغمات.',
    ],
    commonMistakesEn: [
      'Singing hastily before absorbing the reference pitch.',
      'Scooping or sliding up to notes rather than landing cleanly in center.',
      'Erratic volume spikes between successive scale degrees.',
    ],
    expectedBenefitsAr: [
      'تطوير أذن موسيقية حديدية وقدرة على قراءة وغناء أي لحن من النوتة مباشرة.',
      'إلغاء التردد والنشاز الصوتي بنسبة 95%.',
      'ثقة تامة في غناء السلالم والمقامات بدقة متناهية.',
    ],
    expectedBenefitsEn: [
      'Develops razor-sharp pitch accuracy and sight-singing independence.',
      'Reduces pitch drift and out-of-tune tendencies by 95%.',
      'Gives total vocal confidence when navigating scales and modes.',
    ],
    targetMusclesAndCavitiesAr: ['الجهاز العصبي السمعي', 'اللسان والشفتان', 'العضلات الحنجرية الداخلية', 'الحنك الرخو'],
    targetMusclesAndCavitiesEn: ['Auditory Cortex', 'Tongue & Lips', 'Intrinsic Laryngeal Muscles', 'Velum'],
  },

  'vocal_ooh': {
    id: 'vocal_ooh',
    titleAr: 'تمرين «أوووووو» (Ooooh) – الرنين الدائري وتثبيت الحنجرة المريحة',
    titleEn: 'Ooooh [uː] Rounded Vowel – Laryngeal Stability & Dark Warmth (Chiaroscuro)',
    subtitleAr: 'التمرين المثالي لتهدئة الحنجرة المرتفعة وإضفاء الدفء والعمق المخملي على الصوت',
    subtitleEn: 'Stabilizes a high tense larynx and imparts velvety warmth and depth',
    categoryAr: 'تمارين الرنين والتجويف',
    categoryEn: 'Resonance & Cavity Expansion',
    icon: '🎙️',
    accentColor: 'purple',
    physiologicalGoalAr: 'خفض الحنجرة المرتفعة وتطويل الأنبوب الصوتي (Vocal Tract Lengthening) عبر تدوير الشفاه للأمام، مما يعطي صوتاً دافئاً وعميقاً متزناً (Chiaroscuro).',
    physiologicalGoalEn: 'Lowers an elevated larynx and lengthens the acoustic vocal tract via lip protrusion, generating rich chiaroscuro warmth.',
    anatomicalMechanismAr: 'استطالة الشفاه للأمام في شكل دائري صغير يطيل المسار الصوتي الفيزيائي بعد الحبال الصوتية بحوالي 1.5 إلى 2 سم، مما يخفض ترددات الرنين الأولى ويزيل الحدة والصرامة من الصوت.',
    anatomicalMechanismEn: 'Protruding lips forward extends the acoustic tube by 1.5–2 cm, depressing formant frequencies to soften strident, brassy overtones into velvety warmth.',
    stepsAr: [
      'شكل شفتيك في دائرة ناعمة كأنك تصفر أو تنفخ على شمعة بلطف.',
      'حافظ على مسافة واسعة بين أسنانك في الداخل رغم تدوير الشفاه من الخارج.',
      'أطلق صوتاً دائرياً دافئاً: "أووووو" [uː] يشبه صوت الناي أو البومة الهادئة.',
      'اشعر بالرنين يهتز في مؤخرة الفم وتجويف الصدر.',
    ],
    stepsEn: [
      'Shape lips into a round circle as if whistling or gently blowing a candle.',
      'Keep internal oral space wide even while lips are rounded.',
      'Release a warm, flute-like "Ooooh" [uː].',
      'Feel resonance anchoring comfortably in the lower pharynx and chest.',
    ],
    commonMistakesAr: [
      'تضييق الحلق من الداخل عند تدوير الشفتين من الخارج.',
      'كتم النفس مما يجعل الصوت ضعيفاً وخافتاً.',
    ],
    commonMistakesEn: [
      'Narrowing the pharynx internally when rounding lips externally.',
      'Choking breath flow, resulting in an anemic, hollow tone.',
    ],
    expectedBenefitsAr: [
      'التخلص من الصوت الصاخب الحاد أو المخنوق.',
      'صوت مخملي دافئ ومريح للأذن في الأغاني الهادئة والرومانسية.',
      'مرونة هائلة في الانتقال نحو النغمات المتوسطة.',
    ],
    expectedBenefitsEn: [
      'Cures shrill, strident, or pinched vocal habits.',
      'Imparts a lush, velvety acoustic timbre for ballads and expressive singing.',
      'Effortless navigation into middle vocal register.',
    ],
    targetMusclesAndCavitiesAr: ['العضلة الدويرية الفموية', 'المسار الصوتي الممتد', 'الحنجرة المستقرة', 'التجويف الصدري'],
    targetMusclesAndCavitiesEn: ['Orbicularis Oris', 'Extended Vocal Tract', 'Stabilized Larynx', 'Thoracic Cavity'],
  },

  'vocal_eee': {
    id: 'vocal_eee',
    titleAr: 'تمرين «إيييييي» (Eeeee) – الرنين الأمامي واجتياز الجسور الصوتية',
    titleEn: 'Eeeee [iː] Narrow Vowel – Forward Twang & Passaggio Crossing',
    subtitleAr: 'سلاح المغني السري للعبور السلس عبر الجسور الصوتية (Passaggio) دون انقطاع الصوت',
    subtitleEn: 'The singer\'s secret weapon for bridging passaggio transitions seamlessly',
    categoryAr: 'تمارين الرنين والتجويف',
    categoryEn: 'Resonance & Cavity Expansion',
    icon: '✨',
    accentColor: 'indigo',
    physiologicalGoalAr: 'رفع لسان المزمار وتضييق البلعوم السفلي بذكاء (Aryepiglottic Twang)، لتوجيه الصوت نحو قناع الوجه وعظام الجبهة والعبور السلس فوق الجسور الصوتية (Passaggio) دون أي انكسار.',
    physiologicalGoalEn: 'Engages aryepiglottic narrowing (twang) to beam sound forward into facial mask, enabling seamless bridge (passaggio) crossing.',
    anatomicalMechanismAr: 'في حرف «إي» [iː]، يرتفع وسط اللسان نحو قبة الحنك الصلب، مما يضيق الفراغ الأمامي ويدفع الصوت للتركيز في مسار ضيق وعالي الكثافة الصوتية، مما يسمح للأوتار الصوتية بالترقق دون أن تنفصل فجأة.',
    anatomicalMechanismEn: 'In [iː], the tongue dorsum arches toward the hard palate, funneling acoustic energy into a high-density acoustic beam that allows vocal folds to thin without breaking.',
    stepsAr: [
      'ارفع جانبي لسانك ليلامسا الأضراس العلوية بخفة مع إبقاء طرف اللسان مستقراً خلف الأسنان السفلية.',
      'أطلق صوتاً ناصعاً ومركزاً كأشعة الليزر: "إيييييي" [iː].',
      'اشعر بالرنين يتركز بين عينيك وخلف أنفك تماماً.',
      'اصعد بالنغمة نحو الطبقة العليا وستلاحظ سهولة غير مسبوقة في العبور دون انقطاع.',
    ],
    stepsEn: [
      'Rest the sides of your tongue lightly against your upper molars, tip resting behind bottom teeth.',
      'Emit a bright, laser-focused "Eeeee" [iː].',
      'Feel the resonance tingling directly between your eyes and upper forehead.',
      'Climb into upper registers, experiencing how effortlessly the tone bridges without cracking.',
    ],
    commonMistakesAr: [
      'شد الرقبة أو رفع الذقن للأعلى.',
      'الضغط على الفك بدلاً من ترك اللسان ينجز المهمة.',
    ],
    commonMistakesEn: [
      'Stretching the neck or pointing the chin up.',
      'Locking the jaw instead of letting tongue posture do the work.',
    ],
    expectedBenefitsAr: [
      'إلغاء الشرخ أو الكسر الصوتي المزعج عند الانتقال من صوت الصدر إلى صوت الرأس.',
      'صوت قوي وناصع يخترق الآلات الموسيقية بسهولة تامة.',
      'إتقان الغناء بالصوت المختلط (Mixed Voice).',
    ],
    expectedBenefitsEn: [
      'Eliminates voice cracks when crossing between chest and head voice.',
      'Produces a piercing, effortless tone that cuts through any instrumental mix.',
      'Masters contemporary mixed voice coordination.',
    ],
    targetMusclesAndCavitiesAr: ['وسط اللسان', 'الحنك الصلب', 'قناع الوجه والجبهة', 'المصرة الحنجرية (Aryepiglottic Sphincter)'],
    targetMusclesAndCavitiesEn: ['Tongue Dorsum', 'Hard Palate', 'Frontal Facial Mask', 'Aryepiglottic Sphincter'],
  },

  // ===========================================================================
  // 2. MAIN SECTIONS & TABS DETAILED GUIDES
  // ===========================================================================
  'section_piano': {
    id: 'section_piano',
    titleAr: 'البيانو التفاعلي ومختبر التدريب الصوتي',
    titleEn: 'Interactive Piano & Vocal Pitch Laboratory',
    subtitleAr: 'مركز القيادة الرئيسي لعزف النغمات المرجعية وتدريب الأذن والتحكم في إعدادات الصوت',
    subtitleEn: 'The primary command center for reference playback, ear calibration & sound settings',
    categoryAr: 'أقسام التطبيق الرئيسية',
    categoryEn: 'Main Sections',
    icon: '🎹',
    accentColor: 'cyan',
    physiologicalGoalAr: 'بناء التزامن العصبي العضلي بين السمع والأوتار الصوتية من خلال سماع تردد نقي ومحاكاته بدقة متناهية مع ملاحظة الانحراف الفوري بالسنت.',
    physiologicalGoalEn: 'Establishes neuromuscular synchrony between auditory perception and vocal cord tuning via pristine reference tones and real-time cents feedback.',
    anatomicalMechanismAr: 'يوفر البيانو نغمات كلاسيكية نقية أو أصواتاً بشرية طبيعية بعينات فورمانت واقعية. عند الضغط على أي مفتاح، يستقبل الدماغ التردد الدقيق (F0)، وعندما تغني في الميكروفون، يحلل خوارزم YIN الصوتي ترددك اللحظي ويضيء المفتاح المقابل مع خطوط التسامح النغمي.',
    anatomicalMechanismEn: 'Synthesizes acoustic grand tones or human formant samples. As you vocalize, the YIN pitch engine isolates fundamental frequency (F0) and highlights keys with live accuracy tracking.',
    stepsAr: [
      'اضغط على أي مفتاح بيانو للاستماع إلى النغمة المرجعية بالتردد الدقيق.',
      'يمكنك تفعيل الميكروفون بالضغط على أيقونة الميكروفون الخضراء في الترويسة.',
      'غنِّ النغمة وراقب إضاءة المفاتيح: الأخضر يعني دقة تامة، الكهرماني يعني قريباً، والوردي يعني انحرافاً.',
      'استخدم زر "توسيط الطبقة" أو شريط التمرير للانتقال السلس بين الأوكتافات (من C1 حتى C7).',
      'اختر بين الوضع الأفقي والوضع الرأسي المحسن للهواتف الذكية.',
    ],
    stepsEn: [
      'Tap any piano key to audition the pitch reference at exact frequency.',
      'Enable the microphone via the master green button in the top header.',
      'Sing into the mic: emerald key indicates in-tune, amber near, rose off-pitch.',
      'Use the range center button or drag horizontally across C1–C7.',
      'Toggle between horizontal and mobile-optimized vertical display.',
    ],
    commonMistakesAr: [
      'الغناء بصوت خافت جداً بعيداً عن الميكروفون في بيئة مليئة بالضجيج.',
      'محاولة غناء نغمات خارج مساحتك الصوتية الطبيعية دون إحماء مسبق.',
    ],
    commonMistakesEn: [
      'Singing too softly or far from mic in noisy background.',
      'Attempting extremes of vocal range without prior warmups.',
    ],
    expectedBenefitsAr: [
      'إدراك سمعي فوري للطبقات الصوتية وعلاقة المفاتيح بالنغمات المكتوبة.',
      'تدريب الحبال الصوتية على الترددات الصافية دون تذبذب.',
    ],
    expectedBenefitsEn: [
      'Instant auditory awareness of pitch frequencies and keyboard layout.',
      'Stabilizes vocal fold pitch targeting without drift.',
    ],
    targetMusclesAndCavitiesAr: ['القشرة السمعية الدماغية', 'الحبال الصوتية', 'التركيز الذهني'],
    targetMusclesAndCavitiesEn: ['Auditory Cortex', 'Vocal Folds', 'Mental Pitch Conception'],
  },

  'section_ladder': {
    id: 'section_ladder',
    titleAr: 'تدرج الطبقات الصوتية (سلم القرار إلى الجواب)',
    titleEn: 'Vocal Register Ladder (Root Do to High Do)',
    subtitleAr: 'التدريب التخصصي للصعود خطوة بخطوة من القرار للجواب وبالعكس لاكتساب القوة والمرونة',
    subtitleEn: 'Systematic step-by-step climbing from low root to high octave ceiling and back',
    categoryAr: 'أقسام التطبيق الرئيسية',
    categoryEn: 'Main Sections',
    icon: '🪜',
    accentColor: 'amber',
    physiologicalGoalAr: 'تدريب الأوتار الصوتية على التمدد والترقق التدريجي المنظم دون صدمات عضلية، والسيطرة التامة على كامل مساحة الصوت من أغلظ نغمة حتى أرفع نغمة.',
    physiologicalGoalEn: 'Trains vocal fold longitudinal elongation and thinning in a smooth continuous progression, eliminating register breaks and expanding range.',
    anatomicalMechanismAr: 'خلال الصعود من القرار إلى الجواب، تنتقل السيطرة تدريجياً من العضلة الدرقية الهرمية (Thyroarytenoid - المسؤولة عن صوت الصدر الغليظ) إلى العضلة الحلقية الدرقية (Cricothyroid - المسؤولة عن شد الأوتار وصوت الرأس النحيف). التدرج نغمة بنغمة يدمج هاتين العضلتين معاً ليصنع الصوت المختلط (Mix Voice).',
    anatomicalMechanismEn: 'Progresses muscular coordination smoothly from the thyroarytenoid (chest dominator) to the cricothyroid (head voice stretcher), forging seamless mixed voice.',
    stepsAr: [
      'اختر نمط النطق الصوتي المناسب لك: دو-ري (صولفيج)، آه آه، امممم، أو برررر.',
      'حدد جواب الأوكتاف (C2 للرجال، C3 للتينور والباريتون، C4 للسيدات والتينور العالي، C5 للأصوات الحادة).',
      'اختر اتجاه المسار: صعود وهبوط، صعود فقط، أو هبوط فقط.',
      'اضغط "ابدأ تدرج السلم"؛ استمع لنغمة الدليل المرجعي ثم غنِّ النغمة المطلوبة بثبات.',
      'تابع التقييم اللحظي ومعدل الدقة في كل خطوة حتى إنهاء السلم كاملاً.',
    ],
    stepsEn: [
      'Select your preferred training syllable: Do-Re, Aah, Mmm, or Brrr.',
      'Choose octave ceiling (C2, C3, C4, or C5) matching your voice classification.',
      'Select direction: Ascending & Descending, Ascending only, or Descending only.',
      'Press Start Ladder: audition the guide note, then sing steadily into mic.',
      'Monitor real-time feedback and review your final accuracy and cents breakdown.',
    ],
    commonMistakesAr: [
      'رفع الصوت والصراخ عند الاقتراب من دو الجواب بدلاً من الاعتماد على الرنين ودعم التنفس.',
      'حبس النفس أو التردد عند الانتقال بين الدرجات الموسيقية.',
    ],
    commonMistakesEn: [
      'Pushing excessive volume or shouting on top notes instead of relying on resonance.',
      'Holding breath or hesitating between scale steps.',
    ],
    expectedBenefitsAr: [
      'القدرة على غناء أي نغمة عالية دون خوف أو بحة صوتية.',
      'زيادة المساحة الصوتية بمقدار أوكتاف كامل خلال أسابيع من التمرين المنتظم.',
      'سلاسة خارقة في الانتقال بين الطبقات.',
    ],
    expectedBenefitsEn: [
      'Confidently hit high notes without strain or voice fatigue.',
      'Expands usable singing range by a full octave over consistent practice.',
      'Seamless agility across all register shifts.',
    ],
    targetMusclesAndCavitiesAr: ['العضلة الحلقية الدرقية', 'العضلة الدرقية الهرمية', 'عضلات التنفس البطني', 'التجاويف البلعومية'],
    targetMusclesAndCavitiesEn: ['Cricothyroid', 'Thyroarytenoid', 'Abdominal Breath Support', 'Pharyngeal Chambers'],
  },

  'section_live_studio': {
    id: 'section_live_studio',
    titleAr: 'استوديو الغناء الحر ومؤشر النغمات المباشر',
    titleEn: 'Live Note Studio & Real-Time Pitch Dial',
    subtitleAr: 'غنِّ بحرية مع قرص النغمات اللحظي وعقرب السنت ومقياس مدى الإتقان والتطابق',
    subtitleEn: 'Free vocal performance studio with instantaneous note dial, cents needle & 5s accuracy gauge',
    categoryAr: 'أقسام التطبيق الرئيسية',
    categoryEn: 'Main Sections',
    icon: '🎙️',
    accentColor: 'emerald',
    physiologicalGoalAr: 'تطوير الرقابة الذاتية الفورية (Real-Time Proprioceptive Feedback) على عضلات الحنجرة والأوتار الصوتية أثناء الغناء الحر دون الاعتماد على سلالم محددة سلفاً.',
    physiologicalGoalEn: 'Develops instantaneous proprioceptive self-monitoring of vocal pitch and stability during expressive free singing.',
    anatomicalMechanismAr: 'يقوم المحرك بقياس التردد الأساسي لصوتك كل 20 ميلي ثانية، ويحوله إلى اسم نغمة دقيق مع انحراف السنت (-50 إلى +50 سنت)، ويحسب متوسط الإتقان التراكمي لآخر 5 ثوانٍ مع رسم شريط موجي حي لمسار الصوت.',
    anatomicalMechanismEn: 'Samples fundamental vocal frequency every 20ms, translating it into exact pitch notation, -50 to +50 cents deviation needle, and rolling 5-second mastery score.',
    stepsAr: [
      'شغل الميكروفون وابدأ بالغناء بحرية على أي مقام أو لحن يعجبك.',
      'انظر إلى القرص الدائري في المنتصف: سيعرض لك فوراً النغمة التي تغنيها (مثلاً C4 دو، D4 ري).',
      'راقب عقرب السنت الدقيق: في المنتصف الأخضر (In Tune) يعني دقة 100%.',
      'راقب مؤشر "مدى الإتقان اللحظي" لمعرفة استقرارك عبر الوقت.',
      'استخدم لوحة البيانو المصغرة لسماع أي نغمة تريد استهدافها وتثبيتها.',
    ],
    stepsEn: [
      'Enable the microphone and sing freely on any song, melody, or exercise.',
      'Observe the glowing central dial: instantly displays the exact note being sung.',
      'Check the analog cents needle: centered green zone reflects precision intonation.',
      'Track the rolling 5-second accuracy meter to gauge sustained vocal control.',
      'Tap mini piano target keys to audition and lock any reference pitch instantly.',
    ],
    commonMistakesAr: [
      'التوتر عند رؤية العقرب يتحرك بدلاً من الغناء بارتياح وثقة.',
      'الضغط الزائد على الصوت لتعديل النغمة بدلاً من التعديل الخفيف المريح.',
    ],
    commonMistakesEn: [
      'Tensing up when watching needle fluctuations instead of singing relaxed.',
      'Forcing throat pressure to adjust pitch instead of micro-tuning with breath.',
    ],
    expectedBenefitsAr: [
      'معرفة طبقتك اللحظية بدقة متناهية في أي لحظة غناء.',
      'التخلص النهائي من النشاز الطفيف (Micro-tonal Detuning).',
      'تطوير ثبات الصوت واستقراره على النغمة لفترات طويلة.',
    ],
    expectedBenefitsEn: [
      'Instant continuous knowledge of your pitch placement at all times.',
      'Cures micro-tonal pitch wandering and flatting.',
      'Enhances steady pitch stability and vibrato control.',
    ],
    targetMusclesAndCavitiesAr: ['الأوتار الصوتية', 'القشرة السمعية البصرية', 'العضلات الحنجرية الدقيقة'],
    targetMusclesAndCavitiesEn: ['Vocal Folds', 'Audio-Visual Cortex', 'Intrinsic Laryngeal Adjusters'],
  },

  'section_profiler': {
    id: 'section_profiler',
    titleAr: 'محلل الصوت وتحديد المساحة والطبقة الصوتية',
    titleEn: 'Voice Profiler™ & Vocal Range Calibration',
    subtitleAr: 'فحص علمي شامل لتحديد أغلظ نغمة، أعلى نغمة، ونوع صوتك بدقة (باس، تينور، ألتو، سوبرانو)',
    subtitleEn: 'Comprehensive scientific calibration wizard finding lowest/highest notes and voice type',
    categoryAr: 'أقسام التطبيق الرئيسية',
    categoryEn: 'Main Sections',
    icon: '🎙️',
    accentColor: 'indigo',
    physiologicalGoalAr: 'اكتشاف الحدود الفسيولوجية الطبيعية لمساحتك الصوتية دون إجهاد، وتحديد منطقة الرنين الأكثر راحة (Tessitura) لاختيار الأغاني والتمارين المناسبة تماماً لحنجرتك.',
    physiologicalGoalEn: 'Identifies the anatomical boundaries of your vocal range safely and pinpoints your optimal comfortable singing zone (Tessitura).',
    anatomicalMechanismAr: 'يقودك المرشد عبر فحص خطوة بخطوة: فحص النغمة السفلى الآمنة (Lowest Note)، ثم فحص النغمة العليا المريحة (Highest Note)، ثم حساب عدد الأوكتافات وتصنيف صوتك عالمياً (Bass, Baritone, Tenor, Contralto, Mezzo-Soprano, Soprano) ومقارنته بأشهر الأصوات العالمية.',
    anatomicalMechanismEn: 'Guides step-by-step pitch discovery: tests comfortable lowest note, highest ceiling, computes octave span, and classifies vocal profile against classical operatic and modern voice types.',
    stepsAr: [
      'اضغط "ابدأ فحص الصوت" في بيئة هادئة.',
      'في الخطوة الأولى: انزل بصوتك تدريجياً إلى أغلظ نغمة مريحة يمكنك إصدارها بثبات.',
      'في الخطوة الثانية: اصعد بنعومة إلى أعلى نغمة يمكنك غناؤها بنقاء دون صراخ.',
      'سيتعرف النظام تلقائياً على نغماتك ويحسب مساحتك بالأوكتاف ونوع صوتك.',
      'اضغط "حفظ الملف الصوتي" لتعتمد كل تمارين التطبيق على طبقتك الشخصية.',
    ],
    stepsEn: [
      'Press Start Profiler in a quiet environment.',
      'Step 1: Glide down to your lowest comfortable, stable chest pitch.',
      'Step 2: Glide smoothly up to your highest clear head tone without shouting.',
      'The engine automatically detects pitches, calculates octave span, and classifies your voice.',
      'Save your profile to tailor all app exercises to your unique physiological range.',
    ],
    commonMistakesAr: [
      'الضغط الشديد في النغمات المنخفضة مما يولد صوتاً ضعيفاً غير مريح.',
      'الصراخ أو الشد في الرقبة للوصول لنغمات مرتفعة خلال الفحص.',
    ],
    commonMistakesEn: [
      'Forcing artificial rasp on bottom notes.',
      'Straining or screaming to reach artificial high pitches.',
    ],
    expectedBenefitsAr: [
      'معرفة نوع صوتك بدقة علمية واضحة.',
      'تخصيص تمارين التطبيق بالكامل لتناسب قدراتك الحالية وتطورها بأمان.',
    ],
    expectedBenefitsEn: [
      'Crystal clear scientific understanding of your voice classification.',
      'Tailors all curriculum levels and warmups to your vocal sweet spot.',
    ],
    targetMusclesAndCavitiesAr: ['كامل المنظومة الحنجرية', 'الحبال الصوتية', 'الصدر والرأس'],
    targetMusclesAndCavitiesEn: ['Full Laryngeal Complex', 'Vocal Fold Length', 'Chest & Head Resonance'],
  },

  'section_warmup': {
    id: 'section_warmup',
    titleAr: 'تمارين الإحماء الصوتي اليومية المتكاملة',
    titleEn: 'Comprehensive Daily Vocal Warm-ups',
    subtitleAr: 'روتينات علمية متدرجة لحماية الحبال الصوتية وزيادة تدفق الدم وتجهيز الصوت قبل أي غناء',
    subtitleEn: 'Scientifically sequenced routines to increase vocal fold blood flow and elasticity',
    categoryAr: 'أقسام التطبيق الرئيسية',
    categoryEn: 'Main Sections',
    icon: '🔥',
    accentColor: 'pink',
    physiologicalGoalAr: 'زيادة تدفق الدورة الدموية إلى العضلات الحنجرية الداخلية، ترطيب الغشاء المخاطي للأوتار، ومنع الإصابات الصوتية والشد العضلي.',
    physiologicalGoalEn: 'Enhances micro-circulation to laryngeal muscles, lubricates vocal fold mucosa, and prevents voice injury and fatigue.',
    anatomicalMechanismAr: 'تبدأ التمارين بالمسالك شبه المغلقة (SOVT) مثل رفرفة الشفاه والدندنة لتسخين الأنسجة دون ضغط، ثم تتدرج إلى السلالم الخماسية والأربيجيو لتوسيع مدى التمدد العضلي، وتنتهي بالقفزات لضبط الاستجابة السريعة للحجاب الحاجز.',
    anatomicalMechanismEn: 'Sequences from low-stress SOVT bubbling to dynamic 5-tone scales and arpeggio leaps, progressively elevating neuromuscular agility and breath-voice coordination.',
    stepsAr: [
      'اختر التمرين المناسب لوقتك ومستواك (مبتدئ، متوسط، أو متقدم).',
      'ابدأ دائماً بتمارين رفرفة الشفاه (Lip Trills) لتدفئة الحبال أولاً.',
      'اتبع البيانو التفاعلي والميترونوم المضبوط تلقائياً لكل تمرين.',
      'غنِّ مع الدليل الصوتي وراقب مؤشر المطابقة في الوقت الحقيقي.',
    ],
    stepsEn: [
      'Select routine matching your schedule and level (Beginner, Intermediate, Advanced).',
      'Always open with gentle SOVT lip trills to warm up tissues safely.',
      'Follow the interactive piano and tempo-synchronized visual guide.',
      'Sing alongside audio playback and watch real-time pitch accuracy.',
    ],
    commonMistakesAr: [
      'تخطي الإحماء والبدء فوراً بالغناء بنغمات حادة أو طبقات عالية.',
      'ممارسة التمارين بصوت عالي جداً بدلاً من الصوت المعتدل الهادئ.',
    ],
    commonMistakesEn: [
      'Skipping warmups and jumping straight into belting high notes.',
      'Practicing warmups at maximum acoustic volume instead of relaxed mezzo-forte.',
    ],
    expectedBenefitsAr: [
      'صوت جاهز، نقي، ومسترسل في غضون 5 إلى 10 دقائق.',
      'حماية الحبال الصوتية من الالتهابات والتعب طويل الأمد.',
    ],
    expectedBenefitsEn: [
      'Voice sounds supple, resonant, and stage-ready in 5–10 minutes.',
      'Protects vocal fold mucosa from inflammation and chronic fatigue.',
    ],
    targetMusclesAndCavitiesAr: ['العضلات الحنجرية', 'الحجاب الحاجز', 'التجاويف الرنانة'],
    targetMusclesAndCavitiesEn: ['Intrinsic Laryngeal Muscles', 'Diaphragm', 'Resonating Chambers'],
  },

  'section_levels': {
    id: 'section_levels',
    titleAr: 'المنهاج التراكمي وأكاديمية قراءة النوتة الموسيقية',
    titleEn: 'Progressive Curriculum & Music Theory Academy',
    subtitleAr: 'منهاج تدريبي منظم من الصفر إلى الاحتراف مع اختبارات حية ودروس نظريات متكاملة',
    subtitleEn: 'Structured progression from foundational intervals to virtuoso sight-singing and theory',
    categoryAr: 'أقسام التطبيق الرئيسية',
    categoryEn: 'Main Sections',
    icon: '🏆',
    accentColor: 'indigo',
    physiologicalGoalAr: 'بناء المهارات التراكمية للمغني: الانتقال المنظم من النغمات الفردية إلى المسافات الموسيقية الصغيرة، ثم السلالم الكاملة، وتفكيك النوتات المعقدة وقراءتها بالعين والغناء المباشر.',
    physiologicalGoalEn: 'Builds systematic vocal mastery: progresses from single sustained pitches to minor/major intervals, full scales, and fluent sight-singing with real-time scoring.',
    anatomicalMechanismAr: 'يدمج المنهاج بين التدريب السمعي الإدراكي والتدريب الحركي الحنجري. كل مستوى يختبر دقة إصابة النغمات، الثبات الزمني، والسرعة الإيقاعية مع تقييم ذكي بالنجوم.',
    anatomicalMechanismEn: 'Merges auditory cognition with precise laryngeal motor control, evaluating target accuracy, duration stability, and rhythmic tempo locked to the metronome.',
    stepsAr: [
      'ابدأ من المستوى الأول في فئة المبتدئين ولا تنتقل لمستوى حتى تحقق 3 نجوم.',
      'استمع للجملة اللحنية أولاً؛ ثم غنِّها عند ظهور إشارة التسجيل الخضراء.',
      'استفد من تبويب "أكاديمية قراءة النوتة" لقراءة الشروحات النظرية والرسومات التفاعلية.',
      'أجرِ الاختبار السريع في نهاية كل درس نظري للتأكد من استيعابك الكامل.',
    ],
    stepsEn: [
      'Begin at Level 1 in Beginner Tier; earn 3 stars to advance to next challenge.',
      'Listen to the musical prompt first, then sing when the green active banner appears.',
      'Open the Music Theory Academy tab to read visual diagrams and explanations.',
      'Take lesson quizzes to solidify notation, rhythm, and clef comprehension.',
    ],
    commonMistakesAr: [
      'التسرع في تخطي المستويات دون إتقان ثبات النغمة في المستويات الأساسية.',
    ],
    commonMistakesEn: [
      'Rushing through levels without locking in pitch stability on fundamental intervals.',
    ],
    expectedBenefitsAr: [
      'قراءة النوتة الموسيقية بالعين وغنائها مباشرة بثقة تامة.',
      'السيطرة الكاملة على المسافات اللحنية والقفزات المعقدة.',
    ],
    expectedBenefitsEn: [
      'Sight-read sheet music notation and sing accurately on sight.',
      'Total command over musical intervals and chromatic leaps.',
    ],
    targetMusclesAndCavitiesAr: ['الذاكرة الموسيقية', 'الأوتار الصوتية', 'القشرة الدماغية'],
    targetMusclesAndCavitiesEn: ['Musical Memory', 'Vocal Folds', 'Visual-Auditory Cortex'],
  },

  'section_songMatch': {
    id: 'section_songMatch',
    titleAr: 'استوديو مطابقة الأغاني ومقارنة الصوت',
    titleEn: 'Song Match Studio & Performance Analysis',
    subtitleAr: 'غنِّ مع أي مقطع واكتشف نسبة تطابقك النغمي مع تحديد مواقع الخلل بدقة',
    subtitleEn: 'Sing along with reference audio, receive match % and pinpoint exact intonation flaws',
    categoryAr: 'أقسام التطبيق الرئيسية',
    categoryEn: 'Main Sections',
    icon: '🎵',
    accentColor: 'cyan',
    physiologicalGoalAr: 'تدريب المغني على الغناء في سياق موسيقي حي مع الحفاظ على الطبقة الصحيحة والإحساس اللحني دون التأثر بالآلات أو النشاز العارض.',
    physiologicalGoalEn: 'Conditions the singer to maintain accurate intonation and melodic phrasing inside dynamic musical backing tracks.',
    anatomicalMechanismAr: 'يقوم بمقارنة المسار اللحني المرجعي مع التردد الملتقط من حنجرتك في كل كسر من الثانية، ويحدد هل كان صوتك هابطاً (Flat) أو حاداً (Sharp) مع رسم بياني لمطابقة الأداء.',
    anatomicalMechanismEn: 'Performs multi-frame cross-correlation between reference melodic trajectory and live vocal frequency, highlighting intonation drift across time.',
    stepsAr: [
      'اختر قطعة موسيقية أو مقطع أغنية من المكتبة.',
      'اضغط "استمع للمقطع" لحفظ اللحن والإيقاع جيداً.',
      'اضغط "ابدأ الغناء والمطابقة" وغنِّ متزامناً مع الموسيقى.',
      'شاهد تقرير النتيجة النهائي مع نسبة التطابق المئوية وأماكن الخطأ المحددة بالثانية.',
    ],
    stepsEn: [
      'Select a song or melody track from the studio library.',
      'Audition the reference track to memorize phrasing and cadence.',
      'Press Start Singing and vocalize in sync with the backing melody.',
      'Review your comprehensive analysis report with match percentage and timestamped flaws.',
    ],
    commonMistakesAr: [
      'الغناء متأخراً عن الإيقاع أو رفع الصوت لدرجة تشويش الميكروفون.',
    ],
    commonMistakesEn: [
      'Singing behind the beat or overloading mic with excessive proximity volume.',
    ],
    expectedBenefitsAr: [
      'إتقان الغناء المتزامن مع الموسيقى والفرق الموسيقية.',
      'معالجة النشاز في سياق الأغاني الحقيقية بدقة جراحية.',
    ],
    expectedBenefitsEn: [
      'Mastery of synchronized vocal performance with instrumental bands.',
      'Pinpoint remediation of pitch drift in real song contexts.',
    ],
    targetMusclesAndCavitiesAr: ['الأذن التحليلية', 'الأوتار الصوتية', 'الإحساس الإيقاعي'],
    targetMusclesAndCavitiesEn: ['Analytical Auditory Ear', 'Vocal Folds', 'Rhythmic Cadence'],
  },

  'section_games': {
    id: 'section_games',
    titleAr: 'ألعاب تدريب الأذن والذاكرة الموسيقية',
    titleEn: 'Ear Training & Musical Memory Games',
    subtitleAr: 'تحديات تفاعلية مشوقة لشحذ حاسة السمع وتخمين النغمات وسرعة البديهة الصوتية',
    subtitleEn: 'Gamified auditory challenges to sharpen pitch identification and tonal reflexes',
    categoryAr: 'أقسام التطبيق الرئيسية',
    categoryEn: 'Main Sections',
    icon: '🎮',
    accentColor: 'amber',
    physiologicalGoalAr: 'تسريع الاستجابة العصبية بين الأذن والدماغ، وتطوير مهارة الأذن النسبية (Relative Pitch) والأذن المطلقة بطريقة تفاعلية مسلية.',
    physiologicalGoalEn: 'Accelerates auditory neural reaction time, building relative and absolute pitch recognition through competitive gaming dynamics.',
    anatomicalMechanismAr: 'تعتمد الألعاب على تحديات زمنية: تكرار النغمات المعزوفة، تمييز المسافات الصاعدة والهابطة، واصطياد النغمات بالصوت، مما يحفز مراكز المكافأة والذاكرة العضلية في الدماغ.',
    anatomicalMechanismEn: 'Leverages timed interval trials, melodic echo playback, and voice-controlled pitch tracking to activate dopamine reward pathways and auditory retention.',
    stepsAr: [
      'اختر إحدى ألعاب الأذن: بطل النغمات، حزر المسافة، أو ذاكرة الألحان.',
      'استمع للنغمة أو المسافة الموسيقية باهتمام بالغ.',
      'اختر الإجابة الصحيحة أو غنِّها بصوتك قبل انتهاء العداد الزمني.',
      'حقق أعلى سلاسل انتصارات متتالية واجمع النقاط لرفع تصنيفك الموسيقي.',
    ],
    stepsEn: [
      'Select a game: Pitch Hero, Interval Master, or Melodic Memory.',
      'Listen closely to the mystery sound or interval prompt.',
      'Tap the correct key or sing the answer before timer expires.',
      'Build long winning streaks and rack up points to climb leaderboards.',
    ],
    commonMistakesAr: [
      'التسرع في الإجابة بالحدس العشوائي دون تدريب الأذن على الإصغاء للتردد.',
    ],
    commonMistakesEn: [
      'Guessing impulsively without taking a split-second to audiate the tonal center.',
    ],
    expectedBenefitsAr: [
      'تطوير أذن موسيقية خارقة تستطيع معرفة أي نغمة بمجرد سماعها.',
      'سرعة بديهة وثقة تامة أثناء العزف أو الغناء مع الآخرين.',
    ],
    expectedBenefitsEn: [
      'Develops exceptional ear sensitivity capable of identifying pitches on first listen.',
      'Rapid auditory reflexes and spontaneous vocal confidence.',
    ],
    targetMusclesAndCavitiesAr: ['الفص الصدغي الدماغي', 'القشرة السمعية', 'الذاكرة العاملة'],
    targetMusclesAndCavitiesEn: ['Temporal Lobe', 'Auditory Cortex', 'Working Memory'],
  },

  'section_analytics': {
    id: 'section_analytics',
    titleAr: 'لوحة الإحصائيات ورصد التقدم الصوتي',
    titleEn: 'Vocal Analytics & Practice Performance Dashboard',
    subtitleAr: 'تقارير بيانية تفصيلية لدقة النغمات، استقرار الصوت، ساعات التدريب، وسجل التطور',
    subtitleEn: 'Comprehensive graphical metrics of pitch accuracy, stability, practice streak & history',
    categoryAr: 'أقسام التطبيق الرئيسية',
    categoryEn: 'Main Sections',
    icon: '📊',
    accentColor: 'indigo',
    physiologicalGoalAr: 'متابعة التطور الصوتي طويل المدى، وتحديد نقاط الضعف بدقة (مثل نغمات معينة يميل فيها الصوت للهبوط أو الصعود) لمعالجتها بالتمارين الموجهة.',
    physiologicalGoalEn: 'Tracks long-term vocal progression, diagnosing persistent intonation tendencies (sharp/flat notes) to guide targeted remedial practice.',
    anatomicalMechanismAr: 'يسجل النظام كل جلسة تدريبية: مدة الممارسة، متوسط انحراف السنت، نسب النجاح في السلالم، ونقاط القوة في الطبقات (القرار، الوسط، الجواب).',
    anatomicalMechanismEn: 'Logs session telemetry: duration, average cents deviation, scale pass rates, and performance across registers (chest, middle, head).',
    stepsAr: [
      'افتح لوحة الإحصائيات لمراجعة ملخص أدائك العام ونسبة دقتك الإجمالية.',
      'شاهد خريطة الترددات لاكتشاف أي النغمات تتقنها بامتياز وأيها يحتاج مزيداً من التدريب.',
      'حافظ على استمرار "أيام التدريب المتتالية" (Streak) لبناء عادة صوتية يومية راسخة.',
    ],
    stepsEn: [
      'Open the dashboard to view overall accuracy and practice time metrics.',
      'Inspect the pitch heat map to identify your most stable notes vs those needing work.',
      'Maintain your daily practice streak to build consistent muscle memory.',
    ],
    commonMistakesAr: [
      'إهمال مراجعة الإحصائيات وتكرار نفس الأخطاء دون تعديل استراتيجية التدريب.',
    ],
    commonMistakesEn: [
      'Neglecting metric feedback and repeating identical pitch habits without adjustment.',
    ],
    expectedBenefitsAr: [
      'رؤية واضحة وملموسة لمدى تقدم صوتك بالأرقام والرسوم البيانية.',
      'حافز يومي مستمر للوصول إلى أعلى مستويات الاحتراف الغنائي.',
    ],
    expectedBenefitsEn: [
      'Tangible, data-driven visualization of vocal growth over time.',
      'Sustained motivation to reach peak vocal performance.',
    ],
    targetMusclesAndCavitiesAr: ['الوعي الذاتي بالأداء', 'التخطيط الصوتي الذكي'],
    targetMusclesAndCavitiesEn: ['Performance Self-Awareness', 'Targeted Vocal Planning'],
  },
};
