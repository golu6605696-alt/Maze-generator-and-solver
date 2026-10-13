/**
 * @file step.js
 * Step event record for recording and replaying maze generation and solving animations.
 * Allows pure, headless algorithm execution while supporting decoupled visual playback.
 *
 * Complexity: O(1) time and space per step record.
 */

export const STEP_TYPES = Object.freeze({
  CARVE: 'CARVE',
  VISIT: 'VISIT',
  FRONTIER: 'FRONTIER',
  BACKTRACK: 'BACKTRACK',
  PATH: 'PATH',
  WALL_ADDED: 'WALL_ADDED',
});

const VALID_STEP_TYPES = new Set(Object.values(STEP_TYPES));

export class Step {
  /**
   * Constructs an event step record.
   *
   * @param {string} type - One of STEP_TYPES (CARVE, VISIT, FRONTIER, BACKTRACK, PATH, WALL_ADDED)
   * @param {import('./cell.js').Cell|{row: number, col: number}} cell - Target cell for the step
   * @param {*} [extra=null] - Optional metadata (direction, neighbor, distance, heuristic, etc.)
   */
  constructor(type, cell, extra = null) {
    if (!VALID_STEP_TYPES.has(type)) {
      throw new TypeError(`Invalid step type: ${type}. Expected one of: ${[...VALID_STEP_TYPES].join(', ')}`);
    }
    if (!cell || typeof cell.row !== 'number' || typeof cell.col !== 'number') {
      throw new TypeError('Step requires a cell with numeric row and col coordinates');
    }

    this.type = type;
    this.cell = cell;
    this.extra = extra;
  }

  /**
   * Factory method for a CARVE step.
   * @param {*} cell
   * @param {*} [extra=null]
   * @returns {Step}
   */
  static carve(cell, extra = null) {
    return new Step(STEP_TYPES.CARVE, cell, extra);
  }

  /**
   * Factory method for a VISIT step.
   * @param {*} cell
   * @param {*} [extra=null]
   * @returns {Step}
   */
  static visit(cell, extra = null) {
    return new Step(STEP_TYPES.VISIT, cell, extra);
  }

  /**
   * Factory method for a FRONTIER step.
   * @param {*} cell
   * @param {*} [extra=null]
   * @returns {Step}
   */
  static frontier(cell, extra = null) {
    return new Step(STEP_TYPES.FRONTIER, cell, extra);
  }

  /**
   * Factory method for a BACKTRACK step.
   * @param {*} cell
   * @param {*} [extra=null]
   * @returns {Step}
   */
  static backtrack(cell, extra = null) {
    return new Step(STEP_TYPES.BACKTRACK, cell, extra);
  }

  /**
   * Factory method for a PATH step.
   * @param {*} cell
   * @param {*} [extra=null]
   * @returns {Step}
   */
  static path(cell, extra = null) {
    return new Step(STEP_TYPES.PATH, cell, extra);
  }

  /**
   * Factory method for a WALL_ADDED step.
   * @param {*} cell
   * @param {*} [extra=null]
   * @returns {Step}
   */
  static wallAdded(cell, extra = null) {
    return new Step(STEP_TYPES.WALL_ADDED, cell, extra);
  }

  /**
   * Returns a plain JSON representation of this step.
   * @returns {{type: string, cell: {row: number, col: number}, extra: *}}
   */
  toJSON() {
    return {
      type: this.type,
      cell: { row: this.cell.row, col: this.cell.col },
      extra: this.extra,
    };
  }
}
