/**
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
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  nextInt(min, max) {
    if (min > max) {
      throw new RangeError(`min (${min}) cannot be greater than max (${max})`);
    }
    const range = (max - min) + 1;
    return min + Math.floor(this.next() * range);
  }

  /**
   * Returns a random element from non-empty array, or null if array is empty.
   * Complexity: O(1) time, O(1) space.
   *
   * @template T
   * @param {T[]} array
   * @returns {T|null}
   */
  choice(array) {
    if (!array || array.length === 0) {
      return null;
    }
    const index = this.nextInt(0, array.length - 1);
    return array[index];
  }

  /**
   * Shuffles an array in-place using Fisher-Yates algorithm.
   * Complexity: O(N) time where N is array length, O(1) auxiliary space.
   *
   * @template T
   * @param {T[]} array
   * @returns {T[]} the mutated array
   */
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
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
}
