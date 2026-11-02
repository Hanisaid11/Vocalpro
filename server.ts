import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Helper to initialize GoogleGenAI safely with system key and telemetry header
  const getAIClient = () => {
    return new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  /**
   * POST /api/coach/analyze-pitch
   * Evaluates sung note's tone, vocal fold closure, and pitch stability using pitch history.
   */
  app.post('/api/coach/analyze-pitch', async (req, res) => {
    try {
      const {
        targetNote = 'C4',
        sungNote = 'C4',
        cents = 0,
        avgCentsDev = 5,
        stabilityScore = 80,
        clarity = 0.85,
        rms = 0.12,
        spectralCentroid = 1500,
        durationSec = 2.0,
        vibrato = null,
        sampleCount = 25,
        language = 'ar',
      } = req.body;

      const isArabic = language === 'ar';

      // Acoustic closure & tone inferences for contextual grounding
      const closureAssessment = clarity > 0.82
        ? 'Clean, firm glottal closure with strong harmonic definition'
        : clarity > 0.60
        ? 'Balanced moderate vocal fold closure with mild air flow'
        : 'Breathy, incomplete vocal fold closure (hypofunctional adduction)';

      const toneAssessment = spectralCentroid > 2200
        ? 'Bright, forward facial mask twang with strong acoustic harmonics'
        : spectralCentroid > 1100
        ? 'Warm, balanced pharyngeal resonance (Bel Canto posture)'
        : 'Mellow, deeper darker resonance with lowered larynx';

      const prompt = `You are an elite vocal pedagogue and voice scientist in VocalMaster Pro.
A singer just sang a note and requested an instant vocal analysis. Evaluate their performance using these acoustic and pitch history metrics:
- Note Sung: ${sungNote} (Target note was: ${targetNote})
- Pitch Intonation: Current deviation ${cents > 0 ? `+${cents}` : cents} cents (5-second average error: ±${Math.abs(avgCentsDev)} cents)
- Pitch Stability: ${stabilityScore}% consistency across ${durationSec.toFixed(1)} seconds (${sampleCount} pitch samples)
- Acoustic Clarity (Harmonic purity & fold contact proxy): ${(clarity * 100).toFixed(0)}% [${closureAssessment}]
- Energy / Volume (RMS): ${(rms * 100).toFixed(1)}%
- Spectral Centroid (Timbral Brightness): ${Math.round(spectralCentroid)} Hz [${toneAssessment}]
${vibrato ? `- Vibrato: ${(vibrato.rateHz ?? vibrato.rate ?? 5.5).toFixed(1)} Hz rate with ${(vibrato.extentCents ?? vibrato.depth ?? 25).toFixed(1)} cents depth` : '- Vibrato: Straight-tone sustain with minimal oscillation'}
- Target Language: ${isArabic ? 'Arabic (اللغة العربية الفصحى السلسة والمحفزة)' : 'English'}

Provide a structured, insightful, and motivating critique (around 70-110 words total) organized into:
1. Tone (النبرة والرنين): Critique their timbre, vowel placement, and acoustic warmth or brightness.
2. Vocal Fold Closure (إطباق الحبال الصوتية): Critique their glottal closure efficiency, breath management, and whether the sound is clean, breathy, or pressed.
3. Pitch Stability (ثبات النغمة): Critique their intonation centering, pitch drift, and sustained stability.
4. Coach Tip (نصيحة فورية): Exactly 1 practical physical instruction they can apply immediately to their next note.

Be encouraging, specific to the numbers, and pedagogically sound.`;

      try {
        if (!process.env.GEMINI_API_KEY) {
          throw new Error('No GEMINI_API_KEY configured');
        }

        const ai = getAIClient();
        const apiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        // 7-second timeout race to prevent hanging requests
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI response timed out')), 7000)
        );

        const response = await Promise.race([apiPromise, timeoutPromise]);

        res.json({
          critique: response.text,
          metrics: {
            tone: toneAssessment,
            closure: closureAssessment,
            stabilityScore: Math.round(stabilityScore),
            clarityPercent: Math.round(clarity * 100),
            avgCentsDev: Math.round(avgCentsDev * 10) / 10,
            durationSec: Math.round(durationSec * 10) / 10,
          },
        });
      } catch (geminiError: any) {
        console.warn('Gemini analyze-pitch fallback:', geminiError.message);
        // High-quality pedagogical fallback when offline or API limit reached
        const fallbackText = isArabic
          ? `• النبرة والرنين: رنين متوازن دافئ على نغمة ${sungNote} مع توجيه صوتي جيد في تجاويف الرنين الأمامية.
• إطباق الحبال الصوتية: إطباق ${clarity > 0.75 ? 'نقي ومحكم بدون تسريب هواء زائد' : 'معتدل؛ ركّز على دعم تدفق الهواء لتقليل النفس المتسرب والحفاظ على نقاء الذبذبة'}.
• ثبات النغمة: استقرار بنسبة ${stabilityScore}% وانحراف طفيف (${Math.abs(avgCentsDev)} سنت)، مما يعكس تحكماً عضلياً جيداً.
• نصيحة فورية: أرخِ عضلات الرقبة والفك السفلي تماماً ودع النفس يتدفق بحرية من الحجاب الحاجز.`
          : `• Tone & Resonance: Warm, balanced vocal tract placement on ${sungNote} with natural pharyngeal ring.
• Vocal Fold Closure: ${clarity > 0.75 ? 'Clean and firm vocal fold adduction with pure acoustic definition' : 'Moderate closure; energize lower abdominal breath support to reduce airiness'}.
• Pitch Stability: Solid ${stabilityScore}% stability with minimal drift (±${Math.abs(avgCentsDev)}¢).
• Coach Tip: Keep your jaw fully unhinged and imagine the tone spinning forward through your cheekbones.`;

        res.json({
          critique: fallbackText,
          metrics: {
            tone: toneAssessment,
            closure: closureAssessment,
            stabilityScore: Math.round(stabilityScore),
            clarityPercent: Math.round(clarity * 100),
            avgCentsDev: Math.round(avgCentsDev * 10) / 10,
            durationSec: Math.round(durationSec * 10) / 10,
          },
        });
      }
    } catch (err: any) {
      console.error('Server error in /api/coach/analyze-pitch:', err);
      res.status(500).json({ error: err.message || 'Pitch analysis failed' });
    }
  });

  /**
   * POST /api/coach/evaluate
   * Evaluates the user's pitch performance on a specific step with professional vocal coaching.
   */
  app.post('/api/coach/evaluate', async (req, res) => {
    try {
      const {
        stepNumber = 1,
        totalSteps = 5,
        stepTitle = 'Pitch Match',
        category = 'Warmup',
        targetNote = 'C4',
        sungNote = 'C4',
        cents = 0,
        stabilityScore = 85,
        userVoiceType = 'Tenor',
        lowestNote = 'C3',
        highestNote = 'G4',
        language = 'en',
      } = req.body;

      const prompt = `You are a world-class professional vocal coach in the mobile app VocalMaster Pro.
A student just completed this step of their vocal workout:
- Step: ${stepNumber}/${totalSteps} ("${stepTitle}")
- Category: ${category}
- Target Pitch: ${targetNote}
- User Detected Pitch: ${sungNote}
- Deviation: ${cents > 0 ? `+${cents}` : cents} cents
- Tone Stability: ${Math.round(stabilityScore)}%
- Singer Register: ${userVoiceType} (${lowestNote} to ${highestNote})
- Response Language: ${language === 'ar' ? 'Arabic (اللغة العربية الفصحى)' : 'English'}

Provide concise, encouraging, highly professional vocal coaching feedback (2-3 sentences max).
Highlight what they did right, address any breath support or throat tension hints, and give 1 practical instruction for their next note. Do not use generic praise; be specific and pedagogical.`;

      try {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        res.json({ feedback: response.text });
      } catch (geminiError: any) {
        console.warn('Gemini evaluation fallback:', geminiError.message);
        // High-quality pedagogical fallback if API key or network is unreachable
        const fallback = language === 'ar'
          ? `أداء متقن في خطوة "${stepTitle}"! ثبات نبرتك وصل إلى ${Math.round(stabilityScore)}%. حافظ على رخاوة الفك وتوسيع القفص الصدري لدعم رنين الصوت بدون شد الحبال الصوتية.`
          : `Great work on "${stepTitle}"! Your pitch stability reached ${Math.round(stabilityScore)}%. Keep your lower jaw relaxed and engage your lower abdominals to keep the tone vibrant and strain-free.`;
        res.json({ feedback: fallback });
      }
    } catch (err: any) {
      console.error('Server error in /api/coach/evaluate:', err);
      res.status(500).json({ error: err.message || 'Evaluation failed' });
    }
  });

  /**
   * POST /api/coach/ask
   * Answers a vocal technique question from the singer.
   */
  app.post('/api/coach/ask', async (req, res) => {
    try {
      const {
        question,
        userVoiceType = 'Vocalist',
        lowestNote = 'C3',
        highestNote = 'C5',
        currentStep = 'General',
        language = 'en',
      } = req.body;

      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: 'Question is required' });
      }

      const prompt = `You are an elite vocal coach and voice scientist answering a question from a singer in VocalMaster Pro.
Student Profile:
- Voice Type: ${userVoiceType} (${lowestNote} – ${highestNote})
- Current Context: ${currentStep}
- Language: ${language === 'ar' ? 'Arabic (اللغة العربية)' : 'English'}

Question: "${question}"

Provide a warm, anatomically accurate, and practical answer (under 80 words). Give immediate advice the singer can test right now.`;

      try {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        res.json({ reply: response.text });
      } catch (geminiError: any) {
        console.warn('Gemini ask fallback:', geminiError.message);
        const fallback = language === 'ar'
          ? 'نصيحة المدرب: سر الوصول للنغمات العالية براحة هو تقليل ضغط الهواء الزائد ورفع شراع الحنك الرخو (مثل بداية التثاؤب) مع إرخاء اللسان خلف الأسنان السفلية.'
          : 'Coach Tip: The key to effortless high notes is moderating breath pressure, lifting the soft palate gently (as in beginning a yawn), and keeping the tongue rested forward.';
        res.json({ reply: fallback });
      }
    } catch (err: any) {
      console.error('Server error in /api/coach/ask:', err);
      res.status(500).json({ error: err.message || 'Coach advice failed' });
    }
  });

  /**
   * POST /api/coach/explain-theory
   * Answers music theory questions or provides simplified child-friendly / practical explanations
   * of sheet music reading, clefs, rhythms, accidentals, and musical terms.
   */
  app.post('/api/coach/explain-theory', async (req, res) => {
    try {
      const {
        lessonTitle = 'قراءة النوتة والمدرج الموسيقي',
        topic = 'clefs_and_notes',
        question = '',
        questionType = 'explain_simple',
        language = 'ar',
      } = req.body;

      const isArabic = language === 'ar';

      const prompt = `You are a friendly, world-class music theory professor and vocal pedagogue in VocalMaster Pro.
A student is studying the lesson: "${lessonTitle}" (Topic: ${topic}).
User Question / Request: "${question || (questionType === 'explain_simple' ? 'اشرح لي هذا المفهوم بتبسيط شديد كأن عمري 10 سنوات مع تشبيه ممتع' : 'أعطني مثالاً عملياً من الحياة اليومية أو الأغاني لفهم هذا الدرس')}".
Language: ${isArabic ? 'Arabic (اللغة العربية الفصحى السلسة والمشجعة)' : 'English'}.

Guidelines:
1. Explain with crystal clarity, warmth, and fun visual analogies (e.g. comparing the 5 lines to fingers of a hand, or note values to cutting a pizza or apples).
2. Keep it concise, engaging, and inspiring (around 80-120 words).
3. End with exactly 1 quick memory trick or practical tip.`;

      try {
        if (!process.env.GEMINI_API_KEY) {
          throw new Error('No GEMINI_API_KEY');
        }
        const ai = getAIClient();
        const apiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI response timed out')), 4000)
        );

        const response = await Promise.race([apiPromise, timeoutPromise]);
        res.json({ reply: response.text });
      } catch (geminiError: any) {
        console.warn('Gemini explain-theory fallback:', geminiError.message);
        const fallback = isArabic
          ? `المدرج الموسيقي يشبه تماماً أصابع يدك الخمسة! الخط الأول في الأسفل، والخط الخامس في الأعلى. كلما صعدت نغمة للأعلى في المدرج، أصبح الصوت أرق وأعلى (مثل صوت العصفور)، وكلما هبطت للأسفل، أصبح الصوت أعمق وأغلظ (مثل زئير الأسد). مفتاح صول يدور حول الخط الثاني ليعطيه اسم نغمة "صول"، ومن هناك تستطيع عدّ باقي النغمات بالترتيب: دو، ري، مي، فا، صول، لا، سي!
💡 حيلة للحفظ: تذكر نغمات الخطوط في مفتاح صول بالترتيب: مي - صول - سي - ري - فا.`
          : `Think of the 5 staff lines like the 5 fingers of your hand! Note positions tell you pitch: higher on the staff means higher pitch (like a bird), lower means deep pitch (like thunder). Treble clef swirls around line 2 to crown it as G4. From there, notes simply climb in alphabetical order: C-D-E-F-G-A-B!
💡 Memory Tip: Treble staff lines from bottom to top are E-G-B-D-F (Every Good Boy Does Fine).`;

        res.json({ reply: fallback });
      }
    } catch (err: any) {
      console.error('Server error in /api/coach/explain-theory:', err);
      res.status(500).json({ error: err.message || 'Explanation failed' });
    }
  });

  /**
   * POST /api/coach/workout
   * Generates a personalized step-by-step vocalise curriculum adapted to user's range.
   */
  app.post('/api/coach/workout', async (req, res) => {
    try {
      const {
        goal = 'general_warmup',
        voiceType = 'Tenor',
        lowestMidi = 48,
        highestMidi = 72,
        middleMidi = 60,
        language = 'en',
      } = req.body;

      // Returns a structured 5-step curriculum
      const steps = [
        {
          stepNumber: 1,
          category: 'posture_breath',
          titleEn: 'Diaphragmatic Breath & Rib Expansion',
          titleAr: 'التنفس الحجابي وتوسيع القفص الصدري',
          instructionEn: 'Stand tall with relaxed shoulders. Inhale deeply expanding your lower ribs for 4 seconds, then sustain a steady "Sssss" hiss for 8 seconds.',
          instructionAr: 'قف باستقامة مع استرخاء الكتفين. تنفس بعمق ووسع أضلاعك السفلية لـ 4 ثوانٍ، ثم أطلق صوت الهمس "سسسس" بثبات لـ 8 ثوانٍ.',
          targetMidi: middleMidi,
          targetDurationSec: 12,
          vowelPrompt: 'Sssss (Hiss)',
          goalType: 'breath_timer',
        },
        {
          stepNumber: 2,
          category: 'semi_occluded',
          titleEn: 'Lip Trill Tone Centering',
          titleAr: 'تمركز النغمة بطنين الشفاه',
          instructionEn: 'Perform a relaxed lip trill (motorboat sound) on your middle comfortable pitch. Feel the forward buzz in your lips without throat squeeze.',
          instructionAr: 'قم بعمل طنين الشفاه (صوت المحرك المريح) على نغمة ارتكازك الوسطى. اشعر بالاهتزاز الأمامي في الشفتين دون ضغط على الحلق.',
          targetMidi: middleMidi,
          targetDurationSec: 5,
          vowelPrompt: 'Brrr (Lip Trill)',
          goalType: 'pitch_hold',
        },
        {
          stepNumber: 3,
          category: 'vowel_resonance',
          titleEn: 'Open Vowel "Ah" Sustained Pure Pitch',
          titleAr: 'تثبيت نغمة نقية بحرف "آه" المفتوح',
          instructionEn: 'Sing a warm, resonant "Ah" vowel targeting the pitch. Lock your pitch within the green target indicator for at least 3 seconds.',
          instructionAr: 'غنِّ حرف "آه" دافئاً ورناناً موجهاً للنغمة المطلوبة. ثبّت نغمتك داخل المؤشر الأخضر لـ 3 ثوانٍ على الأقل.',
          targetMidi: Math.min(highestMidi - 2, middleMidi + 2),
          targetDurationSec: 4,
          vowelPrompt: 'Ah [ɑː]',
          goalType: 'pitch_hold',
        },
        {
          stepNumber: 4,
          category: 'agility_arpeggio',
          titleEn: '3-Tone Triad Agility & Register Transition',
          titleAr: 'مرونة الثلاثي الصوتي والانتقال بين الطبقات',
          instructionEn: 'Sing the 3-tone arpeggio (Do-Mi-Sol-Mi-Do). Focus on light, crisp vocal tract resonance and smooth octave navigation.',
          instructionAr: 'غنِّ التدرج الثلاثي (دو - مي - صول - مي - دو). ركّز على خفة ونقاء النبرة والانتقال السلس بين النغمات.',
          targetMidi: Math.min(highestMidi, middleMidi + 4),
          targetDurationSec: 6,
          vowelPrompt: 'Yah-Yah-Yah',
          goalType: 'agility',
        },
        {
          stepNumber: 5,
          category: 'range_challenge',
          titleEn: 'Upper Register Expansion & Head Voice Release',
          titleAr: 'توسيع الطبقة العالية وإطلاق الصوت الرأسي',
          instructionEn: 'Glide gently up towards your upper range using an "Oo" or "Ee" vowel. Keep sound light and floaty like a siren.',
          instructionAr: 'تدرج بنعومة نحو نغماتك العالية باستخدام حرف "أوو" أو "إيي". اجعل الصوت خفيفاً وطافياً كصفارة مريحة.',
          targetMidi: Math.min(highestMidi, middleMidi + 7),
          targetDurationSec: 5,
          vowelPrompt: 'Oooo [uː]',
          goalType: 'pitch_hold',
        },
      ];

      res.json({ steps });
    } catch (err: any) {
      console.error('Server error in /api/coach/workout:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Production vs Development handler
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VocalMaster Pro server listening on port ${PORT}`);
  });
}

startServer();
