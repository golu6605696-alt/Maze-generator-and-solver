/**
 * @file division.js
 * Recursive Division maze generator.
 * Starts with an open chamber and recursively bisects regions with internal walls,
 * leaving a single passage open per divider to maintain a perfect spanning tree.
 * Uses an explicit stack to prevent call stack overflow on large grids.
 *
 * Complexity: O(V log V) time, O(V) space, where V = rows * cols.
 */

import { Generator } from './generator.js';
import { SeededRNG } from '../../structures/rng.js';
import { Stack } from '../../structures/stack.js';
import { Step } from '../step.js';
import { NO_WALLS, WALL_N, WALL_E, WALL_S, WALL_W } from '../cell.js';

export class RecursiveDivision extends Generator {
  constructor() {
    super('Recursive Division');
  }

  /**
   * Generates a perfect maze using iterative recursive division.
   *
   * @param {import('../grid.js').Grid} grid
   * @param {import('../../structures/rng.js').SeededRNG} [rng]
   * @returns {Step[]}
   */
  generate(grid, rng = new SeededRNG()) {
    const steps = [];

    // 1. Initialize grid with no internal walls, preserving outer perimeter boundaries
    this._initChamber(grid);

    // 2. Iterative sub-chamber processing
    const stack = new Stack();
    stack.push({ r1: 0, r2: grid.rows - 1, c1: 0, c2: grid.cols - 1 });

    while (!stack.isEmpty()) {
      const region = stack.pop();
      const { r1, r2, c1, c2 } = region;

      const width = c2 - c1 + 1;
      const height = r2 - r1 + 1;

      if (width < 2 || height < 2) {
        continue;
      }

      // Choose bisecting orientation based on region aspect ratio
      const horizontal = height > width
        ? true
        : width > height
          ? false
          : rng.next() < 0.5;

      if (horizontal) {
        // Horizontal cut: choose row dividing line
        const cutRow = rng.nextInt(r1, r2 - 1);
        const passageCol = rng.nextInt(c1, c2);

        // Build wall across the width of this region
        for (let c = c1; c <= c2; c++) {
          if (c !== passageCol) {
            grid.addWall(grid.getCell(cutRow, c), grid.getCell(cutRow + 1, c));
            steps.push(Step.wallAdded(grid.getCell(cutRow, c), { to: grid.getCell(cutRow + 1, c) }));
          } else {
            steps.push(Step.carve(grid.getCell(cutRow + 1, c), { from: grid.getCell(cutRow, c) }));
          }
        }

        // Subdivide upper and lower regions
        stack.push({ r1, r2: cutRow, c1, c2 });
        stack.push({ r1: cutRow + 1, r2, c1, c2 });
      } else {
        // Vertical cut: choose col dividing line
        const cutCol = rng.nextInt(c1, c2 - 1);
        const passageRow = rng.nextInt(r1, r2);

        // Build wall down the height of this region
        for (let r = r1; r <= r2; r++) {
          if (r !== passageRow) {
            grid.addWall(grid.getCell(r, cutCol), grid.getCell(r, cutCol + 1));
            steps.push(Step.wallAdded(grid.getCell(r, cutCol), { to: grid.getCell(r, cutCol + 1) }));
          } else {
            steps.push(Step.carve(grid.getCell(r, cutCol + 1), { from: grid.getCell(r, cutCol) }));
          }
        }

        // Subdivide left and right regions
        stack.push({ r1, r2, c1, c2: cutCol });
        stack.push({ r1, r2, c1: cutCol + 1, c2 });
      }
    }

    return steps;
  }

  /**
   * Resets all internal walls while maintaining outer perimeter boundary walls.
   *
   * @param {import('../grid.js').Grid} grid
   * @private
   */
  _initChamber(grid) {
    grid.resetWalls(NO_WALLS);

    for (let r = 0; r < grid.rows; r++) {
      grid.getCell(r, 0).addWall(WALL_W);
      grid.getCell(r, grid.cols - 1).addWall(WALL_E);
    }
    for (let c = 0; c < grid.cols; c++) {
      grid.getCell(0, c).addWall(WALL_N);
      grid.getCell(grid.rows - 1, c).addWall(WALL_S);
    }
  }
}
