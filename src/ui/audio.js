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
        case 'portal':
          this._playPortal(t);
          break;
        case 'whoosh':
          this._playWhoosh(t);
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

  _playPortal(t) {
    // 1. Deep sub-bass energy surge
    const bassOsc = this._ctx.createOscillator();
    const bassGain = this._ctx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(65, t);
    bassOsc.frequency.exponentialRampToValueAtTime(160, t + 1.2);
    bassGain.gain.setValueAtTime(0.01, t);
    bassGain.gain.linearRampToValueAtTime(0.28, t + 0.6);
    bassGain.gain.exponentialRampToValueAtTime(0.001, t + 1.6);
    bassOsc.connect(bassGain);
    bassGain.connect(this._ctx.destination);
    bassOsc.start(t);
    bassOsc.stop(t + 1.6);

    // 2. Swirling portal resonance whoosh
    const vortexOsc = this._ctx.createOscillator();
    const vortexGain = this._ctx.createGain();
    vortexOsc.type = 'triangle';
    vortexOsc.frequency.setValueAtTime(180, t);
    vortexOsc.frequency.exponentialRampToValueAtTime(720, t + 1.3);
    vortexGain.gain.setValueAtTime(0.01, t);
    vortexGain.gain.linearRampToValueAtTime(0.22, t + 0.8);
    vortexGain.gain.exponentialRampToValueAtTime(0.001, t + 1.7);
    vortexOsc.connect(vortexGain);
    vortexGain.connect(this._ctx.destination);
    vortexOsc.start(t);
    vortexOsc.stop(t + 1.7);

    // 3. Ethereal celestial harmonics
    [432, 648, 864, 1296].forEach((freq, idx) => {
      const harmOsc = this._ctx.createOscillator();
      const harmGain = this._ctx.createGain();
      harmOsc.type = 'sine';
      harmOsc.frequency.setValueAtTime(freq, t + 0.1 * idx);
      harmOsc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 1.4);
      harmGain.gain.setValueAtTime(0.001, t + 0.1 * idx);
      harmGain.gain.linearRampToValueAtTime(0.08, t + 0.4 + 0.1 * idx);
      harmGain.gain.exponentialRampToValueAtTime(0.001, t + 1.6);
      harmOsc.connect(harmGain);
      harmGain.connect(this._ctx.destination);
      harmOsc.start(t + 0.1 * idx);
      harmOsc.stop(t + 1.6);
    });
  }

  _playWhoosh(t) {
    if (!this._ctx) return;
    const dur = 1.25;

    // 1. Aerodynamic "husssshhh" air rush (pink/smooth noise with resonant sweeping bandpass)
    const bufferSize = Math.floor(this._ctx.sampleRate * dur);
    const noiseBuffer = this._ctx.createBuffer(1, bufferSize, this._ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.0990460;
      b1 = 0.96300 * b1 + white * 0.1416500;
      b2 = 0.57000 * b2 + white * 0.5698000;
      data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.22;
    }

    const noiseSource = this._ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const bpf = this._ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.Q.setValueAtTime(2.4, t);
    // Sweeps from low air turbulence -> high "husssshhh" rush -> soft gentle hush
    bpf.frequency.setValueAtTime(260, t);
    bpf.frequency.exponentialRampToValueAtTime(1100, t + dur * 0.52);
    bpf.frequency.exponentialRampToValueAtTime(320, t + dur);

    const noiseGain = this._ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, t);
    noiseGain.gain.linearRampToValueAtTime(0.35, t + dur * 0.48);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noiseSource.connect(bpf);
    bpf.connect(noiseGain);
    noiseGain.connect(this._ctx.destination);

    noiseSource.start(t);
    noiseSource.stop(t + dur);

    // 2. Drone rotor displacement undertone (smooth aerodynamic motor hum in air)
    const droneOsc = this._ctx.createOscillator();
    const droneGain = this._ctx.createGain();
    droneOsc.type = 'sawtooth';
    droneOsc.frequency.setValueAtTime(80, t);
    droneOsc.frequency.exponentialRampToValueAtTime(165, t + dur * 0.5);
    droneOsc.frequency.exponentialRampToValueAtTime(90, t + dur);

    const droneFilter = this._ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(200, t);
    droneFilter.frequency.exponentialRampToValueAtTime(420, t + dur * 0.5);
    droneFilter.frequency.exponentialRampToValueAtTime(160, t + dur);

    droneGain.gain.setValueAtTime(0.001, t);
    droneGain.gain.linearRampToValueAtTime(0.12, t + dur * 0.48);
    droneGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    droneOsc.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(this._ctx.destination);

    droneOsc.start(t);
    droneOsc.stop(t + dur);
  }
}

export const sound = new SoundSystem();
