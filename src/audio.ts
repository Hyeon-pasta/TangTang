/**
 * Synthesizes retro sound effects using the Web Audio API.
 * High-performance, lightweight, and offline-ready!
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    // AudioContext will be initialized on first user interaction (safari/chrome policy)
  }

  private init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  private createOscillator(
    type: OscillatorType,
    freq: number,
    duration: number,
    gainStart: number,
    gainEnd: number = 0.01
  ) {
    this.init();
    if (!this.ctx || !this.enabled) return null;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gainNode.gain.setValueAtTime(gainStart, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(gainEnd, this.ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    return { osc, gainNode };
  }

  public playShoot() {
    const sound = this.createOscillator("triangle", 600, 0.12, 0.15);
    if (!sound || !this.ctx) return;
    const { osc } = sound;
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.12);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  public playHit() {
    const sound = this.createOscillator("sawtooth", 120, 0.1, 0.2);
    if (!sound || !this.ctx) return;
    const { osc } = sound;
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.1);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  public playGem() {
    const sound = this.createOscillator("sine", 980, 0.08, 0.1);
    if (!sound || !this.ctx) return;
    const { osc } = sound;
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime + 0.03);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  public playLevelUp() {
    this.init();
    if (!this.ctx || !this.enabled) return;

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C major arpeggio
    const now = this.ctx.currentTime;

    notes.forEach((freq, index) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + index * 0.06);
      
      gain.gain.setValueAtTime(0.12, now + index * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.06 + 0.2);
      
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      
      osc.start(now + index * 0.06);
      osc.stop(now + index * 0.06 + 0.2);
    });
  }

  public playBossAlert() {
    this.init();
    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const timeOffset = i * 0.5;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now + timeOffset);
      osc.frequency.linearRampToValueAtTime(110, now + timeOffset + 0.4);

      gain.gain.setValueAtTime(0.15, now + timeOffset);
      gain.gain.linearRampToValueAtTime(0.001, now + timeOffset + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + timeOffset);
      osc.stop(now + timeOffset + 0.45);
    }
  }

  public playGameOver() {
    this.init();
    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    const chords = [392.00, 311.13, 261.63, 196.00]; // G minor chord downward
    
    chords.forEach((freq, index) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + index * 0.15);
      osc.frequency.linearRampToValueAtTime(freq * 0.5, now + index * 0.15 + 0.6);
      
      gain.gain.setValueAtTime(0.2, now + index * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.15 + 0.8);
      
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      
      osc.start(now + index * 0.15);
      osc.stop(now + index * 0.15 + 0.8);
    });
  }

  public playUpgradeSelect() {
    const sound = this.createOscillator("sine", 587.33, 0.15, 0.12);
    if (!sound || !this.ctx) return;
    const { osc } = sound;
    osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.05);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  public playBomb() {
    this.init();
    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    // Low rumble explosion
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(10, now + 0.5);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + 0.5);
  }

  public playEvo() {
    this.init();
    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554, 659, 880, 1109, 1318]; // A major sparkling EVO chord
    notes.forEach((freq, index) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + index * 0.04);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + index * 0.04 + 0.3);

      gain.gain.setValueAtTime(0.1, now + index * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.04 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + index * 0.04);
      osc.stop(now + index * 0.04 + 0.45);
    });
  }
}

export const soundEngine = new SoundEngine();
