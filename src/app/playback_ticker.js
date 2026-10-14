/**
 * @file playback_ticker.js
 * Fixed-timestep animation and stepping ticker for maze generation and solving.
 * Defined in ARCHITECTURE.md section 5.3.
 */

import { FRAME_BUDGET_MS } from '../core/constants.js';

export const PlaybackState = Object.freeze({
  STOPPED: 'STOPPED',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  DONE: 'DONE',
});

export class PlaybackTicker {
  /**
   * @param {object} options
   * @param {() => Generator} options.getIterator Callback returning the active generator
   * @param {(event: object) => void} options.onStep Callback invoked per step event
   * @param {(result: any) => void} options.onDone Callback invoked when generator finishes
   * @param {(state: string) => void} [options.onStateChange]
   */
  constructor(options) {
    this._getIterator = options.getIterator;
    this._onStep = options.onStep;
    this._onDone = options.onDone;
    this._onStateChange = options.onStateChange || (() => {});

    this._state = PlaybackState.STOPPED;
    this._speed = 30; // steps per second
    this._iterator = null;
    this._animId = null;
    this._lastTimestamp = 0;
    this._accumulator = 0;

    // Auto-pause when tab is hidden to avoid background catch-up burst
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this._state === PlaybackState.PLAYING) {
          this.pause();
        }
      });
    }
  }

  get state() {
    return this._state;
  }

  get speed() {
    return this._speed;
  }

  setSpeed(speed) {
    this._speed = speed;
  }

  /**
   * Starts or resumes playback.
   */
  play() {
    if (this._state === PlaybackState.DONE) {
      this.reset();
    }
    if (!this._iterator) {
      this._iterator = this._getIterator();
    }
    this._setState(PlaybackState.PLAYING);
    this._lastTimestamp = performance.now();
    this._accumulator = 0;
    this._loop(this._lastTimestamp);
  }

  /**
   * Pauses playback.
   */
  pause() {
    if (this._state === PlaybackState.PLAYING) {
      this._setState(PlaybackState.PAUSED);
      if (this._animId) {
        cancelAnimationFrame(this._animId);
        this._animId = null;
      }
    }
  }

  /**
   * Steps forward exactly one event.
   */
  step() {
    if (this._state === PlaybackState.PLAYING) {
      this.pause();
    }
    if (!this._iterator) {
      this._iterator = this._getIterator();
      this._setState(PlaybackState.PAUSED);
    }
    this._advanceOne();
  }

  /**
   * Resets ticker.
   */
  reset() {
    this.pause();
    this._iterator = null;
    this._accumulator = 0;
    this._setState(PlaybackState.STOPPED);
  }

  _setState(newState) {
    if (this._state !== newState) {
      this._state = newState;
      this._onStateChange(this._state);
    }
  }

  _advanceOne() {
    if (!this._iterator) return false;
    const res = this._iterator.next();
    if (res.done) {
      this._setState(PlaybackState.DONE);
      this._onDone(res.value);
      return false;
    }
    this._onStep(res.value);
    return true;
  }

  _loop(timestamp) {
    if (this._state !== PlaybackState.PLAYING) return;

    const dt = Math.min(100, timestamp - this._lastTimestamp); // clamp delta
    this._lastTimestamp = timestamp;

    if (this._speed === Infinity) {
      // MAX speed: pull until frame budget (6ms) is exhausted
      const startTime = performance.now();
      while (performance.now() - startTime < FRAME_BUDGET_MS) {
        if (!this._advanceOne()) return;
      }
    } else {
      const stepInterval = 1000 / this._speed;
      this._accumulator += dt;
      let stepsTaken = 0;
      const MAX_STEPS_PER_FRAME = 200;

      while (this._accumulator >= stepInterval && stepsTaken < MAX_STEPS_PER_FRAME) {
        this._accumulator -= stepInterval;
        stepsTaken++;
        if (!this._advanceOne()) return;
      }
    }

    if (this._state === PlaybackState.PLAYING) {
      this._animId = requestAnimationFrame((ts) => this._loop(ts));
    }
  }
}
