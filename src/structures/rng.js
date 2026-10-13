/**
<<<<<<< HEAD
 * @file rng.js
 * Seeded pseudo-random number generator using the Mulberry32 algorithm.
 * Guarantees deterministic output across platforms and runs.
 * Complexity: O(1) time per random number, O(1) space.
 */

// Mulberry32 bitwise constants for state mixing
const MULBERRY_INCREMENT = 0x6D2B79F5;
const MULBERRY_FACTOR_1 = 0xAB8879AC;
const MULBERRY_FACTOR_2 = 0xBC3566ED;
const UINT32_DIVISOR = 4294967296; // 2^32 for normalizing to [0, 1)

// FNV-1a constants for converting arbitrary seed strings to 32-bit integers
const FNV_OFFSET_BASIS = 2166136261;
const FNV_PRIME = 16777619;

/**
 * Hashes a string seed into a 32-bit unsigned integer using FNV-1a.
 * Complexity: O(L) where L is string length.
 *
 * @param {string} str
 * @returns {number} 32-bit unsigned integer
 */
function hashStringSeed(str) {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

export class SeededRNG {
  /**
   * Initializes the RNG with an optional numeric or string seed.
   * If omitted, a time-based fallback is used.
   *
   * @param {number|string} [seed]
   */
  constructor(seed = Date.now()) {
    this.initialSeed = seed;
    this.state = typeof seed === 'string'
      ? hashStringSeed(seed)
      : (Number(seed) >>> 0);
  }

  /**
   * Returns a pseudo-random floating point number in [0, 1).
   * Complexity: O(1) time, O(1) space.
   *
   * @returns {number}
   */
  next() {
    this.state = (this.state + MULBERRY_INCREMENT) >>> 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / UINT32_DIVISOR;
  }

  /**
   * Returns a pseudo-random integer in [min, max] inclusive.
   * Complexity: O(1) time, O(1) space.
   *
=======
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
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  nextInt(min, max) {
    if (min > max) {
<<<<<<< HEAD
      throw new RangeError(`min (${min}) cannot be greater than max (${max})`);
    }
    const range = (max - min) + 1;
    return min + Math.floor(this.next() * range);
  }

  /**
   * Returns a random element from non-empty array, or null if array is empty.
   * Complexity: O(1) time, O(1) space.
   *
=======
      [min, max] = [max, min];
    }
    const range = max - min + 1;
    return min + Math.floor(this.nextFloat() * range);
  }

  /**
   * Picks a random item from an array.
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
   * @template T
   * @param {T[]} array
   * @returns {T|null}
   */
  choice(array) {
<<<<<<< HEAD
    if (!array || array.length === 0) {
      return null;
    }
=======
    if (!array || array.length === 0) return null;
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
    const index = this.nextInt(0, array.length - 1);
    return array[index];
  }

  /**
<<<<<<< HEAD
   * Shuffles an array in-place using Fisher-Yates algorithm.
   * Complexity: O(N) time where N is array length, O(1) auxiliary space.
   *
   * @template T
   * @param {T[]} array
   * @returns {T[]} the mutated array
=======
   * Shuffles an array in place using Fisher-Yates algorithm.
   * Time Complexity: O(N)
   * @template T
   * @param {T[]} array
   * @returns {T[]}
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
   */
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
<<<<<<< HEAD
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }

  /**
   * Creates an independent child RNG seeded by this RNG's current state.
   * Complexity: O(1) time.
   *
   * @returns {SeededRNG}
   */
  fork() {
    const nextSeed = (this.state + MULBERRY_INCREMENT) >>> 0;
    return new SeededRNG(nextSeed);
  }
=======
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
}
