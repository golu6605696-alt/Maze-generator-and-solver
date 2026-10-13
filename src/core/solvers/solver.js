/**
 * @file solver.js
 * Abstract base class and result record for all maze solver algorithms.
 * Solvers operate headlessly, never mutate the grid, and store visited state
 * strictly within the execution run.
 *
 * Complexity: Interface definitions and helper methods, O(1).
 */

export class SolveResult {
  /**
   * Encapsulates the output of a maze solver execution.
   *
   * @param {object} params
   * @param {import('../cell.js').Cell[]} params.path - Ordered cells from start to end, empty if no path
   * @param {number} params.visitedCount - Total number of unique cells visited/explored
   * @param {import('../step.js').Step[]} params.steps - Recorded animation events (VISIT steps, followed by PATH steps)
   * @param {number} params.timeMs - Execution duration in milliseconds
   * @param {number} params.cost - Total movement cost along the resolved path
   */
  constructor({ path = [], visitedCount = 0, steps = [], timeMs = 0, cost = 0 } = {}) {
    this.path = path;
    this.visitedCount = visitedCount;
    this.steps = steps;
    this.timeMs = timeMs;
    this.cost = cost;
  }

  /**
   * Returns true if a valid path was found to the destination.
   * @returns {boolean}
   */
  get found() {
    return this.path.length > 0;
  }

  /**
   * Number of cells in the solution path.
   * @returns {number}
   */
  get pathLength() {
    return this.path.length;
  }
}

export class Solver {
  /**
   * @param {string} name - Human-readable algorithm identifier
   */
  constructor(name) {
    if (new.target === Solver) {
      throw new TypeError('Cannot instantiate abstract class Solver directly');
    }
    if (typeof name !== 'string' || !name.trim()) {
      throw new TypeError('Solver name must be a non-empty string');
    }
    this.name = name;
  }

  /**
   * Solves the given maze grid from start to end.
   * Must not mutate the grid.
   *
   * @abstract
   * @param {import('../grid.js').Grid} grid
   * @param {import('../cell.js').Cell|[number, number]} [start]
   * @param {import('../cell.js').Cell|[number, number]} [end]
   * @returns {SolveResult}
   */
  solve(grid, start, end) {
    throw new Error(`solve() not implemented on ${this.constructor.name}`);
  }

  /**
   * Normalizes and validates endpoints against grid boundaries.
   *
   * @param {import('../grid.js').Grid} grid
   * @param {import('../cell.js').Cell|[number, number]} [start]
   * @param {import('../cell.js').Cell|[number, number]} [end]
   * @returns {{start: import('../cell.js').Cell, end: import('../cell.js').Cell}}
   * @protected
   */
  _resolveEndpoints(grid, start, end) {
    const s = this._resolveCell(grid, start) ?? grid.start;
    const e = this._resolveCell(grid, end) ?? grid.end;

    if (!s || !grid.inBounds(s.row, s.col)) {
      throw new RangeError('Start cell is invalid or out of bounds');
    }
    if (!e || !grid.inBounds(e.row, e.col)) {
      throw new RangeError('End cell is invalid or out of bounds');
    }

    return { start: s, end: e };
  }

  /**
   * Converts coordinate arrays or cell instances into grid Cells.
   *
   * @param {import('../grid.js').Grid} grid
   * @param {import('../cell.js').Cell|[number, number]} [coord]
   * @returns {import('../cell.js').Cell|null}
   * @private
   */
  _resolveCell(grid, coord) {
    if (!coord) return null;
    if (typeof coord.row === 'number' && typeof coord.col === 'number') {
      return grid.getCell(coord.row, coord.col);
    }
    if (Array.isArray(coord) && coord.length === 2) {
      return grid.getCell(coord[0], coord[1]);
    }
    return null;
  }

  /**
   * Computes the total traversal cost along a path.
   *
   * @param {import('../cell.js').Cell[]} path
   * @returns {number}
   * @protected
   */
  _computeCost(path) {
    return path.reduce((sum, cell) => sum + cell.weight, 0);
  }
}
