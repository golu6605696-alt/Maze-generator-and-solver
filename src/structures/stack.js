/**
 * @file stack.js
 * LIFO Stack data structure.
 * Complexity: push O(1), pop O(1), peek O(1), size O(1), clear O(1).
 */

export class Stack {
  /**
   * @param {number} [initialCapacity=64]
   */
  constructor(initialCapacity = 64) {
    this._items = [];
    if (initialCapacity > 0) {
      // pre-warm array hint
    }
  }

  /**
   * Pushes an element onto the stack.
   * @param {*} item
   */
  push(item) {
    this._items.push(item);
  }

  /**
   * Removes and returns the top element, or undefined if empty.
   * @returns {*}
   */
  pop() {
    return this._items.pop();
  }

  /**
   * Returns the top element without removing it, or undefined if empty.
   * @returns {*}
   */
  peek() {
    return this._items.length > 0 ? this._items[this._items.length - 1] : undefined;
  }

  /**
   * Returns whether the stack has no elements.
   * @returns {boolean}
   */
  isEmpty() {
    return this._items.length === 0;
  }

  /**
   * Returns current count of elements.
   * @returns {number}
   */
  get size() {
    return this._items.length;
  }

  /**
   * Empties the stack.
   */
  clear() {
    this._items.length = 0;
  }

  /**
   * Converts the stack to an array from bottom to top.
   * @returns {Array}
   */
  toArray() {
    return this._items.slice();
  }
}
