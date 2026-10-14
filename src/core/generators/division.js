/**
 * @file division.js
 * Recursive Division maze generator (iterative with explicit stack).
 * Complexity: O(V) time, O(R) space. Produces rectilinear corridors with long straight walls.
 */

import { Stack } from '../../structures/stack.js';
import { Wall } from '../constants.js';

export class DivisionGenerator {
  constructor() {
    this.id = 'div';
    this.name = 'Recursive Division';
    this.complexity = Object.freeze({
      time: 'O(V)',
      space: 'O(R)',
      note: 'Iterative sub-rectangle stack; rectilinear corridors, long straight dividing walls.',
    });
  }

  /**
   * @param {import('../grid.js').Grid} grid
   * @param {import('../../structures/rng.js').Rng} rng
   * @param {object} [opts]
   * @returns {Generator<object, { passages: number, steps: number }, void>}
   */
  *generate(grid, rng, opts = {}) {
    const genRng = rng.fork('gen');
    const { rows, cols } = grid;

    // 1. Recursive division starts from an OPEN grid with closed borders
    // Clear all internal walls
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        let w = 0;
        if (r === 0) w |= Wall.N;
        if (r === rows - 1) w |= Wall.S;
        if (c === 0) w |= Wall.W;
        if (c === cols - 1) w |= Wall.E;
        grid.walls[i] = w;
      }
    }

    const stack = new Stack();
    // Sub-rectangle: { r0, c0, r1, c1 }
    stack.push({ r0: 0, c0: 0, r1: rows - 1, c1: cols - 1 });

    let steps = 0;
    let passages = 0;

    while (!stack.isEmpty()) {
      const { r0, c0, r1, c1 } = stack.pop();
      const height = r1 - r0 + 1;
      const width = c1 - c0 + 1;

      if (height <= 1 || width <= 1) {
        continue;
      }

      // Decide orientation: horizontal (split rows) or vertical (split cols)
      let horizontal = false;
      if (height > width) {
        horizontal = true;
      } else if (width > height) {
        horizontal = false;
      } else {
        horizontal = genRng.int(2) === 0;
      }

      if (horizontal) {
        // Choose wall row between r0 and r1 - 1
        const wallRow = r0 + genRng.int(height - 1);
        // Choose passage col in [c0, c1]
        const passageCol = c0 + genRng.int(width);

        // Build wall along wallRow between (wallRow, c) and (wallRow + 1, c)
        for (let c = c0; c <= c1; c++) {
          if (c !== passageCol) {
            const a = wallRow * cols + c;
            const b = (wallRow + 1) * cols + c;
            grid.build(a, b);
            steps++;
            yield { t: 'WALL_ADD', a, b };
          }
        }

        // Push sub-rectangles
        stack.push({ r0, c0, r1: wallRow, c1 });
        stack.push({ r0: wallRow + 1, c0, r1, c1 });
      } else {
        // Choose wall col between c0 and c1 - 1
        const wallCol = c0 + genRng.int(width - 1);
        // Choose passage row in [r0, r1]
        const passageRow = r0 + genRng.int(height);

        // Build wall along wallCol between (r, wallCol) and (r, wallCol + 1)
        for (let r = r0; r <= r1; r++) {
          if (r !== passageRow) {
            const a = r * cols + wallCol;
            const b = r * cols + (wallCol + 1);
            grid.build(a, b);
            steps++;
            yield { t: 'WALL_ADD', a, b };
          }
        }

        // Push sub-rectangles
        stack.push({ r0, c0, r1, c1: wallCol });
        stack.push({ r0, c0: wallCol + 1, r1, c1 });
      }
    }

    passages = grid.size - 1;
    return { passages, steps };
  }
}
