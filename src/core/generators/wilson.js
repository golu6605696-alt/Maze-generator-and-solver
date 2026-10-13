/**
 * @file wilson.js
 * Wilson's maze generator using loop-erased random walks.
 * Generates an unbiased Uniform Spanning Tree (UST) of the grid graph.
 *
 * Complexity: O(V) expected time on 2D grids, O(V) space.
 */

import { Generator } from './generator.js';
import { SeededRNG } from '../../structures/rng.js';
import { Step } from '../step.js';
import { ALL_WALLS } from '../cell.js';

export class Wilsons extends Generator {
  constructor() {
    super("Wilson's (UST)");
  }

  /**
   * Generates an unbiased uniform spanning tree maze using Wilson's algorithm.
   *
   * @param {import('../grid.js').Grid} grid
   * @param {import('../../structures/rng.js').SeededRNG} [rng]
   * @returns {Step[]}
   */
  generate(grid, rng = new SeededRNG()) {
    grid.resetWalls(ALL_WALLS);

    const steps = [];
    const inTree = new Uint8Array(grid.totalCells);

    // 1. Pick an initial root cell to start the maze tree
    const rootIndex = rng.nextInt(0, grid.totalCells - 1);
    const root = grid.cellFromIndex(rootIndex);
    inTree[rootIndex] = 1;
    steps.push(Step.visit(root));

    let treeCount = 1;

    // Array of remaining cell indices not yet in the tree
    const remaining = [];
    for (let i = 0; i < grid.totalCells; i++) {
      if (i !== rootIndex) remaining.push(i);
    }
    rng.shuffle(remaining);

    // Next direction pointer for loop-erased random walk: index => neighbor Cell
    const walkNext = new Array(grid.totalCells).fill(null);

    // 2. Add remaining cells via loop-erased random walks
    for (let i = 0; i < remaining.length; i++) {
      const startIdx = remaining[i];
      if (inTree[startIdx] === 1) continue;

      let current = grid.cellFromIndex(startIdx);
      let currIdx = startIdx;

      // Perform random walk until encountering the spanning tree
      while (inTree[currIdx] === 0) {
        const neighbors = grid.neighbors(current);
        const nextCell = rng.choice(neighbors);
        walkNext[currIdx] = nextCell; // Overwriting automatically erases loops

        current = nextCell;
        currIdx = grid.cellIndex(current.row, current.col);
      }

      // 3. Carve the loop-erased path into the spanning tree
      let walkCell = grid.cellFromIndex(startIdx);
      let walkIdx = startIdx;

      while (inTree[walkIdx] === 0) {
        const nextCell = walkNext[walkIdx];
        grid.removeWall(walkCell, nextCell);
        inTree[walkIdx] = 1;
        treeCount++;
        steps.push(Step.carve(nextCell, { from: walkCell }));

        walkCell = nextCell;
        walkIdx = grid.cellIndex(walkCell.row, walkCell.col);
      }
    }

    return steps;
  }
}
