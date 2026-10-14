/**
 * @file queue.js
 * FIFO Queue data structure backed by a circular ring buffer with amortized O(1) ops.
 * Complexity: enqueue O(1) amortized, dequeue O(1), peek O(1), size O(1).
 */

export class Queue {
  /**
   * @param {number} [initialCapacity=64] Must be a power of two or will be rounded up.
   */
  constructor(initialCapacity = 64) {
    let cap = 16;
    while (cap < initialCapacity) cap <<= 1;
    this._capacity = cap;
    this._mask = cap - 1;
    this._data = new Array(cap);
    this._head = 0;
    this._tail = 0;
    this._size = 0;
  }

  /**
   * Adds an item to the back of the queue.
   * @param {*} item
   */
  enqueue(item) {
    if (this._size === this._capacity) {
      this._grow();
    }
    this._data[this._tail] = item;
    this._tail = (this._tail + 1) & this._mask;
    this._size++;
  }

  /**
   * Removes and returns the front item, or undefined if empty.
   * @returns {*}
   */
  dequeue() {
    if (this._size === 0) return undefined;
    const item = this._data[this._head];
    this._data[this._head] = undefined; // allow GC
    this._head = (this._head + 1) & this._mask;
    this._size--;
    return item;
  }

  /**
   * Returns front item without removing it.
   * @returns {*}
   */
  peek() {
    if (this._size === 0) return undefined;
    return this._data[this._head];
  }

  /**
   * @returns {boolean}
   */
  isEmpty() {
    return this._size === 0;
  }

  /**
   * @returns {number}
   */
  get size() {
    return this._size;
  }

  /**
   * Resets queue to empty.
   */
  clear() {
    this._data = new Array(this._capacity);
    this._head = 0;
    this._tail = 0;
    this._size = 0;
  }

  _grow() {
    const newCap = this._capacity << 1;
    const newData = new Array(newCap);
    for (let i = 0; i < this._size; i++) {
      newData[i] = this._data[(this._head + i) & this._mask];
    }
    this._data = newData;
    this._head = 0;
    this._tail = this._size;
    this._capacity = newCap;
    this._mask = newCap - 1;
  }

  /**
   * @returns {Array}
   */
  toArray() {
    const res = new Array(this._size);
    for (let i = 0; i < this._size; i++) {
      res[i] = this._data[(this._head + i) & this._mask];
    }
    return res;
  }
}
