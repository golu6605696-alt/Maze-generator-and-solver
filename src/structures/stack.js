/**
<<<<<<< HEAD
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
=======
 * LIFO (Last-In-First-Out) Stack data structure.
 * Time Complexity: O(1) for push, pop, peek, isEmpty, size.
 */
export class Stack {
  constructor() {
    /** @private */
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
    this._items = [];
  }

  /**
   * Pushes an item onto the top of the stack.
<<<<<<< HEAD
   * Complexity: O(1) amortized time.
   *
=======
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
   * @param {*} item
   */
  push(item) {
    this._items.push(item);
  }

  /**
<<<<<<< HEAD
   * Removes and returns the top item from the stack, or undefined if empty.
   * Complexity: O(1) time.
   *
   * @returns {*}
=======
   * Removes and returns the top item from the stack.
   * @returns {*|undefined}
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
   */
  pop() {
    return this._items.pop();
  }

  /**
<<<<<<< HEAD
   * Returns the top item without removing it, or undefined if empty.
   * Complexity: O(1) time.
   *
   * @returns {*}
   */
  peek() {
    if (this._items.length === 0) {
      return undefined;
    }
=======
   * Returns the top item without removing it.
   * @returns {*|undefined}
   */
  peek() {
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
    return this._items[this._items.length - 1];
  }

  /**
<<<<<<< HEAD
   * Returns true if the stack contains no items.
   * Complexity: O(1) time.
   *
=======
   * Checks whether the stack contains no elements.
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
   * @returns {boolean}
   */
  isEmpty() {
    return this._items.length === 0;
  }

  /**
<<<<<<< HEAD
   * Returns the number of items currently in the stack.
   * Complexity: O(1) time.
   *
=======
   * Returns the number of items in the stack.
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
   * @returns {number}
   */
  get size() {
    return this._items.length;
  }

  /**
<<<<<<< HEAD
   * Removes all items from the stack.
   * Complexity: O(1) time.
=======
   * Clears all items from the stack.
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
   */
  clear() {
    this._items = [];
  }
<<<<<<< HEAD

  /**
   * Returns a shallow copy of the stack items as an array from bottom to top.
   * Complexity: O(N) time and space.
   *
   * @returns {Array}
   */
  toArray() {
    return [...this._items];
  }
=======
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
}
