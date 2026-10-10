/**
 * LIFO (Last-In-First-Out) Stack data structure.
 * Time Complexity: O(1) for push, pop, peek, isEmpty, size.
 */
export class Stack {
  constructor() {
    /** @private */
    this._items = [];
  }

  /**
   * Pushes an item onto the top of the stack.
   * @param {*} item
   */
  push(item) {
    this._items.push(item);
  }

  /**
   * Removes and returns the top item from the stack.
   * @returns {*|undefined}
   */
  pop() {
    return this._items.pop();
  }

  /**
   * Returns the top item without removing it.
   * @returns {*|undefined}
   */
  peek() {
    return this._items[this._items.length - 1];
  }

  /**
   * Checks whether the stack contains no elements.
   * @returns {boolean}
   */
  isEmpty() {
    return this._items.length === 0;
  }

  /**
   * Returns the number of items in the stack.
   * @returns {number}
   */
  get size() {
    return this._items.length;
  }

  /**
   * Clears all items from the stack.
   */
  clear() {
    this._items = [];
  }
}
