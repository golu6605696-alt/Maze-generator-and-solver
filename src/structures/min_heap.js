/**
 * Binary MinHeap (Priority Queue) data structure.
 * Default comparator treats items as numbers (min at top).
 * Custom comparator: compare(a, b) < 0 indicates 'a' has higher priority than 'b'.
 * Time Complexity: O(log N) push & pop, O(1) peek.
 */
export class MinHeap {
  /**
   * @param {function(*, *): number} [comparator]
   */
  constructor(comparator = (a, b) => a - b) {
    /** @private */
    this._comparator = comparator;
    /** @private */
    this._heap = [];
  }

  /**
   * Inserts an element into the heap.
   * @param {*} item
   */
  push(item) {
    this._heap.push(item);
    this._siftUp(this._heap.length - 1);
  }

  /** Alias for push */
  insert(item) {
    this.push(item);
  }

  /**
   * Removes and returns the minimum element (highest priority).
   * @returns {*|undefined}
   */
  pop() {
    if (this.isEmpty()) {
      return undefined;
    }
    const root = this._heap[0];
    const last = this._heap.pop();
    if (this._heap.length > 0) {
      this._heap[0] = last;
      this._siftDown(0);
    }
    return root;
  }

  /** Alias for pop */
  extractMin() {
    return this.pop();
  }

  /**
   * Returns the minimum element without removing it.
   * @returns {*|undefined}
   */
  peek() {
    return this._heap[0];
  }

  /**
   * Checks whether the heap contains no elements.
   * @returns {boolean}
   */
  isEmpty() {
    return this._heap.length === 0;
  }

  /**
   * Returns the number of elements in the heap.
   * @returns {number}
   */
  get size() {
    return this._heap.length;
  }

  /**
   * Clears the heap.
   */
  clear() {
    this._heap = [];
  }

  /** @private */
  _siftUp(index) {
    let current = index;
    while (current > 0) {
      const parent = (current - 1) >> 1;
      if (this._comparator(this._heap[current], this._heap[parent]) < 0) {
        [this._heap[current], this._heap[parent]] = [this._heap[parent], this._heap[current]];
        current = parent;
      } else {
        break;
      }
    }
  }

  /** @private */
  _siftDown(index) {
    let current = index;
    const length = this._heap.length;

    while (true) {
      const left = (current << 1) + 1;
      const right = left + 1;
      let smallest = current;

      if (left < length && this._comparator(this._heap[left], this._heap[smallest]) < 0) {
        smallest = left;
      }
      if (right < length && this._comparator(this._heap[right], this._heap[smallest]) < 0) {
        smallest = right;
      }

      if (smallest !== current) {
        [this._heap[current], this._heap[smallest]] = [this._heap[smallest], this._heap[current]];
        current = smallest;
      } else {
        break;
      }
    }
  }
}
