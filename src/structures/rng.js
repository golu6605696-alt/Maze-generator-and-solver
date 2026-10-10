/**
 * Seeded pseudorandom number generator using Mulberry32 algorithm.
 * Deterministic: same seed produces identical sequences across platforms.
 * Time Complexity: O(1) per generation.
 */
export class SeededRNG {
  /**
   * @param {number|string} [seed] - Optional numeric or string seed
   */
  constructor(seed = 12345) {
    this._initialSeed = seed;
    this.reset(seed);
  }

  /**
   * Resets the generator state to a specific seed.
   * @param {number|string} [seed]
   */
  reset(seed = this._initialSeed) {
    if (typeof seed === 'string') {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
      }
      this._state = hash >>> 0;
    } else {
      this._state = (seed >>> 0) || 1;
    }
  }

  /**
   * Returns a pseudorandom float in [0, 1).
   * @returns {number}
   */
  nextFloat() {
    let t = (this._state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a pseudorandom integer in [min, max] inclusive.
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  nextInt(min, max) {
    if (min > max) {
      [min, max] = [max, min];
    }
    const range = max - min + 1;
    return min + Math.floor(this.nextFloat() * range);
  }

  /**
   * Picks a random item from an array.
   * @template T
   * @param {T[]} array
   * @returns {T|null}
   */
  choice(array) {
    if (!array || array.length === 0) return null;
    const index = this.nextInt(0, array.length - 1);
    return array[index];
  }

  /**
   * Shuffles an array in place using Fisher-Yates algorithm.
   * Time Complexity: O(N)
   * @template T
   * @param {T[]} array
   * @returns {T[]}
   */
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
