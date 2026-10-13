/**
 * @file cell.js
 * Core Cell representation with 4-directional wall bitmask and terrain movement weight.
 * Visited state is intentionally kept in algorithm-local structures, never on the Cell,
 * to prevent cross-run pollution.
 *
 * Complexity: O(1) time for all operations, O(1) space per cell.
 */

export const WALL_N = 1; // North (0001)
export const WALL_E = 2; // East  (0010)
export const WALL_S = 4; // South (0100)
export const WALL_W = 8; // West  (1000)

export const ALL_WALLS = WALL_N | WALL_E | WALL_S | WALL_W; // 15 (1111)
export const NO_WALLS = 0; // 0 (0000)

export const DIRECTIONS = Object.freeze([WALL_N, WALL_E, WALL_S, WALL_W]);

export const OPPOSITE_WALL = Object.freeze({
  [WALL_N]: WALL_S,
  [WALL_E]: WALL_W,
  [WALL_S]: WALL_N,
  [WALL_W]: WALL_E,
});

export const DIRECTION_DELTAS = Object.freeze({
  [WALL_N]: Object.freeze({ row: -1, col: 0 }),
  [WALL_E]: Object.freeze({ row: 0, col: 1 }),
  [WALL_S]: Object.freeze({ row: 1, col: 0 }),
  [WALL_W]: Object.freeze({ row: 0, col: -1 }),
});

export class Cell {
  /**
   * Initializes a grid cell.
   *
   * @param {number} row - 0-indexed row position
   * @param {number} col - 0-indexed column position
   * @param {number} [walls=ALL_WALLS] - Initial bitmask of intact walls
   * @param {number} [weight=1] - Traversal cost (positive integer, minimum 1)
   */
  constructor(row, col, walls = ALL_WALLS, weight = 1) {
    if (!Number.isInteger(row)) {
      throw new TypeError(`Cell row must be an integer, received ${row}`);
    }
    if (row < 0) {
      throw new RangeError(`Cell row must be non-negative, received ${row}`);
    }
    if (!Number.isInteger(col)) {
      throw new TypeError(`Cell col must be an integer, received ${col}`);
    }
    if (col < 0) {
      throw new RangeError(`Cell col must be non-negative, received ${col}`);
    }

    this.row = row;
    this.col = col;
    this.walls = walls;
    this._setAndValidateWeight(weight);
  }

  /**
   * Validates and sets cell weight.
   *
   * @param {number} weight
   * @private
   */
  _setAndValidateWeight(weight) {
    if (!Number.isInteger(weight) || weight < 1) {
      throw new RangeError(`Cell weight must be a positive integer >= 1, received ${weight}`);
    }
    this.weight = weight;
  }

  /**
   * Sets a new terrain movement weight.
   * Complexity: O(1) time.
   *
   * @param {number} weight
   */
  setWeight(weight) {
    this._setAndValidateWeight(weight);
  }

  /**
   * Returns true if a wall exists in the specified direction bitmask.
   * Complexity: O(1) time.
   *
   * @param {number} direction - WALL_N, WALL_E, WALL_S, or WALL_W
   * @returns {boolean}
   */
  hasWall(direction) {
    return (this.walls & direction) === direction;
  }

  /**
   * Removes the wall in the specified direction.
   * Complexity: O(1) time.
   *
   * @param {number} direction - WALL_N, WALL_E, WALL_S, or WALL_W
   */
  removeWall(direction) {
    this.walls &= ~direction;
  }

  /**
   * Adds/restores the wall in the specified direction.
   * Complexity: O(1) time.
   *
   * @param {number} direction - WALL_N, WALL_E, WALL_S, or WALL_W
   */
  addWall(direction) {
    this.walls |= direction;
  }

  /**
   * Returns an independent copy of this cell.
   * Complexity: O(1) time and space.
   *
   * @returns {Cell}
   */
  clone() {
    return new Cell(this.row, this.col, this.walls, this.weight);
  }

  /**
   * Returns a compact string identifier for coordinate lookup/debugging.
   *
   * @returns {string}
   */
  toString() {
    return `Cell(${this.row},${this.col}:walls=${this.walls},weight=${this.weight})`;
  }
}
