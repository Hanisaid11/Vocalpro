import {
  PitchDetectionResult,
  InstrumentType,
  VocalSampleVowel,
  EasternMaqam,
  ReverbSpacePreset,
} from '../types/vocal';
import { frequencyToNote, MAQAM_DEFINITIONS } from '../utils/noteUtils';
import { PitchDetector } from './pitchDetection';
import { vocalSampleLibrary } from './vocalSamples';
import { metronome, MetronomeBeatCallback, MetronomeStateCallback } from './metronome';
import { pianoSoundManager, PianoSoundSource } from './pianoSoundManager';

export type PitchCallback = (result: PitchDetectionResult) => void;

export interface RecordedNote {
  midi: number;
  frequency: number;
  startTime: number;
  duration: number;
}

export type RecordingStateCallback = (isRecording: boolean, isPlaying: boolean, notesCount: number) => void;

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private pitchDetector: PitchDetector | null = null;
  private isListening = false;
  private animationFrameId: number | null = null;
  private pitchListeners: Set<PitchCallback> = new Set();
  private recordingListeners: Set<RecordingStateCallback> = new Set();

  private timeBuffer: Float32Array<ArrayBuffer> | null = null;
  private freqBuffer: Uint8Array<ArrayBuffer> | null = null;

  // Master output and soft-limiter architecture
  private masterGain: GainNode | null = null;
  private softLimiterGain: GainNode | null = null;
  private masterLimiter: DynamicsCompressorNode | null = null;
  private softLimiterCurveNode: WaveShaperNode | null = null;
  private finalOutputGain: GainNode | null = null;

  // Reverb Engine (Convolution & Procedural Room Space)
  private reverbConvolver: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private currentReverbPreset: ReverbSpacePreset = 'hall';

  // Musical Parameters
  private currentInstrument: InstrumentType = 'piano';
  private currentVocalVowel: VocalSampleVowel = 'aah';
  private currentMaqam: EasternMaqam = 'standard_12tet';
  private referencePitchA4 = 440;
  private tuningToleranceCents = 12;
  private noteDurationSeconds: number = 2;
  private currentTempoBpm: number = 80;

  // Recording & Playback State
  private isRecordingActive = false;
  private isPlaybackActive = false;
  private recordingStartTime = 0;
  private recordedNotesList: RecordedNote[] = [];
  private playbackTimeouts: number[] = [];

  public setInstrument(inst: InstrumentType) {
    this.currentInstrument = inst;
  }

  public getInstrument(): InstrumentType {
    return this.currentInstrument;
  }

  public setPianoSource(source: PianoSoundSource): void {
    pianoSoundManager.setSource(source, this.audioCtx || undefined);
  }

  public getPianoSource(): PianoSoundSource {
    return pianoSoundManager.getSource();
  }

  public setVocalVowel(vowel: VocalSampleVowel) {
    this.currentVocalVowel = vowel;
  }

  public getVocalVowel(): VocalSampleVowel {
    return this.currentVocalVowel;
  }

  public setMaqam(maqam: EasternMaqam) {
    this.currentMaqam = maqam;
  }

  public getMaqam(): EasternMaqam {
    return this.currentMaqam;
  }

  public setReferencePitch(a4: number) {
    this.referencePitchA4 = a4;
  }

  public getReferencePitch(): number {
    return this.referencePitchA4;
  }

  public setTempoBpm(bpm: number): void {
    this.currentTempoBpm = Math.max(30, Math.min(240, Math.round(bpm)));
    metronome.setBpm(this.currentTempoBpm);
  }

  public getTempoBpm(): number {
    return this.currentTempoBpm;
  }

  public setNoteDuration(sec: number | 'short' | 'medium' | 'long', tempoBpm?: number): void {
    let durSec = 2.2;
    if (sec === 'short') {
      durSec = 1.2;
      if (tempoBpm === undefined) tempoBpm = 120;
    } else if (sec === 'medium') {
      durSec = 2.2;
      if (tempoBpm === undefined) tempoBpm = 80;
    } else if (sec === 'long') {
      durSec = 3.8;
      if (tempoBpm === undefined) tempoBpm = 50;
    } else {
      durSec = Math.max(0.1, sec);
    }

    this.noteDurationSeconds = durSec;
    if (tempoBpm !== undefined) {
      this.currentTempoBpm = Math.max(30, Math.min(240, Math.round(tempoBpm)));
    } else {
      // Intelligently derive musical BPM if not explicitly passed
      this.currentTempoBpm = Math.max(30, Math.min(240, Math.round(60 / (this.noteDurationSeconds * 0.65))));
    }
  }

  public getNoteDuration(): number {
    return this.noteDurationSeconds;
  }

  public setNoteDurationBeats(beats: number) {
    this.noteDurationSeconds = Math.max(0.1, beats);
  }

  public getNoteDurationBeats(): number {
    return this.noteDurationSeconds;
  }

  public setTuningTolerance(cents: number) {
    this.tuningToleranceCents = cents;
  }

  public getTuningTolerance(): number {
    return this.tuningToleranceCents;
  }

  public setReverbPreset(preset: ReverbSpacePreset) {
    this.currentReverbPreset = preset;
    this.updateReverbMix();
  }

  public getReverbPreset(): ReverbSpacePreset {
    return this.currentReverbPreset;
  }

  /**
   * Generates procedural acoustic impulse response buffer for warm studio & concert hall space
   */
  private buildImpulseResponse(ctx: AudioContext, durationSeconds: number, decayRate: number): AudioBuffer {
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * durationSeconds);
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const envelope = Math.exp(-i / (rate * decayRate));
      // Organic stereo diffusion
      left[i] = (Math.random() * 2 - 1) * envelope;
      right[i] = (Math.random() * 2 - 1) * envelope;
    }
    return impulse;
  }

  private updateReverbMix() {
    if (!this.reverbGain || !this.dryGain || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    let dryVal = 1.0;
    let revVal = 0.0001;

    if (this.currentReverbPreset === 'dry') {
      dryVal = 1.0;
      revVal = 0.0001;
    } else if (this.currentReverbPreset === 'studio') {
      dryVal = 0.9;
      revVal = 0.22;
      this.reverbConvolver!.buffer = this.buildImpulseResponse(this.audioCtx, 1.2, 0.4);
    } else if (this.currentReverbPreset === 'hall') {
      dryVal = 0.85;
      revVal = 0.38;
      this.reverbConvolver!.buffer = this.buildImpulseResponse(this.audioCtx, 2.6, 0.9);
    } else if (this.currentReverbPreset === 'cathedral') {
      dryVal = 0.75;
      revVal = 0.65;
      this.reverbConvolver!.buffer = this.buildImpulseResponse(this.audioCtx, 4.2, 1.8);
    }

    // Smooth linear ramps to eliminate clicking artifacts when switching presets during active playback
    this.dryGain.gain.cancelScheduledValues(now);
    this.dryGain.gain.setValueAtTime(this.dryGain.gain.value, now);
    this.dryGain.gain.linearRampToValueAtTime(dryVal, now + 0.025);

    this.reverbGain.gain.cancelScheduledValues(now);
    this.reverbGain.gain.setValueAtTime(this.reverbGain.gain.value, now);
    this.reverbGain.gain.linearRampToValueAtTime(revVal, now + 0.025);
  }

  /**
   * Generates a smooth, analog-modeled soft-knee saturation transfer curve.
   * Completely transparent & linear for levels up to -3.7 dBFS (|x| < 0.65),
   * then applies smooth asymptotic hyperbolic tangent compression capping at ±0.96.
   * Combined with 4x oversampling, this eliminates 100% of digital hard-clipping and cracking.
   */
  private createSoftLimiterCurve(samples = 4096): Float32Array<ArrayBuffer> {
    const buffer = new ArrayBuffer(samples * 4);
    const curve = new Float32Array(buffer);
    for (let i = 0; i < samples; ++i) {
      const x = (i * 2) / (samples - 1) - 1; // Range: -1.0 to +1.0
      if (Math.abs(x) < 0.65) {
        curve[i] = x;
      } else if (x > 0) {
        const excess = (x - 0.65) / 0.35;
        curve[i] = 0.65 + 0.31 * Math.tanh(excess);
      } else {
        const excess = (-x - 0.65) / 0.35;
        curve[i] = -(0.65 + 0.31 * Math.tanh(excess));
      }
    }
    return curve;
  }

  /**
   * Initialize Web Audio Context with Studio Soft-Limiter Master Chain
   * Graph: Note Voices -> masterGain -> Dry/Reverb Matrix -> softLimiterGain -> DynamicsCompressor -> SoftLimiter WaveShaper (4x oversampled) -> finalOutputGain -> destination
   */
  public async getAudioContext(): Promise<AudioContext> {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass({ latencyHint: 'interactive' });

      // 1. Master summing gain - calibrated for clean headroom across polyphonic voices
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(0.70, this.audioCtx.currentTime);

      // 2. Acoustic Reverb Convolver & Dry/Wet Matrix
      this.reverbConvolver = this.audioCtx.createConvolver();
      this.reverbConvolver.buffer = this.buildImpulseResponse(this.audioCtx, 2.4, 0.85);

      this.reverbGain = this.audioCtx.createGain();
      this.dryGain = this.audioCtx.createGain();

      this.masterGain.connect(this.dryGain);
      this.masterGain.connect(this.reverbConvolver);
      this.reverbConvolver.connect(this.reverbGain);

      // 3. Dedicated Pre-Limiter GainNode for headroom staging
      this.softLimiterGain = this.audioCtx.createGain();
      this.softLimiterGain.gain.setValueAtTime(0.88, this.audioCtx.currentTime);

      this.dryGain.connect(this.softLimiterGain);
      this.reverbGain.connect(this.softLimiterGain);

      // 4. Fast-acting transparent DynamicsCompressor peak-leveler stage
      this.masterLimiter = this.audioCtx.createDynamicsCompressor();
      this.masterLimiter.threshold.setValueAtTime(-1.5, this.audioCtx.currentTime);
      this.masterLimiter.knee.setValueAtTime(4.0, this.audioCtx.currentTime);
      this.masterLimiter.ratio.setValueAtTime(16.0, this.audioCtx.currentTime);
      this.masterLimiter.attack.setValueAtTime(0.002, this.audioCtx.currentTime); // 2ms ultra-fast catch
      this.masterLimiter.release.setValueAtTime(0.060, this.audioCtx.currentTime); // 60ms smooth recovery

      this.softLimiterGain.connect(this.masterLimiter);

      // 5. Analog Soft-Limiter Curve (WaveShaperNode with 4x anti-aliased oversampling)
      this.softLimiterCurveNode = this.audioCtx.createWaveShaper();
      this.softLimiterCurveNode.curve = this.createSoftLimiterCurve(4096);
      this.softLimiterCurveNode.oversample = '4x';

      this.masterLimiter.connect(this.softLimiterCurveNode);

      // 6. Final Output GainNode with clickless startup ramp & soft-limiter link to destination
      this.finalOutputGain = this.audioCtx.createGain();
      this.finalOutputGain.gain.setValueAtTime(0.0001, this.audioCtx.currentTime);
      this.finalOutputGain.gain.linearRampToValueAtTime(0.92, this.audioCtx.currentTime + 0.02);

      this.softLimiterCurveNode.connect(this.finalOutputGain);
      this.finalOutputGain.connect(this.audioCtx.destination);
      this.updateReverbMix();

      // Preload high-quality human vocal timbre samples ('aah', 'ooh', 'eee', 'mmm', 'lip-trill')
      vocalSampleLibrary.preloadStandardTimbres(this.audioCtx);
      // Preload priority piano samples for selected piano sound source
      pianoSoundManager.preloadEssentialNotes(this.audioCtx);
    }

    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
      if (this.finalOutputGain) {
        const now = this.audioCtx.currentTime;
        this.finalOutputGain.gain.cancelScheduledValues(now);
        this.finalOutputGain.gain.setValueAtTime(0.0001, now);
        this.finalOutputGain.gain.linearRampToValueAtTime(0.92, now + 0.015);
      }
    }

    return this.audioCtx;
  }

  /**
   * Request microphone stream and attach pitch analyzer
   */
  public async startListening(): Promise<boolean> {
    try {
      const ctx = await this.getAudioContext();

      if (this.isListening) return true;

      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
        },
      };

      try {
        this.micStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.05;

      this.micSource = ctx.createMediaStreamSource(this.micStream);
      this.micSource.connect(this.analyser);

      this.timeBuffer = new Float32Array(new ArrayBuffer(this.analyser.fftSize * 4));
      this.freqBuffer = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));

      this.pitchDetector = new PitchDetector(ctx.sampleRate, this.analyser.fftSize, 0.14);

      this.isListening = true;
      this.runDetectionLoop();

      return true;
    } catch (error) {
      console.error('Failed to initialize microphone audio engine:', error);
      this.stopListening();
      throw error;
    }
  }

  public stopListening() {
    this.isListening = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }

    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }

    this.notifyListeners({
      frequency: null,
      note: null,
      cents: 0,
      clarity: 0,
      rms: 0,
      spectralCentroid: 0,
      isInTune: false,
      stability: 0,
      vibrato: null,
    });
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public subscribe(cb: PitchCallback): () => void {
    this.pitchListeners.add(cb);
    return () => {
      this.pitchListeners.delete(cb);
    };
  }

  private notifyListeners(result: PitchDetectionResult) {
    this.pitchListeners.forEach((cb) => cb(result));
  }

  private runDetectionLoop = () => {
    if (!this.isListening || !this.analyser || !this.pitchDetector || !this.timeBuffer || !this.freqBuffer) {
      return;
    }

    this.analyser.getFloatTimeDomainData(this.timeBuffer);
    this.analyser.getByteFrequencyData(this.freqBuffer);

    const analysis = this.pitchDetector.detectPitch(this.timeBuffer, this.freqBuffer);

    let noteResult = null;
    let cents = 0;
    let isInTune = false;

    if (analysis.frequency) {
      const conv = frequencyToNote(analysis.frequency, this.referencePitchA4);
      noteResult = conv.note;
      cents = conv.cents;

      // In Maqam quarter tone mode, check against microtone offset
      const maqamDef = MAQAM_DEFINITIONS[this.currentMaqam];
      if (noteResult && maqamDef && maqamDef.centsOffsets[noteResult.midi % 12] !== undefined) {
        const expectedOffset = maqamDef.centsOffsets[noteResult.midi % 12];
        const microtonalDeviation = Math.abs(cents - expectedOffset);
        isInTune = microtonalDeviation <= this.tuningToleranceCents;
      } else {
        isInTune = Math.abs(cents) <= this.tuningToleranceCents;
      }
    }

    const result: PitchDetectionResult = {
      frequency: analysis.frequency,
      note: noteResult,
      cents,
      clarity: analysis.clarity,
      rms: analysis.rms,
      spectralCentroid: analysis.spectralCentroid,
      isInTune,
      stability: analysis.clarity > 0.85 ? 1 : analysis.clarity,
      vibrato: analysis.vibrato,
    };

    this.notifyListeners(result);

    this.animationFrameId = requestAnimationFrame(this.runDetectionLoop);
  };

  /**
   * Helper to attach stereo spatial position based on keyboard geometry (low left, high right)
   */
  private createSpatialPanner(ctx: AudioContext, midi: number): AudioNode {
    try {
      const panner = ctx.createStereoPanner();
      // Pan from -0.75 (A0) to +0.75 (C8), centered at C4 (60)
      const pan = Math.max(-0.75, Math.min(0.75, (midi - 60) / 44));
      panner.pan.setValueAtTime(pan, ctx.currentTime);
      return panner;
    } catch {
      // Fallback pass-through gain
      return ctx.createGain();
    }
  }

  /**
   * Play tone by exact frequency
   */
  public async playTone(
    frequency: number,
    durationSeconds: number = 1.2,
    instrument?: InstrumentType,
    midiNote?: number,
    vowel?: VocalSampleVowel
  ): Promise<number> {
    const type = instrument || this.currentInstrument || 'piano';
    const ctx = await this.getAudioContext();
    const now = ctx.currentTime;
    const effectiveMidi = midiNote || Math.round(69 + 12 * Math.log2(frequency / this.referencePitchA4));

    // Calculate quarter-tone frequency offset if Maqam is active
    let actualFreq = frequency;
    const maqamDef = MAQAM_DEFINITIONS[this.currentMaqam];
    if (maqamDef && maqamDef.centsOffsets[effectiveMidi % 12] !== undefined) {
      const cents = maqamDef.centsOffsets[effectiveMidi % 12];
      actualFreq = frequency * Math.pow(2, cents / 1200);
    }

    // Track in recording if active
    if (this.isRecordingActive && effectiveMidi) {
      const offsetMs = Date.now() - this.recordingStartTime;
      this.recordedNotesList.push({
        midi: effectiveMidi,
        frequency: actualFreq,
        startTime: offsetMs,
        duration: durationSeconds * 1000,
      });
      this.notifyRecordingListeners();
    }

    if (type === 'oud') {
      return this.synthesizeRealOud(ctx, now, actualFreq, durationSeconds, effectiveMidi);
    } else if (type === 'guitar') {
      return this.synthesizeRealGuitar(ctx, now, actualFreq, durationSeconds, effectiveMidi);
    } else if (type === 'vocal') {
      return this.synthesizeRealVocal(ctx, now, actualFreq, durationSeconds, vowel || this.currentVocalVowel, effectiveMidi);
    } else if (type === 'strings') {
      return this.synthesizeRealStrings(ctx, now, actualFreq, durationSeconds, effectiveMidi);
    } else {
      return pianoSoundManager.playNote(
        ctx,
        now,
        actualFreq,
        durationSeconds,
        effectiveMidi,
        this.masterGain || ctx.destination,
        (c, m) => this.createSpatialPanner(c, m)
      );
    }
  }

  public async playNote(
    midiNote: number,
    durationSeconds?: number,
    instrument?: InstrumentType,
    vowel?: VocalSampleVowel
  ): Promise<number> {
    const dur = durationSeconds !== undefined ? durationSeconds : this.noteDurationSeconds;
    const frequency = this.referencePitchA4 * Math.pow(2, (midiNote - 69) / 12);
    return this.playTone(frequency, dur, instrument, midiNote, vowel);
  }

  public async playChord(
    midiNotes: number[],
    durationSeconds: number = 2.2,
    arpeggiated: boolean = false,
    instrument?: InstrumentType
  ): Promise<void> {
    midiNotes.forEach((midi, idx) => {
      const delay = arpeggiated ? idx * 0.12 : 0;
      setTimeout(() => {
        this.playNote(midi, durationSeconds, instrument);
      }, delay * 1000);
    });
  }

  public async playSequence(
    midiNotes: number[],
    stepDurationMs?: number,
    instrument?: InstrumentType,
    noteDurationSec?: number
  ): Promise<void> {
    const stepMs = stepDurationMs ?? Math.round((60 / this.currentTempoBpm) * 1000);
    const dur = noteDurationSec ?? Math.max(0.35, (stepMs / 1000) * 0.9);
    midiNotes.forEach((midi, i) => {
      setTimeout(() => {
        this.playNote(midi, dur, instrument);
      }, i * stepMs);
    });
  }

  /**
   * Plays a scale adjusting setTimeout intervals for each note in the scale according to duration:
   * 'short' (1.2s intervals), 'medium' (2.2s intervals), or 'long' (3.8s intervals)
   */
  public playScale(
    midiNotes: number[],
    duration: 'short' | 'medium' | 'long' | 'custom' | number = 'medium',
    instrument?: InstrumentType,
    onStepChange?: (stepIndex: number) => void,
    onComplete?: () => void
  ): () => void {
    return this.playScaleWithTempo(
      midiNotes,
      duration,
      undefined,
      instrument,
      onStepChange,
      onComplete
    );
  }

  /**
   * Plays a musical scale sequentially respecting the exact configured tempo (BPM)
   * and note duration interval, adjusting the setTimeout intervals for each note in the scale.
   * Returns a cleanup cancellation function.
   */
  public playScaleWithTempo(
    midiNotes: number[],
    noteDurationSeconds?: number | 'short' | 'medium' | 'long' | 'custom',
    tempoBpm?: number,
    instrument?: InstrumentType,
    onStepChange?: (stepIndex: number) => void,
    onComplete?: () => void
  ): () => void {
    let durSec = this.noteDurationSeconds;
    let bpm = tempoBpm ?? this.currentTempoBpm;

    if (noteDurationSeconds === 'short') {
      durSec = 1.2;
      if (tempoBpm === undefined) bpm = 120;
    } else if (noteDurationSeconds === 'medium') {
      durSec = 2.2;
      if (tempoBpm === undefined) bpm = 80;
    } else if (noteDurationSeconds === 'long') {
      durSec = 3.8;
      if (tempoBpm === undefined) bpm = 50;
    } else if (noteDurationSeconds === 'custom') {
      durSec = this.noteDurationSeconds;
    } else if (typeof noteDurationSeconds === 'number') {
      durSec = Math.max(0.2, noteDurationSeconds);
    }

    if (bpm !== undefined) {
      this.currentTempoBpm = bpm;
    }
    this.noteDurationSeconds = durSec;

    // Dynamically adjust setTimeout intervals for each note in the scale accordingly
    const stepIntervalMs = Math.round(durSec * 1000);
    const soundDurationSec = Math.max(0.35, durSec * 0.88);
    const timeouts: number[] = [];

    midiNotes.forEach((midi, idx) => {
      const t = window.setTimeout(() => {
        if (onStepChange) onStepChange(idx);
        this.playNote(midi, soundDurationSec, instrument);
      }, idx * stepIntervalMs);
      timeouts.push(t);
    });

    const finishTimeout = window.setTimeout(() => {
      if (onComplete) onComplete();
    }, midiNotes.length * stepIntervalMs + 200);
    timeouts.push(finishTimeout);

    return () => {
      timeouts.forEach((id) => clearTimeout(id));
    };
  }

  /**
   * Realistic Concert Grand Piano Model with Stereo Spatial Panning
   * Crystal-clear acoustic hammer strike, pure spruce body resonance, zero scratch/crackle ("بدون أي خشة")
   */
  private synthesizeRealGrandPiano(
    ctx: AudioContext,
    now: number,
    freq: number,
    duration: number,
    midi: number
  ): number {
    const noteGain = ctx.createGain();
    const panner = this.createSpatialPanner(ctx, midi);

    const naturalRingTime = Math.max(
      duration,
      Math.min(8.5, 6.8 * Math.pow(110 / Math.max(27.5, freq), 0.32))
    );

    // Natural multi-stage grand piano envelope (smooth, anti-click, headroom-safe)
    noteGain.gain.setValueAtTime(0.00001, now);
    noteGain.gain.linearRampToValueAtTime(0.70, now + 0.006); // Smooth hammer impact attack
    noteGain.gain.exponentialRampToValueAtTime(0.50, now + 0.16); // Singing bloom
    noteGain.gain.exponentialRampToValueAtTime(0.22, now + naturalRingTime * 0.45);
    noteGain.gain.exponentialRampToValueAtTime(0.00001, now + naturalRingTime);
    noteGain.gain.linearRampToValueAtTime(0, now + naturalRingTime + 0.02);

    // Soundboard spruce resonance with gentle, clean peaking (no clipping)
    const soundboard = ctx.createBiquadFilter();
    soundboard.type = 'peaking';
    soundboard.frequency.setValueAtTime(140, now);
    soundboard.Q.setValueAtTime(1.2, now);
    soundboard.gain.setValueAtTime(1.2, now); // +1.2 dB warm wood body

    const soundboardHigh = ctx.createBiquadFilter();
    soundboardHigh.type = 'peaking';
    soundboardHigh.frequency.setValueAtTime(820, now);
    soundboardHigh.Q.setValueAtTime(1.1, now);
    soundboardHigh.gain.setValueAtTime(0.8, now); // +0.8 dB natural brilliance

    // Anti-aliasing smooth lowpass filter to prevent high-frequency distortion/crackle
    const antiHarshFilter = ctx.createBiquadFilter();
    antiHarshFilter.type = 'lowpass';
    antiHarshFilter.frequency.setValueAtTime(11500, now);
    antiHarshFilter.Q.setValueAtTime(0.707, now);

    // Organic felt hammer impact: Pure sub-low frequency thud (anti-click smooth ramp)
    const hammerOsc = ctx.createOscillator();
    const hammerGain = ctx.createGain();
    hammerOsc.type = 'sine';
    const hammerPitch = Math.min(160, Math.max(65, freq * 0.45));
    hammerOsc.frequency.setValueAtTime(hammerPitch, now);
    hammerOsc.frequency.exponentialRampToValueAtTime(42, now + 0.022);

    hammerGain.gain.setValueAtTime(0.00001, now);
    hammerGain.gain.linearRampToValueAtTime(0.032, now + 0.003); // 3ms smooth attack ramp
    hammerGain.gain.exponentialRampToValueAtTime(0.00001, now + 0.026);
    hammerGain.gain.linearRampToValueAtTime(0, now + 0.028);

    hammerOsc.connect(hammerGain);
    hammerGain.connect(soundboard);
    hammerOsc.start(now);
    hammerOsc.stop(now + 0.032);

    // Realistic string stiffness inharmonicity coefficient
    const B = 0.00024;
    const partials = [
      { n: 1, amp: 1.0, decayMult: 1.0 },
      { n: 2, amp: 0.52, decayMult: 0.86 },
      { n: 3, amp: 0.28, decayMult: 0.68 },
      { n: 4, amp: 0.14, decayMult: 0.50 },
      { n: 5, amp: 0.07, decayMult: 0.36 },
      { n: 6, amp: 0.035, decayMult: 0.24 },
    ];

    // Controlled partial summing to guarantee full headroom against distortion
    const baseAmp = 0.22;

    partials.forEach((p) => {
      const partialFreq = p.n * freq * Math.sqrt(1 + B * p.n * p.n);
      if (partialFreq > 12500) return;

      const osc = ctx.createOscillator();
      osc.type = p.n === 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(partialFreq, now);

      const pGain = ctx.createGain();
      const peakAmp = p.amp * baseAmp;
      const attackTime = 0.005;
      pGain.gain.setValueAtTime(0.00001, now);
      pGain.gain.linearRampToValueAtTime(peakAmp, now + attackTime); // Anti-click attack ramp

      const pDecayTime = Math.max(0.12, naturalRingTime * p.decayMult);
      const bloomTime = Math.min(now + 0.18, now + pDecayTime * 0.4);
      pGain.gain.exponentialRampToValueAtTime(Math.max(0.00005, peakAmp * 0.32), bloomTime);
      pGain.gain.exponentialRampToValueAtTime(0.00001, now + pDecayTime);
      pGain.gain.linearRampToValueAtTime(0, now + pDecayTime + 0.02);

      osc.connect(pGain);
      pGain.connect(soundboard);
      osc.start(now);
      osc.stop(now + pDecayTime + 0.04);

      // Organic unison string chorusing on fundamental
      if (p.n === 1) {
        const unisonOsc = ctx.createOscillator();
        unisonOsc.type = 'sine';
        unisonOsc.frequency.setValueAtTime(freq * 1.00028, now); // +0.28 cents natural shimmer

        const uGain = ctx.createGain();
        uGain.gain.setValueAtTime(0.00001, now);
        uGain.gain.linearRampToValueAtTime(peakAmp * 0.45, now + 0.006); // Anti-click attack ramp
        uGain.gain.exponentialRampToValueAtTime(0.00001, now + naturalRingTime);
        uGain.gain.linearRampToValueAtTime(0, now + naturalRingTime + 0.02);

        unisonOsc.connect(uGain);
        uGain.connect(soundboard);
        unisonOsc.start(now);
        unisonOsc.stop(now + naturalRingTime + 0.04);
      }
    });

    soundboard.connect(soundboardHigh);
    soundboardHigh.connect(antiHarshFilter);
    antiHarshFilter.connect(noteGain);
    noteGain.connect(panner);
    panner.connect(this.masterGain || ctx.destination);

    return naturalRingTime;
  }

  /**
   * Realistic Arabic Oud with Double-Course Micro-chorusing & Kas'ah Bowl Formants
   */
  private synthesizeRealOud(
    ctx: AudioContext,
    now: number,
    freq: number,
    duration: number,
    midi: number
  ): number {
    const noteGain = ctx.createGain();
    const panner = this.createSpatialPanner(ctx, midi);

    // Smooth note envelope attack and release
    noteGain.gain.setValueAtTime(0.00001, now);
    noteGain.gain.linearRampToValueAtTime(0.85, now + 0.005);
    const sustainEnd = Math.max(now + 0.02, now + duration - 0.06);
    noteGain.gain.setValueAtTime(0.85, sustainEnd);
    noteGain.gain.exponentialRampToValueAtTime(0.00001, now + duration);
    noteGain.gain.linearRampToValueAtTime(0, now + duration + 0.02);

    // Risha plectrum transient with smooth 2ms micro-ramp (zero click/pop)
    const rishaBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.012), ctx.sampleRate);
    const rishaData = rishaBuffer.getChannelData(0);
    for (let i = 0; i < rishaData.length; i++) {
      rishaData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.002));
    }
    const rishaSource = ctx.createBufferSource();
    rishaSource.buffer = rishaBuffer;
    const rishaFilter = ctx.createBiquadFilter();
    rishaFilter.type = 'bandpass';
    rishaFilter.frequency.setValueAtTime(2400, now);
    rishaFilter.Q.setValueAtTime(3.0, now);
    const rishaGain = ctx.createGain();
    rishaGain.gain.setValueAtTime(0.00001, now);
    rishaGain.gain.linearRampToValueAtTime(0.30, now + 0.002); // 2ms anti-click attack
    rishaGain.gain.exponentialRampToValueAtTime(0.00001, now + 0.012);
    rishaGain.gain.linearRampToValueAtTime(0, now + 0.015);

    rishaSource.connect(rishaFilter);
    rishaFilter.connect(rishaGain);
    rishaGain.connect(noteGain);
    rishaSource.start(now);
    rishaSource.stop(now + 0.018);

    // Kas'ah 3-Band Bowl Filters
    const bowlLow = ctx.createBiquadFilter();
    bowlLow.type = 'peaking';
    bowlLow.frequency.setValueAtTime(210, now);
    bowlLow.Q.setValueAtTime(2.2, now);
    bowlLow.gain.setValueAtTime(6.0, now);

    const bowlMid = ctx.createBiquadFilter();
    bowlMid.type = 'peaking';
    bowlMid.frequency.setValueAtTime(580, now);
    bowlMid.Q.setValueAtTime(2.5, now);
    bowlMid.gain.setValueAtTime(5.5, now);

    const bowlHigh = ctx.createBiquadFilter();
    bowlHigh.type = 'peaking';
    bowlHigh.frequency.setValueAtTime(1150, now);
    bowlHigh.Q.setValueAtTime(2.0, now);
    bowlHigh.gain.setValueAtTime(4.0, now);

    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    const oscOct = ctx.createOscillator();
    const oscThird = ctx.createOscillator();

    oscA.type = 'triangle';
    oscB.type = 'sawtooth';
    oscOct.type = 'sine';
    oscThird.type = 'sine';

    oscA.frequency.setValueAtTime(freq * 0.9993, now);
    oscB.frequency.setValueAtTime(freq * 1.0007, now);
    oscOct.frequency.setValueAtTime(freq * 2.001, now);
    oscThird.frequency.setValueAtTime(freq * 3.002, now);

    const gainA = ctx.createGain();
    const gainB = ctx.createGain();
    const gainOct = ctx.createGain();
    const gainThird = ctx.createGain();

    // Smooth ramps for all oscillator voices
    gainA.gain.setValueAtTime(0.00001, now);
    gainA.gain.linearRampToValueAtTime(0.60, now + 0.004); // 4ms attack ramp
    gainA.gain.exponentialRampToValueAtTime(0.18, now + Math.min(0.2, duration * 0.4));
    gainA.gain.exponentialRampToValueAtTime(0.00001, now + duration);
    gainA.gain.linearRampToValueAtTime(0, now + duration + 0.02);

    gainB.gain.setValueAtTime(0.00001, now);
    gainB.gain.linearRampToValueAtTime(0.40, now + 0.005); // 5ms attack ramp
    gainB.gain.exponentialRampToValueAtTime(0.12, now + Math.min(0.18, duration * 0.4));
    gainB.gain.exponentialRampToValueAtTime(0.00001, now + duration);
    gainB.gain.linearRampToValueAtTime(0, now + duration + 0.02);

    const octDuration = Math.max(0.03, Math.min(duration, 0.45));
    gainOct.gain.setValueAtTime(0.00001, now);
    gainOct.gain.linearRampToValueAtTime(0.22, now + 0.003); // 3ms attack ramp
    gainOct.gain.exponentialRampToValueAtTime(0.00001, now + octDuration);
    gainOct.gain.linearRampToValueAtTime(0, now + octDuration + 0.02);

    const thirdDuration = Math.max(0.025, Math.min(duration, 0.25));
    gainThird.gain.setValueAtTime(0.00001, now);
    gainThird.gain.linearRampToValueAtTime(0.10, now + 0.003); // 3ms attack ramp
    gainThird.gain.exponentialRampToValueAtTime(0.00001, now + thirdDuration);
    gainThird.gain.linearRampToValueAtTime(0, now + thirdDuration + 0.02);

    oscA.connect(gainA);
    oscB.connect(gainB);
    oscOct.connect(gainOct);
    oscThird.connect(gainThird);

    gainA.connect(bowlLow);
    gainB.connect(bowlLow);
    gainOct.connect(bowlLow);
    gainThird.connect(bowlLow);

    bowlLow.connect(bowlMid);
    bowlMid.connect(bowlHigh);
    bowlHigh.connect(noteGain);

    noteGain.connect(panner);
    panner.connect(this.masterGain || ctx.destination);

    oscA.start(now);
    oscB.start(now);
    oscOct.start(now);
    oscThird.start(now);

    const stopTime = now + duration + 0.04;
    oscA.stop(stopTime);
    oscB.stop(stopTime);
    oscOct.stop(stopTime);
    oscThird.stop(stopTime);

    return duration;
  }

  private synthesizeRealGuitar(
    ctx: AudioContext,
    now: number,
    freq: number,
    duration: number,
    midi: number
  ): number {
    const noteGain = ctx.createGain();
    const panner = this.createSpatialPanner(ctx, midi);

    // Smooth overall note envelope
    noteGain.gain.setValueAtTime(0.00001, now);
    noteGain.gain.linearRampToValueAtTime(0.85, now + 0.005);
    const guitarSustainEnd = Math.max(now + 0.02, now + duration - 0.08);
    noteGain.gain.setValueAtTime(0.85, guitarSustainEnd);
    noteGain.gain.exponentialRampToValueAtTime(0.00001, now + duration);
    noteGain.gain.linearRampToValueAtTime(0, now + duration + 0.02);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3800, now);
    filter.frequency.exponentialRampToValueAtTime(950, now + duration);
    filter.Q.setValueAtTime(1.8, now);

    const bodyRes = ctx.createBiquadFilter();
    bodyRes.type = 'peaking';
    bodyRes.frequency.setValueAtTime(110, now);
    bodyRes.Q.setValueAtTime(2.0, now);
    bodyRes.gain.setValueAtTime(5.0, now);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 2, now);

    const g1 = ctx.createGain();
    const g2 = ctx.createGain();

    // 4ms smooth attack ramp on osc1 (eliminates sharp sawtooth electrical onset click)
    g1.gain.setValueAtTime(0.00001, now);
    g1.gain.linearRampToValueAtTime(0.55, now + 0.004);
    g1.gain.exponentialRampToValueAtTime(0.00001, now + duration);
    g1.gain.linearRampToValueAtTime(0, now + duration + 0.02);

    // 3ms smooth attack ramp on osc2
    g2.gain.setValueAtTime(0.00001, now);
    g2.gain.linearRampToValueAtTime(0.28, now + 0.003);
    g2.gain.exponentialRampToValueAtTime(0.00001, now + duration * 0.6);
    g2.gain.linearRampToValueAtTime(0, now + duration * 0.6 + 0.02);

    osc1.connect(g1);
    osc2.connect(g2);
    g1.connect(bodyRes);
    g2.connect(bodyRes);
    bodyRes.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(panner);
    panner.connect(this.masterGain || ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.04);
    osc2.stop(now + duration + 0.04);
    return duration;
  }

  /**
   * High-Quality Human Vocal Sample Playback
   * Uses real AudioBuffer samples and multi-sampled acoustic voice modeling from vocalSampleLibrary:
   * Supports seamless switching between: 'aah', 'ooh', 'eee', 'mmm', 'lip-trill', 'laa', 'nay'
   */
  private synthesizeRealVocal(
    ctx: AudioContext,
    now: number,
    freq: number,
    duration: number,
    vowel?: VocalSampleVowel,
    midi: number = 60
  ): number {
    const activeVowel = vowel || this.currentVocalVowel || 'aah';
    const panner = this.createSpatialPanner(ctx, midi);
    const masterDest = this.masterGain || ctx.destination;

    return vocalSampleLibrary.playVocalSample(
      ctx,
      now,
      freq,
      duration,
      activeVowel,
      panner,
      masterDest
    );
  }

  private synthesizeRealStrings(
    ctx: AudioContext,
    now: number,
    freq: number,
    duration: number,
    midi: number
  ): number {
    const noteGain = ctx.createGain();
    const panner = this.createSpatialPanner(ctx, midi);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2800, now);
    filter.Q.setValueAtTime(1.2, now);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc3.type = 'triangle';

    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 1.002, now);
    osc3.frequency.setValueAtTime(freq * 0.998, now);

    const g1 = ctx.createGain();
    const g2 = ctx.createGain();
    const g3 = ctx.createGain();

    const strAttack = Math.min(0.08, duration * 0.2);
    const strRelease = Math.min(0.12, duration * 0.25);
    const strSustainEnd = Math.max(now + strAttack + 0.01, now + duration - strRelease);

    // Smooth 6ms voice attack ramps to eliminate oscillator start clicks
    g1.gain.setValueAtTime(0.00001, now);
    g1.gain.linearRampToValueAtTime(0.32, now + 0.006);
    g1.gain.setValueAtTime(0.32, strSustainEnd);
    g1.gain.exponentialRampToValueAtTime(0.00001, now + duration);
    g1.gain.linearRampToValueAtTime(0, now + duration + 0.02);

    g2.gain.setValueAtTime(0.00001, now);
    g2.gain.linearRampToValueAtTime(0.26, now + 0.006);
    g2.gain.setValueAtTime(0.26, strSustainEnd);
    g2.gain.exponentialRampToValueAtTime(0.00001, now + duration);
    g2.gain.linearRampToValueAtTime(0, now + duration + 0.02);

    g3.gain.setValueAtTime(0.00001, now);
    g3.gain.linearRampToValueAtTime(0.30, now + 0.006);
    g3.gain.setValueAtTime(0.30, strSustainEnd);
    g3.gain.exponentialRampToValueAtTime(0.00001, now + duration);
    g3.gain.linearRampToValueAtTime(0, now + duration + 0.02);

    osc1.connect(g1);
    osc2.connect(g2);
    osc3.connect(g3);

    g1.connect(filter);
    g2.connect(filter);
    g3.connect(filter);

    filter.connect(noteGain);
    noteGain.connect(panner);
    panner.connect(this.masterGain || ctx.destination);

    // Master note envelope attack and release
    noteGain.gain.setValueAtTime(0.00001, now);
    noteGain.gain.linearRampToValueAtTime(0.70, now + strAttack);
    noteGain.gain.setValueAtTime(0.70, strSustainEnd);
    noteGain.gain.exponentialRampToValueAtTime(0.00001, now + duration);
    noteGain.gain.linearRampToValueAtTime(0, now + duration + 0.02);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    const stopTime = now + duration + 0.04;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    osc3.stop(stopTime);
    return duration;
  }

  public startRecording() {
    this.isRecordingActive = true;
    this.recordedNotesList = [];
    this.recordingStartTime = Date.now();
    this.notifyRecordingListeners();
  }

  public stopRecording(): RecordedNote[] {
    this.isRecordingActive = false;
    this.notifyRecordingListeners();
    return [...this.recordedNotesList];
  }

  public isRecording(): boolean {
    return this.isRecordingActive;
  }

  public isPlaying(): boolean {
    return this.isPlaybackActive;
  }

  public getRecordedNotes(): RecordedNote[] {
    return [...this.recordedNotesList];
  }

  public clearRecording() {
    this.stopPlayback();
    this.recordedNotesList = [];
    this.notifyRecordingListeners();
  }

  public playRecording(onNotePlay?: (midi: number) => void, onComplete?: () => void) {
    if (this.recordedNotesList.length === 0) return;
    this.stopPlayback();
    this.isPlaybackActive = true;
    this.notifyRecordingListeners();

    let maxTime = 0;
    this.recordedNotesList.forEach((n) => {
      const timeout = window.setTimeout(() => {
        this.playTone(n.frequency, Math.max(0.4, n.duration / 1000));
        if (onNotePlay) onNotePlay(n.midi);
      }, n.startTime);
      this.playbackTimeouts.push(timeout);

      const endTime = n.startTime + n.duration;
      if (endTime > maxTime) maxTime = endTime;
    });

    const finishTimeout = window.setTimeout(() => {
      this.isPlaybackActive = false;
      this.notifyRecordingListeners();
      if (onComplete) onComplete();
    }, maxTime + 300);

    this.playbackTimeouts.push(finishTimeout);
  }

  public playBackRecording(onNotePlay?: (midi: number) => void, onComplete?: () => void) {
    return this.playRecording(onNotePlay, onComplete);
  }

  public stopPlayback() {
    this.playbackTimeouts.forEach((t) => clearTimeout(t));
    this.playbackTimeouts = [];
    this.isPlaybackActive = false;
    this.notifyRecordingListeners();
  }

  public subscribeRecording(cb: RecordingStateCallback): () => void {
    this.recordingListeners.add(cb);
    return () => {
      this.recordingListeners.delete(cb);
    };
  }

  private notifyRecordingListeners() {
    this.recordingListeners.forEach((cb) =>
      cb(this.isRecordingActive, this.isPlaybackActive, this.recordedNotesList.length)
    );
  }

  public async playSuccessChime() {
    const ctx = await this.getAudioContext();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, idx) => {
      const noteStart = now + idx * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0.00001, noteStart);
      gain.gain.linearRampToValueAtTime(0.22, noteStart + 0.012); // Anti-click attack ramp
      gain.gain.exponentialRampToValueAtTime(0.00001, noteStart + 0.38);
      gain.gain.linearRampToValueAtTime(0, noteStart + 0.40);

      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(noteStart);
      osc.stop(noteStart + 0.42);
    });
  }

  public async playTick(isAccented: boolean = false) {
    const ctx = await this.getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isAccented ? 1200 : 800, now);

    // 3ms anti-click attack ramp
    gain.gain.setValueAtTime(0.00001, now);
    gain.gain.linearRampToValueAtTime(isAccented ? 0.30 : 0.20, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.05);
    gain.gain.linearRampToValueAtTime(0, now + 0.055);

    osc.connect(gain);
    gain.connect(this.masterGain || ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // ==========================================
  // Global Metronome & Tempo Utility Methods
  // ==========================================
  public get metronome() {
    return metronome;
  }

  public async startMetronome(bpm?: number): Promise<void> {
    const targetBpm = bpm ?? this.currentTempoBpm;
    this.currentTempoBpm = targetBpm;
    await metronome.start(targetBpm);
  }

  public stopMetronome(): void {
    metronome.stop();
  }

  public toggleMetronome(): boolean {
    return metronome.toggle();
  }

  public isMetronomeRunning(): boolean {
    return metronome.getIsRunning();
  }

  public setMetronomeBpm(bpm: number): void {
    this.currentTempoBpm = Math.max(30, Math.min(240, Math.round(bpm)));
    metronome.setBpm(this.currentTempoBpm);
  }

  public getMetronomeBpm(): number {
    return metronome.getBpm();
  }

  public setMetronomeTimeSignature(beats: number): void {
    metronome.setTimeSignature(beats);
  }

  public getMetronomeTimeSignature(): number {
    return metronome.getTimeSignature();
  }

  public setMetronomeMuted(muted: boolean): void {
    metronome.setMuted(muted);
  }

  public isMetronomeMuted(): boolean {
    return metronome.isSoundMuted();
  }

  public subscribeMetronome(cb: MetronomeBeatCallback): () => void {
    return metronome.subscribe(cb);
  }

  public subscribeMetronomeState(cb: MetronomeStateCallback): () => void {
    return metronome.subscribeState(cb);
  }
}

export const audioEngine = new AudioEngine();
export { pianoSoundManager, PIANO_SOURCES, type PianoSoundSource, type PianoSourceOption } from './pianoSoundManager';
