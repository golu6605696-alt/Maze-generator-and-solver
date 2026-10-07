/**
 * @file minheap.js
 * Binary Min-Heap (Priority Queue) implementation with customizable comparator.
 * Used by Dijkstra and A* pathfinding solvers.
 * Complexity: O(log N) for push and pop; O(1) for peek; O(N) space.
 */

// Default comparator assuming primitive numeric or comparable values
const DEFAULT_COMPARATOR = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

export class MinHeap {
  /**
   * Initializes a min-heap with an optional comparator function.
   * Comparator should return < 0 if a has strictly higher priority than b.
   *
   * @param {Function} [comparator]
   */
  constructor(comparator = DEFAULT_COMPARATOR) {
    this._heap = [];
    this._comparator = comparator;
  }

  /**
   * Inserts an item into the heap.
   * Complexity: O(log N) time.
   *
   * @param {*} item
   */
  push(item) {
    this._heap.push(item);
    this._siftUp(this._heap.length - 1);
  }

  /**
   * Removes and returns the item with the minimum value / highest priority.
   * Complexity: O(log N) time.
   *
   * @returns {*}
   */
  pop() {
    if (this._heap.length === 0) {
      return undefined;
    }
    const top = this._heap[0];
    const bottom = this._heap.pop();
    if (this._heap.length > 0) {
      this._heap[0] = bottom;
      this._siftDown(0);
    }
    return top;
  }

  /**
   * Returns the minimum item without removing it.
   * Complexity: O(1) time.
   *
   * @returns {*}
   */
  peek() {
    return this._heap.length > 0 ? this._heap[0] : undefined;
  }

  /**
   * Returns true if the heap contains no items.
   * Complexity: O(1) time.
   *
   * @returns {boolean}
   */
  isEmpty() {
    return this._heap.length === 0;
  }

  /**
   * Returns the count of items in the heap.
   * Complexity: O(1) time.
   *
   * @returns {number}
   */
  get size() {
    return this._heap.length;
  }

  /**
   * Clears all items from the heap.
   * Complexity: O(1) time.
   */
  clear() {
    this._heap = [];
  }

  /**
   * Iteratively restores the heap invariant upwards from the given index.
   * Complexity: O(log N) time.
   *
   * @private
   * @param {number} startIndex
   */
  _siftUp(startIndex) {
    let index = startIndex;
    const item = this._heap[index];

    while (index > 0) {
      const parentIndex = (index - 1) >> 1;
      const parent = this._heap[parentIndex];

      // If item is not strictly less than parent, heap property is satisfied
      if (this._comparator(item, parent) >= 0) {
        break;
      }

      this._heap[index] = parent;
      index = parentIndex;
    }

    this._heap[index] = item;
  }

  /**
   * Iteratively restores the heap invariant downwards from the given index.
   * Complexity: O(log N) time.
   *
   * @private
   * @param {number} startIndex
   */
  _siftDown(startIndex) {
    const length = this._heap.length;
    let index = startIndex;
    const item = this._heap[index];

    while ((index << 1) + 1 < length) {
      const leftChild = (index << 1) + 1;
      const rightChild = leftChild + 1;
      let candidate = leftChild;

      if (
        rightChild < length &&
        this._comparator(this._heap[rightChild], this._heap[leftChild]) < 0
      ) {
        candidate = rightChild;
      }

      if (this._comparator(this._heap[candidate], item) >= 0) {
        break;
      }

      this._heap[index] = this._heap[candidate];
      index = candidate;
    }

    this._heap[index] = item;
  }
}
