/**
<<<<<<< HEAD
 * @file queue.js
 * Standard FIFO (First-In, First-Out) queue data structure.
 * Implemented with head-offset indexing and periodic compaction to avoid O(N) Array.shift() costs.
 * Complexity: O(1) amortized time for enqueue and dequeue. O(N) space.
 */

// Threshold to compact the underlying storage array and free dereferenced memory
const DEFAULT_COMPACTION_THRESHOLD = 1024;

export class Queue {
  /**
   * Initializes an empty queue.
   */
  constructor() {
    this._items = [];
=======
 * FIFO (First-In-First-Out) Queue data structure.
 * Uses an offset pointer for amortized O(1) dequeue operations.
 * Time Complexity: O(1) amortized for enqueue, dequeue, peek, isEmpty, size.
 */
export class Queue {
  constructor() {
    /** @private */
    this._items = [];
    /** @private */
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
    this._head = 0;
  }

  /**
   * Adds an item to the back of the queue.
<<<<<<< HEAD
   * Complexity: O(1) amortized time.
   *
=======
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
   * @param {*} item
   */
  enqueue(item) {
    this._items.push(item);
  }

  /**
<<<<<<< HEAD
   * Removes and returns the item at the front of the queue, or undefined if empty.
   * Complexity: O(1) amortized time.
   *
   * @returns {*}
=======
   * Removes and returns the item from the front of the queue.
   * @returns {*|undefined}
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
   */
  dequeue() {
    if (this.isEmpty()) {
      return undefined;
    }
    const item = this._items[this._head];
<<<<<<< HEAD
    this._items[this._head] = undefined; // Allow garbage collection
    this._head++;

    // Compact periodically when head pointer exceeds threshold
    if (this._head >= DEFAULT_COMPACTION_THRESHOLD && this._head * 2 >= this._items.length) {
=======
    this._items[this._head] = undefined;
    this._head++;

    // Compact the array when wasted space exceeds threshold
    if (this._head > 64 && this._head >= this._items.length / 2) {
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
      this._items = this._items.slice(this._head);
      this._head = 0;
    }

    return item;
  }

  /**
<<<<<<< HEAD
   * Returns the item at the front of the queue without removing it, or undefined if empty.
   * Complexity: O(1) time.
   *
   * @returns {*}
=======
   * Returns the item at the front of the queue without removing it.
   * @returns {*|undefined}
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
   */
  peek() {
    if (this.isEmpty()) {
      return undefined;
    }
    return this._items[this._head];
  }

  /**
<<<<<<< HEAD
   * Returns true if the queue has no elements.
   * Complexity: O(1) time.
   *
   * @returns {boolean}
   */
  isEmpty() {
    return this.size === 0;
  }

  /**
   * Returns the number of elements currently in the queue.
   * Complexity: O(1) time.
   *
=======
   * Checks whether the queue contains no elements.
   * @returns {boolean}
   */
  isEmpty() {
    return this._head >= this._items.length;
  }

  /**
   * Returns the number of items in the queue.
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
   * @returns {number}
   */
  get size() {
    return this._items.length - this._head;
  }

  /**
<<<<<<< HEAD
   * Removes all items from the queue.
   * Complexity: O(1) time.
=======
   * Clears all items from the queue.
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
   */
  clear() {
    this._items = [];
    this._head = 0;
  }
<<<<<<< HEAD

  /**
   * Returns an array of items in FIFO order (front to back).
   * Complexity: O(N) time and space.
   *
   * @returns {Array}
   */
  toArray() {
    return this._items.slice(this._head);
  }
=======
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
}
