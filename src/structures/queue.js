/**
 * FIFO (First-In-First-Out) Queue data structure.
 * Uses an offset pointer for amortized O(1) dequeue operations.
 * Time Complexity: O(1) amortized for enqueue, dequeue, peek, isEmpty, size.
 */
export class Queue {
  constructor() {
    /** @private */
    this._items = [];
    /** @private */
    this._head = 0;
  }

  /**
   * Adds an item to the back of the queue.
   * @param {*} item
   */
  enqueue(item) {
    this._items.push(item);
  }

  /**
   * Removes and returns the item from the front of the queue.
   * @returns {*|undefined}
   */
  dequeue() {
    if (this.isEmpty()) {
      return undefined;
    }
    const item = this._items[this._head];
    this._items[this._head] = undefined;
    this._head++;

    // Compact the array when wasted space exceeds threshold
    if (this._head > 64 && this._head >= this._items.length / 2) {
      this._items = this._items.slice(this._head);
      this._head = 0;
    }

    return item;
  }

  /**
   * Returns the item at the front of the queue without removing it.
   * @returns {*|undefined}
   */
  peek() {
    if (this.isEmpty()) {
      return undefined;
    }
    return this._items[this._head];
  }

  /**
   * Checks whether the queue contains no elements.
   * @returns {boolean}
   */
  isEmpty() {
    return this._head >= this._items.length;
  }

  /**
   * Returns the number of items in the queue.
   * @returns {number}
   */
  get size() {
    return this._items.length - this._head;
  }

  /**
   * Clears all items from the queue.
   */
  clear() {
    this._items = [];
    this._head = 0;
  }
}
