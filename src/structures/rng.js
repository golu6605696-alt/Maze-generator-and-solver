/**
 * @file rng.js
 * Seeded pseudo-random number generator using xmur3 hash and sfc32.
 * Supports rejection-sampled integers, Fisher-Yates shuffle, and stream forking.
 * Complexity: nextU32 is O(1); int(n) is expected O(1); shuffle(arr) is O(n).
 */

/**
 * xmur3 hash function turns a string seed into a sequence of 32-bit integer words.
 * @param {string} str
 * @returns {() => number} Generator returning 32-bit unsigned integers.
 */
export function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

/**
 * sfc32 (Simple Fast Counter) 32-bit PRNG.
 * Period is ~2^128. Passes BigCrush and PractRand.
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {number} d
 * @returns {() => number} Function returning 32-bit unsigned integers.
 */
export function sfc32(a, b, c, d) {
  return function() {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    const t = (a + b | 0) + d | 0;
    d = d + 1 | 0;
    a = b ^ (b >>> 9);
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    c = c + t | 0;
    return t >>> 0;
  };
}

/**
 * Standard Rng interface implementation.
 */
export class Rng {
  /**
   * @param {string|number} seed
   * @param {string} [label=""]
   */
  constructor(seed, label = "") {
    const raw = String(seed) + (label ? `::${label}` : "");
    const genSeed = xmur3(raw);
    this._a = genSeed();
    this._b = genSeed();
    this._c = genSeed();
    this._d = genSeed();
    this._rawSeed = String(seed);
    this._label = label;
    this._gen = sfc32(this._a, this._b, this._c, this._d);

    // Warm up 15 rounds
    for (let i = 0; i < 15; i++) {
      this._gen();
    }
  }

  /**
   * Returns an unsigned 32-bit integer [0, 2^32 - 1].
   * @returns {number}
   */
  nextU32() {
    return this._gen();
  }

  /**
   * Returns a float in [0, 1).
   * @returns {number}
   */
  nextFloat() {
    return this.nextU32() / 4294967296;
  }

  /**
   * Returns a uniform integer in [0, n) using rejection sampling to eliminate modulo bias.
   * @param {number} n Upper bound exclusive (positive integer).
   * @returns {number}
   */
  int(n) {
    if (n <= 1) return 0;
    const threshold = 4294967296 - (4294967296 % n);
    let r;
    do {
      r = this.nextU32();
    } while (r >= threshold);
    return r % n;
  }

  /**
   * Returns a uniform integer in [min, max] inclusive.
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  range(min, max) {
    if (min >= max) return min;
    return min + this.int(max - min + 1);
  }

  /**
   * Fisher-Yates in-place shuffle.
   * @template T
   * @param {T[]} arr
   * @returns {T[]}
   */
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  /**
   * Creates an independent child Rng stream by hashing the parent seed with the label.
   * @param {string} label
   * @returns {Rng}
   */
  fork(label) {
    // Independent child stream derived deterministically from parent seed + label
    const derived = `${this._rawSeed}:${this._label}:${label}:${this.nextU32()}`;
    return new Rng(derived, label);
  }
}
