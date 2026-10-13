/**
 * @file grid.js
 * 2D Grid representation storing Cells, managing neighbor relations,
 * and maintaining strict bidirectional wall consistency.
 *
 * Complexity:
 * - getCell, inBounds, cellIndex: O(1) time
 * - neighbors, openNeighbors: O(1) time (at most 4 adjacent cells)
 * - removeWall, addWall, hasWall: O(1) time
 * - clone, resetWalls, iteration: O(V) time where V = rows * cols
 */

import {
  Cell,
  ALL_WALLS,
  OPPOSITE_WALL,
  WALL_N,
  WALL_E,
  WALL_S,
  WALL_W,
} from './cell.js';

export class Grid {
  /**
   * Constructs an empty maze grid initialized with all walls intact.
   *
   * @param {number} rows - Number of rows (>= 1)
   * @param {number} cols - Number of columns (>= 1)
   * @param {object} [options={}]
   * @param {[number, number]|{row: number, col: number}} [options.start] - Start cell coordinates
   * @param {[number, number]|{row: number, col: number}} [options.end] - End cell coordinates
   * @param {number} [options.defaultWeight=1] - Default movement cost for all cells
   */
  constructor(rows, cols, options = {}) {
    if (!Number.isInteger(rows) || rows < 1) {
      throw new RangeError(`Grid rows must be an integer >= 1, received ${rows}`);
    }
    if (!Number.isInteger(cols) || cols < 1) {
      throw new RangeError(`Grid cols must be an integer >= 1, received ${cols}`);
    }
    if (rows * cols < 2) {
      throw new RangeError('Grid must contain at least 2 cells to support distinct start and end points');
    }

    this.rows = rows;
    this.cols = cols;
    const defaultWeight = options.defaultWeight ?? 1;

    // Initialize 2D grid of Cells
    this._cells = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => new Cell(r, c, ALL_WALLS, defaultWeight))
    );

    // Validate and set start / end cells
    const startCoord = options.start ?? [0, 0];
    const endCoord = options.end ?? [rows - 1, cols - 1];

    this._start = this._parseCoordinates(startCoord, 'start');
    this._end = this._parseCoordinates(endCoord, 'end');
    this._validateDistinct(this._start, this._end);
  }

  /**
   * Normalizes and bounds-checks coordinate inputs.
   *
   * @param {[number, number]|{row: number, col: number}} coord
   * @param {string} label
   * @returns {{row: number, col: number}}
   * @private
   */
  _parseCoordinates(coord, label) {
    let r;
    let c;
    if (Array.isArray(coord) && coord.length === 2) {
      [r, c] = coord;
    } else if (coord && typeof coord.row === 'number' && typeof coord.col === 'number') {
      r = coord.row;
      c = coord.col;
    } else {
      throw new TypeError(`Invalid coordinate for ${label}: expected [row, col] or {row, col}`);
    }

    if (!this.inBounds(r, c)) {
      throw new RangeError(`Coordinate for ${label} (${r}, ${c}) is out of bounds for ${this.rows}x${this.cols} grid`);
    }

    return { row: r, col: c };
  }

  /**
   * Validates that start and end cells are distinct.
   *
   * @param {{row: number, col: number}} a
   * @param {{row: number, col: number}} b
   * @private
   */
  _validateDistinct(a, b) {
    if (a.row === b.row && a.col === b.col) {
      throw new Error(`Start (${a.row}, ${a.col}) and End (${b.row}, ${b.col}) must be distinct cells`);
    }
  }

  /**
   * Total number of cells in the grid.
   * @returns {number}
   */
  get totalCells() {
    return this.rows * this.cols;
  }

  /**
   * Returns the start Cell instance.
   * @returns {Cell}
   */
  get start() {
    return this.getCell(this._start.row, this._start.col);
  }

  /**
   * Returns the end Cell instance.
   * @returns {Cell}
   */
  get end() {
    return this.getCell(this._end.row, this._end.col);
  }

  /**
   * Returns start coordinates as [row, col].
   * @returns {[number, number]}
   */
  get startCoords() {
    return [this._start.row, this._start.col];
  }

  /**
   * Returns end coordinates as [row, col].
   * @returns {[number, number]}
   */
  get endCoords() {
    return [this._end.row, this._end.col];
  }

  /**
   * Updates start coordinates.
   *
   * @param {[number, number]|{row: number, col: number}} coord
   */
  setStart(coord) {
    const parsed = this._parseCoordinates(coord, 'start');
    this._validateDistinct(parsed, this._end);
    this._start = parsed;
  }

  /**
   * Updates end coordinates.
   *
   * @param {[number, number]|{row: number, col: number}} coord
   */
  setEnd(coord) {
    const parsed = this._parseCoordinates(coord, 'end');
    this._validateDistinct(this._start, parsed);
    this._end = parsed;
  }

  /**
   * Returns true if given row and column are within grid boundaries.
   * Complexity: O(1) time.
   *
   * @param {number} row
   * @param {number} col
   * @returns {boolean}
   */
  inBounds(row, col) {
    return Number.isInteger(row) && Number.isInteger(col) &&
      row >= 0 && row < this.rows &&
      col >= 0 && col < this.cols;
  }

  /**
   * Retrieves the Cell at given position, or undefined if out of bounds.
   * Complexity: O(1) time.
   *
   * @param {number} row
   * @param {number} col
   * @returns {Cell|undefined}
   */
  getCell(row, col) {
    if (!this.inBounds(row, col)) {
      return undefined;
    }
    return this._cells[row][col];
  }

  /**
   * Maps 2D cell coordinates to a unique 0-indexed 1D integer index.
   * Complexity: O(1) time.
   *
   * @param {number} row
   * @param {number} col
   * @returns {number}
   */
  cellIndex(row, col) {
    return row * this.cols + col;
  }

  /**
   * Maps a 1D integer index back to its corresponding Cell.
   * Complexity: O(1) time.
   *
   * @param {number} index
   * @returns {Cell|undefined}
   */
  cellFromIndex(index) {
    if (!Number.isInteger(index) || index < 0 || index >= this.totalCells) {
      return undefined;
    }
    const row = Math.floor(index / this.cols);
    const col = index % this.cols;
    return this._cells[row][col];
  }

  /**
   * Determines the orthogonal direction bitmask from cellA to cellB.
   * Returns null if cells are not adjacent or not orthogonal.
   * Complexity: O(1) time.
   *
   * @param {Cell|{row: number, col: number}} a
   * @param {Cell|{row: number, col: number}} b
   * @returns {number|null} WALL_N, WALL_E, WALL_S, WALL_W, or null
   */
  getDirection(a, b) {
    const dRow = b.row - a.row;
    const dCol = b.col - a.col;

    if (dRow === -1 && dCol === 0) return WALL_N;
    if (dRow === 0 && dCol === 1) return WALL_E;
    if (dRow === 1 && dCol === 0) return WALL_S;
    if (dRow === 0 && dCol === -1) return WALL_W;

    return null;
  }

  /**
   * Returns all in-bounds orthogonal neighbors (N, E, S, W) of the cell.
   * Complexity: O(1) time.
   *
   * @param {Cell|{row: number, col: number}} cell
   * @returns {Cell[]}
   */
  neighbors(cell) {
    const results = [];
    const { row, col } = cell;

    if (row > 0) results.push(this._cells[row - 1][col]);             // North
    if (col + 1 < this.cols) results.push(this._cells[row][col + 1]); // East
    if (row + 1 < this.rows) results.push(this._cells[row + 1][col]); // South
    if (col > 0) results.push(this._cells[row][col - 1]);             // West

    return results;
  }

  /**
   * Returns adjacent cells with no barrier wall between cell and neighbor.
   * Enforces bidirectional wall consistency.
   * Complexity: O(1) time.
   *
   * @param {Cell} cell
   * @returns {Cell[]}
   */
  openNeighbors(cell) {
    const results = [];
    const { row, col } = cell;

    if (row > 0 && !cell.hasWall(WALL_N)) {
      const north = this._cells[row - 1][col];
      if (!north.hasWall(WALL_S)) results.push(north);
    }
    if (col + 1 < this.cols && !cell.hasWall(WALL_E)) {
      const east = this._cells[row][col + 1];
      if (!east.hasWall(WALL_W)) results.push(east);
    }
    if (row + 1 < this.rows && !cell.hasWall(WALL_S)) {
      const south = this._cells[row + 1][col];
      if (!south.hasWall(WALL_N)) results.push(south);
    }
    if (col > 0 && !cell.hasWall(WALL_W)) {
      const west = this._cells[row][col - 1];
      if (!west.hasWall(WALL_E)) results.push(west);
    }

    return results;
  }

  /**
   * Removes the wall between two adjacent cells, updating both cells symmetrically.
   * Complexity: O(1) time.
   *
   * @param {Cell} a
   * @param {Cell} b
   * @returns {boolean} true if wall was removed
   */
  removeWall(a, b) {
    const dir = this.getDirection(a, b);
    if (dir === null) {
      throw new Error(`Cannot remove wall: cells (${a.row}, ${a.col}) and (${b.row}, ${b.col}) are not orthogonally adjacent`);
    }

    const opposite = OPPOSITE_WALL[dir];
    a.removeWall(dir);
    b.removeWall(opposite);
    return true;
  }

  /**
   * Adds the wall between two adjacent cells, updating both cells symmetrically.
   * Complexity: O(1) time.
   *
   * @param {Cell} a
   * @param {Cell} b
   * @returns {boolean} true if wall was added
   */
  addWall(a, b) {
    const dir = this.getDirection(a, b);
    if (dir === null) {
      throw new Error(`Cannot add wall: cells (${a.row}, ${a.col}) and (${b.row}, ${b.col}) are not orthogonally adjacent`);
    }

    const opposite = OPPOSITE_WALL[dir];
    a.addWall(dir);
    b.addWall(opposite);
    return true;
  }

  /**
   * Returns true if a wall exists between two adjacent cells.
   * Complexity: O(1) time.
   *
   * @param {Cell} a
   * @param {Cell} b
   * @returns {boolean}
   */
  hasWall(a, b) {
    const dir = this.getDirection(a, b);
    if (dir === null) {
      throw new Error(`Cannot check wall: cells (${a.row}, ${a.col}) and (${b.row}, ${b.col}) are not orthogonally adjacent`);
    }

    return a.hasWall(dir) || b.hasWall(OPPOSITE_WALL[dir]);
  }

  /**
   * Resets all cells in the grid to a specific wall bitmask (defaults to ALL_WALLS).
   * Complexity: O(V) time where V = rows * cols.
   *
   * @param {number} [wallMask=ALL_WALLS]
   */
  resetWalls(wallMask = ALL_WALLS) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this._cells[r][c].walls = wallMask;
      }
    }
  }

  /**
   * Enables row-major cell iteration (for (const cell of grid)).
   */
  *[Symbol.iterator]() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        yield this._cells[r][c];
      }
    }
  }

  /**
   * Creates a deep copy of this Grid with independent cells and matching start/end.
   * Complexity: O(V) time and space.
   *
   * @returns {Grid}
   */
  clone() {
    const cloned = new Grid(this.rows, this.cols, {
      start: [this._start.row, this._start.col],
      end: [this._end.row, this._end.col],
    });

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        cloned._cells[r][c] = this._cells[r][c].clone();
      }
    }

    return cloned;
  }

  /**
   * Serializes the grid state matching the ARCHITECTURE.md JSON format.
   *
   * @param {number} [seed=null]
   * @returns {object}
   */
  toJSON(seed = null) {
    const cellsData = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this._cells[r][c];
        cellsData.push({ w: cell.walls, wt: cell.weight });
      }
    }

    const result = {
      version: 1,
      rows: this.rows,
      cols: this.cols,
      start: [this._start.row, this._start.col],
      end: [this._end.row, this._end.col],
      cells: cellsData,
    };

    if (seed !== null) {
      result.seed = seed;
    }

    return result;
  }

  /**
   * Reconstructs a Grid instance from serialized JSON data.
   * Complexity: O(V) time and space.
   *
   * @param {object} data
   * @returns {Grid}
   */
  static fromJSON(data) {
    if (!data || data.version !== 1) {
      throw new Error(`Unsupported maze format or missing version: ${data?.version}`);
    }

    const grid = new Grid(data.rows, data.cols, {
      start: data.start,
      end: data.end,
    });

    for (let i = 0; i < data.cells.length; i++) {
      const cellData = data.cells[i];
      const r = Math.floor(i / data.cols);
      const c = i % data.cols;
      const cell = grid.getCell(r, c);
      cell.walls = cellData.w;
      cell.setWeight(cellData.wt ?? 1);
    }

    return grid;
  }
}
