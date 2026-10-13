/**
 * @file backtracker.js
 * Iterative Recursive Backtracker (DFS) maze generator.
 * Uses an explicit Stack to prevent call stack overflow on deep paths (e.g. 100x100 grids).
 * Produces mazes with high river factor (long winding passages and few dead ends).
 *
 * Complexity: O(V) time and O(V) space, where V = rows * cols.
 */

import { Generator } from './generator.js';
import { Stack } from '../../structures/stack.js';
import { SeededRNG } from '../../structures/rng.js';
import { Step } from '../step.js';
import { ALL_WALLS } from '../cell.js';

export class RecursiveBacktracker extends Generator {
  constructor() {
    super('Recursive Backtracker');
  }

  /**
   * Generates a perfect maze using iterative depth-first search.
   *
   * @param {import('../grid.js').Grid} grid
   * @param {import('../../structures/rng.js').SeededRNG} [rng]
   * @returns {Step[]}
   */
  generate(grid, rng = new SeededRNG()) {
    grid.resetWalls(ALL_WALLS);

    const steps = [];
    const stack = new Stack();
    const visited = new Uint8Array(grid.totalCells);

    const start = grid.start;
    const startIndex = grid.cellIndex(start.row, start.col);
    visited[startIndex] = 1;
    stack.push(start);
    steps.push(Step.visit(start));

    while (!stack.isEmpty()) {
      const current = stack.peek();
      const unvisitedNeighbors = this._getUnvisitedNeighbors(grid, current, visited);

      if (unvisitedNeighbors.length > 0) {
        const next = rng.choice(unvisitedNeighbors);
        grid.removeWall(current, next);

        const nextIndex = grid.cellIndex(next.row, next.col);
        visited[nextIndex] = 1;
        stack.push(next);
        steps.push(Step.carve(next, { from: current }));
      } else {
        stack.pop();
        steps.push(Step.backtrack(current));
      }
    }

    return steps;
  }

  /**
   * Returns orthogonal neighbors that have not yet been carved into.
   *
   * @param {import('../grid.js').Grid} grid
   * @param {import('../cell.js').Cell} cell
   * @param {Uint8Array} visited
   * @returns {import('../cell.js').Cell[]}
   * @private
   */
  _getUnvisitedNeighbors(grid, cell, visited) {
    const result = [];
    const neighbors = grid.neighbors(cell);
    for (let i = 0; i < neighbors.length; i++) {
      const n = neighbors[i];
      if (visited[grid.cellIndex(n.row, n.col)] === 0) {
        result.push(n);
      }
    }
    return result;
  }
}
