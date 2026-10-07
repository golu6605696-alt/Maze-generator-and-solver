/**
 * @file stack.js
 * Standard LIFO (Last-In, First-Out) stack data structure.
 * Used by iterative DFS generators (Recursive Backtracker) and solvers.
 * Complexity: O(1) time for push, pop, peek, isEmpty. O(N) space.
 */

export class Stack {
  /**
   * Initializes an empty stack.
   */
  constructor() {
    this._items = [];
  }

  /**
   * Pushes an item onto the top of the stack.
   * Complexity: O(1) amortized time.
   *
   * @param {*} item
   */
  push(item) {
    this._items.push(item);
  }

  /**
   * Removes and returns the top item from the stack, or undefined if empty.
   * Complexity: O(1) time.
   *
   * @returns {*}
   */
  pop() {
    return this._items.pop();
  }

  /**
   * Returns the top item without removing it, or undefined if empty.
   * Complexity: O(1) time.
   *
   * @returns {*}
   */
  peek() {
    if (this._items.length === 0) {
      return undefined;
    }
    return this._items[this._items.length - 1];
  }

  /**
   * Returns true if the stack contains no items.
   * Complexity: O(1) time.
   *
   * @returns {boolean}
   */
  isEmpty() {
    return this._items.length === 0;
  }

  /**
   * Returns the number of items currently in the stack.
   * Complexity: O(1) time.
   *
   * @returns {number}
   */
  get size() {
    return this._items.length;
  }

  /**
   * Removes all items from the stack.
   * Complexity: O(1) time.
   */
  clear() {
    this._items = [];
  }

  /**
   * Returns a shallow copy of the stack items as an array from bottom to top.
   * Complexity: O(N) time and space.
   *
   * @returns {Array}
   */
  toArray() {
    return [...this._items];
  }
}
