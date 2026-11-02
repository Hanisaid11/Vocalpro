/**
 * Metronome & Tempo Engine
 * High-precision Web Audio API synthesis for musical tempo and rhythm pacing
 */

export type MetronomeBeatCallback = (beat: number, totalBeats: number, bpm: number) => void;
export type MetronomeStateCallback = (isRunning: boolean, bpm: number, beatsPerMeasure: number, isMuted: boolean) => void;

class MetronomeEngine {
  private audioCtx: AudioContext | null = null;
  private isRunning = false;
  private bpm = 80; // Default quarter note = 80 BPM
  private beatsPerMeasure = 4; // 4/4 time signature
  private currentBeat = 0;
  private nextBeatTime = 0;
  private timerId: number | null = null;
  private listeners: Set<MetronomeBeatCallback> = new Set();
  private stateListeners: Set<MetronomeStateCallback> = new Set();
  private isMuted = false;

  public setAudioContext(ctx: AudioContext) {
    this.audioCtx = ctx;
  }

  private async getAudioContext(): Promise<AudioContext> {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setBpm(newBpm: number) {
    const clamped = Math.min(240, Math.max(30, Math.round(newBpm)));
    if (this.bpm !== clamped) {
      this.bpm = clamped;
      this.notifyState();
    }
  }

  public getBpm(): number {
    return this.bpm;
  }

  public setTimeSignature(beats: number) {
    const clamped = Math.max(1, Math.min(12, beats));
    if (this.beatsPerMeasure !== clamped) {
      this.beatsPerMeasure = clamped;
      this.currentBeat = 0;
      this.notifyState();
    }
  }

  public getTimeSignature(): number {
    return this.beatsPerMeasure;
  }

  public setMuted(muted: boolean) {
    if (this.isMuted !== muted) {
      this.isMuted = muted;
      this.notifyState();
    }
  }

  public isSoundMuted(): boolean {
    return this.isMuted;
  }

  public subscribe(cb: MetronomeBeatCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public subscribeState(cb: MetronomeStateCallback): () => void {
    this.stateListeners.add(cb);
    cb(this.isRunning, this.bpm, this.beatsPerMeasure, this.isMuted);
    return () => this.stateListeners.delete(cb);
  }

  private notify(beat: number) {
    this.listeners.forEach((cb) => cb(beat, this.beatsPerMeasure, this.bpm));
  }

  private notifyState() {
    this.stateListeners.forEach((cb) => cb(this.isRunning, this.bpm, this.beatsPerMeasure, this.isMuted));
  }

  /**
   * Synthesize realistic acoustic woodblock metronome click
   */
  private playClick(time: number, isAccent: boolean) {
    if (this.isMuted || !this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      // Accent beat 1: higher pitched crisp woodblock (1200 Hz), other beats (800 Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isAccent ? 1250 : 850, time);
      osc.frequency.exponentialRampToValueAtTime(isAccent ? 500 : 350, time + 0.04);

      gain.gain.setValueAtTime(0.00001, time);
      gain.gain.linearRampToValueAtTime(isAccent ? 0.65 : 0.40, time + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.00001, time + 0.05);
      gain.gain.linearRampToValueAtTime(0, time + 0.055);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(time);
      osc.stop(time + 0.06);
    } catch {
      // Audio context cleanup handling
    }
  }

  private scheduleNextBeats() {
    if (!this.isRunning || !this.audioCtx) return;

    const secondsPerBeat = 60.0 / this.bpm;
    const currentTime = this.audioCtx.currentTime;

    while (this.nextBeatTime < currentTime + 0.1) {
      const isAccent = this.currentBeat === 0;
      this.playClick(this.nextBeatTime, isAccent);
      
      const beatToSend = this.currentBeat;
      window.setTimeout(() => {
        this.notify(beatToSend);
      }, Math.max(0, (this.nextBeatTime - currentTime) * 1000));

      this.nextBeatTime += secondsPerBeat;
      this.currentBeat = (this.currentBeat + 1) % this.beatsPerMeasure;
    }

    this.timerId = window.setTimeout(() => this.scheduleNextBeats(), 25);
  }

  public async start(startBpm?: number) {
    if (startBpm) {
      this.setBpm(startBpm);
    }
    if (this.isRunning) return;
    const ctx = await this.getAudioContext();
    this.isRunning = true;
    this.currentBeat = 0;
    this.nextBeatTime = ctx.currentTime + 0.05;
    this.scheduleNextBeats();
    this.notifyState();
  }

  public stop() {
    if (!this.isRunning && this.timerId === null) return;
    this.isRunning = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.currentBeat = 0;
    this.notify(-1); // Reset beat indicator
    this.notifyState();
  }

  public toggle(): boolean {
    if (this.isRunning) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
}

export const metronome = new MetronomeEngine();
