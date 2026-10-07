/**
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
    this._head = 0;
  }

  /**
   * Adds an item to the back of the queue.
   * Complexity: O(1) amortized time.
   *
   * @param {*} item
   */
  enqueue(item) {
    this._items.push(item);
  }

  /**
   * Removes and returns the item at the front of the queue, or undefined if empty.
   * Complexity: O(1) amortized time.
   *
   * @returns {*}
   */
  dequeue() {
    if (this.isEmpty()) {
      return undefined;
    }
    const item = this._items[this._head];
    this._items[this._head] = undefined; // Allow garbage collection
    this._head++;

    // Compact periodically when head pointer exceeds threshold
    if (this._head >= DEFAULT_COMPACTION_THRESHOLD && this._head * 2 >= this._items.length) {
      this._items = this._items.slice(this._head);
      this._head = 0;
    }

    return item;
  }

  /**
   * Returns the item at the front of the queue without removing it, or undefined if empty.
   * Complexity: O(1) time.
   *
   * @returns {*}
   */
  peek() {
    if (this.isEmpty()) {
      return undefined;
    }
    return this._items[this._head];
  }

  /**
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
   * @returns {number}
   */
  get size() {
    return this._items.length - this._head;
  }

  /**
   * Removes all items from the queue.
   * Complexity: O(1) time.
   */
  clear() {
    this._items = [];
    this._head = 0;
  }

  /**
   * Returns an array of items in FIFO order (front to back).
   * Complexity: O(N) time and space.
   *
   * @returns {Array}
   */
  toArray() {
    return this._items.slice(this._head);
  }
}
