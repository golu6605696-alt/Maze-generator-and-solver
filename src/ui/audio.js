/**
 * @file audio.js
 * Synthesized Web Audio sound effects for tactile mechanical feedback.
 * Defined in DESIGN.md section 6.1. Rate-limited to max 30 sounds/s. Zero sample files.
 */

class SoundSystem {
  constructor() {
    this._ctx = null;
    this._enabled = true;
    this._lastSoundTime = 0;
    this._minIntervalMs = 33; // max ~30 sounds/s
  }

  get enabled() {
    return this._enabled;
  }

  toggle() {
    this._enabled = !this._enabled;
    return this._enabled;
  }

  setEnabled(val) {
    this._enabled = val;
  }

  _initCtx() {
    if (!this._ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this._ctx = new AudioCtx();
      }
    }
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
  }

  play(type) {
    if (!this._enabled) return;
    const now = performance.now();
    if (now - this._lastSoundTime < this._minIntervalMs) return;
    this._lastSoundTime = now;

    try {
      this._initCtx();
      if (!this._ctx) return;
      const t = this._ctx.currentTime;

      switch (type) {
        case 'click':
          this._playClack(t);
          break;
        case 'tick':
          this._playTick(t);
          break;
        case 'step':
          this._playStep(t);
          break;
        case 'thud':
          this._playThud(t);
          break;
        case 'relic':
          this._playRelic(t);
          break;
        case 'win':
          this._playWin(t);
          break;
        case 'defeat':
          this._playDefeat(t);
          break;
      }
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  _playClack(t) {
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.04);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this._ctx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  _playTick(t) {
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

    osc.connect(gain);
    gain.connect(this._ctx.destination);
    osc.start(t);
    osc.stop(t + 0.015);
  }

  _playStep(t) {
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.05);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this._ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  _playThud(t) {
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this._ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  _playRelic(t) {
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.06);

      gain.gain.setValueAtTime(0.15, t + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.18);

      osc.connect(gain);
      gain.connect(this._ctx.destination);
      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.18);
    });
  }

  _playWin(t) {
    [440, 554.37, 659.25, 880].forEach((freq, i) => {
      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.09);

      gain.gain.setValueAtTime(0.2, t + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.35);

      osc.connect(gain);
      gain.connect(this._ctx.destination);
      osc.start(t + i * 0.09);
      osc.stop(t + i * 0.09 + 0.35);
    });
  }

  _playDefeat(t) {
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.linearRampToValueAtTime(45, t + 0.5);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this._ctx.destination);
    osc.start(t);
    osc.stop(t + 0.5);
  }
}

export const sound = new SoundSystem();
