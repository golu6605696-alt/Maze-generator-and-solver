/**
 * @file bitset.js
 * Memory-efficient BitSet on Uint32Array.
 * Complexity: set O(1), get O(1), clear O(1), reset O(size/32), count O(size/32).
 */

export class BitSet {
  /**
   * @param {number} size Total number of bits.
   */
  constructor(size) {
    this._size = size;
    const words = (size + 31) >>> 5;
    this._words = new Uint32Array(words);
  }

  /**
   * @param {number} i
   */
  set(i) {
    if (i < 0 || i >= this._size) return;
    this._words[i >>> 5] |= (1 << (i & 31));
  }

  /**
   * @param {number} i
   * @returns {boolean}
   */
  get(i) {
    if (i < 0 || i >= this._size) return false;
    return (this._words[i >>> 5] & (1 << (i & 31))) !== 0;
  }

  /**
   * @param {number} i
   */
  clear(i) {
    if (i < 0 || i >= this._size) return;
    this._words[i >>> 5] &= ~(1 << (i & 31));
  }

  /**
   * Resets all bits to 0.
   */
  reset() {
    this._words.fill(0);
  }

  /**
   * Total bits allocated.
   * @returns {number}
   */
  get size() {
    return this._size;
  }

  /**
   * Returns count of set bits (popcount).
   * @returns {number}
   */
  count() {
    let count = 0;
    for (let i = 0; i < this._words.length; i++) {
      let v = this._words[i];
      // Hamming weight
      v = v - ((v >>> 1) & 0x55555555);
      v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
      count += (((v + (v >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
    }
    return count;
  }
}
