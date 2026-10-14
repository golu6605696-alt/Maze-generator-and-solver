/**
 * @file minheap.js
 * Binary MinHeap supporting (priority, seq, value) ordering to break ties by insertion order.
 * Complexity: insert O(log N), extractMin O(log N), peek O(1), size O(1).
 */

export class MinHeap {
  /**
   * @param {(a: any, b: any) => number} [comparator] Optional custom comparator: returns < 0 if a < b.
   */
  constructor(comparator) {
    this._comparator = comparator || null;
    this._heap = [];
    this._seq = 0;
  }

  /**
   * Inserts an item with an optional numeric priority.
   * If priority is provided, stored entry is { priority, seq, value }.
   * @param {*} value
   * @param {number} [priority]
   */
  insert(value, priority) {
    let entry;
    if (priority !== undefined) {
      entry = { priority, seq: this._seq++, value };
    } else if (this._comparator === null && typeof value === 'object' && value !== null && 'priority' in value) {
      entry = { priority: value.priority, seq: this._seq++, value };
    } else {
      entry = value;
    }

    this._heap.push(entry);
    this._bubbleUp(this._heap.length - 1);
  }

  /**
   * Alias for insert.
   */
  push(value, priority) {
    this.insert(value, priority);
  }

  /**
   * Removes and returns the minimum element.
   * @returns {*}
   */
  extractMin() {
    if (this._heap.length === 0) return undefined;
    const top = this._heap[0];
    const bottom = this._heap.pop();
    if (this._heap.length > 0) {
      this._heap[0] = bottom;
      this._bubbleDown(0);
    }
    // If wrapped in { priority, seq, value }, unwrap if insert had priority
    if (top && typeof top === 'object' && 'seq' in top && 'priority' in top && 'value' in top) {
      return top.value;
    }
    return top;
  }

  /**
   * Alias for extractMin.
   */
  pop() {
    return this.extractMin();
  }

  /**
   * Returns minimum element without removing it.
   * @returns {*}
   */
  peek() {
    if (this._heap.length === 0) return undefined;
    const top = this._heap[0];
    if (top && typeof top === 'object' && 'seq' in top && 'priority' in top && 'value' in top) {
      return top.value;
    }
    return top;
  }

  /**
   * @returns {number}
   */
  get size() {
    return this._heap.length;
  }

  /**
   * @returns {boolean}
   */
  isEmpty() {
    return this._heap.length === 0;
  }

  clear() {
    this._heap.length = 0;
    this._seq = 0;
  }

  /**
   * Returns true if entry a has higher priority (smaller value) than b.
   * @private
   */
  _compare(a, b) {
    if (this._comparator) {
      // If items were wrapped in { seq, priority, value }, unwrap for custom comparator if user passed raw objects
      const valA = (a && typeof a === 'object' && 'value' in a && 'seq' in a) ? a.value : a;
      const valB = (b && typeof b === 'object' && 'value' in b && 'seq' in b) ? b.value : b;
      return this._comparator(valA, valB);
    }

    // Default comparison for { priority, seq, value } entries
    if (a && b && typeof a === 'object' && typeof b === 'object' && 'priority' in a && 'priority' in b) {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.seq - b.seq; // tie-breaker by insertion order
    }

    // Direct scalar comparison
    return a < b ? -1 : (a > b ? 1 : 0);
  }

  _bubbleUp(index) {
    while (index > 0) {
      const parentIndex = (index - 1) >> 1;
      if (this._compare(this._heap[index], this._heap[parentIndex]) < 0) {
        const tmp = this._heap[index];
        this._heap[index] = this._heap[parentIndex];
        this._heap[parentIndex] = tmp;
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  _bubbleDown(index) {
    const len = this._heap.length;
    while (true) {
      const left = (index << 1) + 1;
      const right = left + 1;
      let smallest = index;

      if (left < len && this._compare(this._heap[left], this._heap[smallest]) < 0) {
        smallest = left;
      }
      if (right < len && this._compare(this._heap[right], this._heap[smallest]) < 0) {
        smallest = right;
      }
      if (smallest !== index) {
        const tmp = this._heap[index];
        this._heap[index] = this._heap[smallest];
        this._heap[smallest] = tmp;
        index = smallest;
      } else {
        break;
      }
    }
  }
}
