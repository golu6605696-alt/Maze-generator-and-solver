/**
 * @file grid3d.js
 * Multi-Level / 3D Maze Grid representing multi-floor mazes with vertical stairwells.
 * Supports inter-floor navigation across 6 orthogonal directions (N, E, S, W, Up, Down).
 *
 * Complexity: O(1) coordinate and neighbor lookups, O(L * R * C) total capacity.
 */

import { Cell, ALL_WALLS } from './cell.js';

export class Cell3D extends Cell {
  /**
   * @param {number} level - 0-indexed floor/level
   * @param {number} row
   * @param {number} col
   * @param {number} [walls=ALL_WALLS]
   */
  constructor(level, row, col, walls = ALL_WALLS) {
    super(row, col, walls);
    this.level = level;
    this.hasStairsUp = false;
    this.hasStairsDown = false;
  }
}

export class Grid3D {
  /**
   * @param {number} levels - Number of vertical levels / floors (>= 1)
   * @param {number} rows - Rows per level
   * @param {number} cols - Columns per level
   */
  constructor(levels, rows, cols) {
    if (levels < 1 || rows < 1 || cols < 1) {
      throw new RangeError('Grid3D dimensions must be positive integers');
    }
    this.levels = levels;
    this.rows = rows;
    this.cols = cols;

    // 3D cell storage: [level][row][col]
    this._cells = Array.from({ length: levels }, (_, l) =>
      Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => new Cell3D(l, r, c))
      )
    );

    this.start = this.getCell(0, 0, 0);
    this.end = this.getCell(levels - 1, rows - 1, cols - 1);
  }

  get totalCells() {
    return this.levels * this.rows * this.cols;
  }

  getCell(level, row, col) {
    if (
      level < 0 || level >= this.levels ||
      row < 0 || row >= this.rows ||
      col < 0 || col >= this.cols
    ) {
      return undefined;
    }
    return this._cells[level][row][col];
  }

  /**
   * Connects two vertical levels with a two-way staircase at (row, col).
   *
   * @param {number} lowerLevel
   * @param {number} row
   * @param {number} col
   */
  addStairs(lowerLevel, row, col) {
    if (lowerLevel < 0 || lowerLevel + 1 >= this.levels) return;
    const lower = this.getCell(lowerLevel, row, col);
    const upper = this.getCell(lowerLevel + 1, row, col);
    if (lower && upper) {
      lower.hasStairsUp = true;
      upper.hasStairsDown = true;
    }
  }

  /**
   * Returns open accessible neighbors including vertical stair connections.
   *
   * @param {Cell3D} cell
   * @returns {Cell3D[]}
   */
  openNeighbors(cell) {
    const results = [];
    const { level, row, col } = cell;

    // Orthogonal neighbors on same floor
    if (row > 0 && !cell.hasWall(1)) results.push(this.getCell(level, row - 1, col));
    if (col + 1 < this.cols && !cell.hasWall(2)) results.push(this.getCell(level, row, col + 1));
    if (row + 1 < this.rows && !cell.hasWall(4)) results.push(this.getCell(level, row + 1, col));
    if (col > 0 && !cell.hasWall(8)) results.push(this.getCell(level, row, col - 1));

    // Vertical stair transitions
    if (cell.hasStairsUp && level + 1 < this.levels) {
      results.push(this.getCell(level + 1, row, col));
    }
    if (cell.hasStairsDown && level > 0) {
      results.push(this.getCell(level - 1, row, col));
    }

    return results;
  }
}
