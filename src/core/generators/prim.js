/**
 * @file prim.js
 * Randomized Prim's maze generator.
 * Builds a spanning tree by repeatedly picking a random cell from the active frontier
 * and connecting it to the already-carved maze.
 * Produces mazes with a high branching factor and many short dead ends.
 *
 * Complexity: O(V) average time, O(V) space, where V = rows * cols.
 */

import { Generator } from './generator.js';
import { SeededRNG } from '../../structures/rng.js';
import { Step } from '../step.js';
import { ALL_WALLS } from '../cell.js';

export class RandomizedPrims extends Generator {
  constructor() {
    super("Randomized Prim's");
  }

  /**
   * Generates a perfect maze using Randomized Prim's algorithm.
   *
   * @param {import('../grid.js').Grid} grid
   * @param {import('../../structures/rng.js').SeededRNG} [rng]
   * @returns {Step[]}
   */
  generate(grid, rng = new SeededRNG()) {
    grid.resetWalls(ALL_WALLS);

    const steps = [];
    const inMaze = new Uint8Array(grid.totalCells);
    const isFrontier = new Uint8Array(grid.totalCells);
    const frontier = [];

    // Begin with start cell in the maze
    const start = grid.start;
    const startIndex = grid.cellIndex(start.row, start.col);
    inMaze[startIndex] = 1;
    steps.push(Step.visit(start));

    // Seed frontier with neighbors of start
    this._addNeighborsToFrontier(grid, start, inMaze, isFrontier, frontier, steps);

    while (frontier.length > 0) {
      // Pick random frontier cell with O(1) swap-and-pop removal
      const randIdx = rng.nextInt(0, frontier.length - 1);
      const current = frontier[randIdx];
      frontier[randIdx] = frontier[frontier.length - 1];
      frontier.pop();

      const currIdx = grid.cellIndex(current.row, current.col);
      isFrontier[currIdx] = 0;

      // Connect to an adjacent cell already in the maze
      const mazeNeighbors = this._getMazeNeighbors(grid, current, inMaze);
      if (mazeNeighbors.length > 0) {
        const anchor = rng.choice(mazeNeighbors);
        grid.removeWall(current, anchor);
        inMaze[currIdx] = 1;
        steps.push(Step.carve(current, { from: anchor }));

        // Expand frontier with unvisited neighbors
        this._addNeighborsToFrontier(grid, current, inMaze, isFrontier, frontier, steps);
      }
    }

    return steps;
  }

  /**
   * Identifies adjacent cells already carved into the maze.
   *
   * @param {import('../grid.js').Grid} grid
   * @param {import('../cell.js').Cell} cell
   * @param {Uint8Array} inMaze
   * @returns {import('../cell.js').Cell[]}
   * @private
   */
  _getMazeNeighbors(grid, cell, inMaze) {
    const result = [];
    const neighbors = grid.neighbors(cell);
    for (let i = 0; i < neighbors.length; i++) {
      const n = neighbors[i];
      if (inMaze[grid.cellIndex(n.row, n.col)] === 1) {
        result.push(n);
      }
    }
    return result;
  }

  /**
   * Adds eligible adjacent unvisited cells to the frontier list.
   *
   * @param {import('../grid.js').Grid} grid
   * @param {import('../cell.js').Cell} cell
   * @param {Uint8Array} inMaze
   * @param {Uint8Array} isFrontier
   * @param {import('../cell.js').Cell[]} frontier
   * @param {Step[]} steps
   * @private
   */
  _addNeighborsToFrontier(grid, cell, inMaze, isFrontier, frontier, steps) {
    const neighbors = grid.neighbors(cell);
    for (let i = 0; i < neighbors.length; i++) {
      const n = neighbors[i];
      const idx = grid.cellIndex(n.row, n.col);
      if (inMaze[idx] === 0 && isFrontier[idx] === 0) {
        isFrontier[idx] = 1;
        frontier.push(n);
        steps.push(Step.frontier(n));
      }
    }
  }
}
