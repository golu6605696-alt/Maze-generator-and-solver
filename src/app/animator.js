/**
 * @file animator.js
 * Step player that replays animation event streams with variable speed,
 * batching for high throughput, pause/step/resume controls, and cancellation.
 *
 * Complexity: O(1) scheduling per frame, O(N) total execution across N steps.
 */

export const ANIMATOR_STATES = Object.freeze({
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
});

export class Animator {
  /**
   * @param {object} [options={}]
   * @param {number} [options.speed=50] - Initial playback speed from 1 to 100
   */
  constructor(options = {}) {
    this._speed = Math.max(1, Math.min(100, options.speed ?? 50));
    this._state = ANIMATOR_STATES.IDLE;
    this._steps = [];
    this._currentIndex = 0;
    this._onStep = null;
    this._onComplete = null;
    this._rafId = null;
    this._timerId = null;
  }

  /**
   * Current animation lifecycle state.
   * @returns {string}
   */
  get state() {
    return this._state;
  }

  /**
   * Returns true if animation is actively playing.
   * @returns {boolean}
   */
  get isRunning() {
    return this._state === ANIMATOR_STATES.RUNNING;
  }

  /**
   * Returns true if animation is currently paused.
   * @returns {boolean}
   */
  get isPaused() {
    return this._state === ANIMATOR_STATES.PAUSED;
  }

  /**
   * Progress ratio from 0.0 to 1.0.
   * @returns {number}
   */
  get progress() {
    if (this._steps.length === 0) return 0;
    return Math.min(1, this._currentIndex / this._steps.length);
  }

  /**
   * Updates playback speed.
   *
   * @param {number} speed - Value between 1 (slowest) and 100 (instant)
   */
  setSpeed(speed) {
    this._speed = Math.max(1, Math.min(100, Number(speed) || 50));
  }

  /**
   * Begins or replaces playback of a step sequence.
   *
   * @param {import('../core/step.js').Step[]} steps
   * @param {Function} onStep - Callback invoked with each executed Step or batch of Steps
   * @param {Function} [onComplete] - Callback invoked when all steps finish
   */
  play(steps, onStep, onComplete = null) {
    this.cancel();

    if (!Array.isArray(steps) || steps.length === 0) {
      this._state = ANIMATOR_STATES.COMPLETED;
      if (typeof onComplete === 'function') onComplete();
      return;
    }

    this._steps = steps;
    this._currentIndex = 0;
    this._onStep = onStep;
    this._onComplete = onComplete;
    this._state = ANIMATOR_STATES.RUNNING;

    this._scheduleNextTick();
  }

  /**
   * Pauses running playback.
   */
  pause() {
    if (this._state !== ANIMATOR_STATES.RUNNING) return;
    this._clearScheduled();
    this._state = ANIMATOR_STATES.PAUSED;
  }

  /**
   * Resumes paused playback.
   */
  resume() {
    if (this._state !== ANIMATOR_STATES.PAUSED) return;
    this._state = ANIMATOR_STATES.RUNNING;
    this._scheduleNextTick();
  }

  /**
   * Advances a single step when paused.
   *
   * @returns {boolean} true if a step was advanced, false if reached end
   */
  step() {
    if (this._state !== ANIMATOR_STATES.PAUSED) return false;
    if (this._currentIndex >= this._steps.length) return false;

    const currentStep = this._steps[this._currentIndex++];
    if (this._onStep) {
      this._onStep(currentStep, this._currentIndex, this._steps.length);
    }

    if (this._currentIndex >= this._steps.length) {
      this._state = ANIMATOR_STATES.COMPLETED;
      if (this._onComplete) this._onComplete();
    }

    return true;
  }

  /**
   * Cancels and stops any ongoing playback.
   */
  cancel() {
    this._clearScheduled();
    this._steps = [];
    this._currentIndex = 0;
    this._onStep = null;
    this._onComplete = null;
    this._state = ANIMATOR_STATES.IDLE;
  }

  /**
   * Internal scheduling routine using requestAnimationFrame when possible,
   * falling back to setTimeout for Node headless testing or long delays.
   * @private
   */
  _scheduleNextTick() {
    if (this._state !== ANIMATOR_STATES.RUNNING) return;

    if (this._currentIndex >= this._steps.length) {
      this._state = ANIMATOR_STATES.COMPLETED;
      if (this._onComplete) this._onComplete();
      return;
    }

    // High speed (> 20) uses requestAnimationFrame with batching
    if (this._speed >= 20 && typeof requestAnimationFrame !== 'undefined') {
      this._rafId = requestAnimationFrame(() => this._tick());
    } else {
      // Lower speed introduces tangible delay per step
      const delayMs = this._calculateDelay();
      this._timerId = setTimeout(() => this._tick(), delayMs);
    }
  }

  /**
   * Calculates execution delay in milliseconds for low speed settings.
   * @private
   */
  _calculateDelay() {
    if (this._speed >= 20) return 0;
    // Map speed 1..19 to 250ms down to 10ms
    return Math.round(260 - this._speed * 13);
  }

  /**
   * Calculates how many steps to process in a single frame.
   * @private
   */
  _calculateBatchSize() {
    if (this._speed === 100) {
      return Infinity; // Instantaneous completion
    }
    if (this._speed < 20) {
      return 1;
    }
    if (this._speed < 50) {
      return Math.round((this._speed - 15) / 7); // 1 to 5 steps
    }
    if (this._speed < 85) {
      return Math.round(5 + (this._speed - 50) * 1.5); // 5 to ~57 steps
    }
    // High speeds (85 - 99): 60 to 250 steps per frame
    return Math.round(60 + (this._speed - 85) * 12);
  }

  /**
   * Execution tick processing a batch of steps.
   * @private
   */
  _tick() {
    this._rafId = null;
    this._timerId = null;

    if (this._state !== ANIMATOR_STATES.RUNNING) return;

    const batchSize = this._calculateBatchSize();
    const targetIndex = Math.min(this._steps.length, this._currentIndex + batchSize);

    while (this._currentIndex < targetIndex) {
      const step = this._steps[this._currentIndex++];
      if (this._onStep) {
        this._onStep(step, this._currentIndex, this._steps.length);
      }
    }

    if (this._currentIndex >= this._steps.length) {
      this._state = ANIMATOR_STATES.COMPLETED;
      if (this._onComplete) this._onComplete();
    } else {
      this._scheduleNextTick();
    }
  }

  /**
   * Clears pending timers or animation frames.
   * @private
   */
  _clearScheduled() {
    if (this._rafId !== null) {
      if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    if (this._timerId !== null) {
      clearTimeout(this._timerId);
      this._timerId = null;
    }
  }
}
