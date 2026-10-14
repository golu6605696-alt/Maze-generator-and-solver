/**
 * @file backtracker.js
 * Recursive Backtracker maze generator (iterative DFS with explicit stack).
 * Complexity: O(V) time, O(V) space. Produces mazes with long winding passages.
 */

import { Stack } from '../../structures/stack.js';
import { BitSet } from '../../structures/bitset.js';
import { DIRS } from '../constants.js';

export class BacktrackerGenerator {
  constructor() {
    this.id = 'bkt';
    this.name = 'Recursive Backtracker';
    this.complexity = Object.freeze({
      time: 'O(V)',
      space: 'O(V)',
      note: 'Iterative DFS with explicit stack; winding corridors, low branching factor.',
    });
  }

  /**
   * Generates a maze on grid, yielding events lazily.
   * @param {import('../grid.js').Grid} grid
   * @param {import('../../structures/rng.js').Rng} rng
   * @param {object} [opts]
   * @returns {Generator<object, { passages: number, steps: number }, void>}
   */
  *generate(grid, rng, opts = {}) {
    const genRng = rng.fork('gen');
    const V = grid.size;
    const startCell = opts.start !== undefined ? opts.start : 0;

    const stack = new Stack();
    const visited = new BitSet(V);
    let passages = 0;
    let steps = 0;

    visited.set(startCell);
    stack.push(startCell);

    const neighborBuf = new Int32Array(4);

    while (!stack.isEmpty()) {
      const current = stack.peek();
      const count = grid.neighbors(current, neighborBuf);

      // Find unvisited neighbors
      const unvisited = [];
      for (let i = 0; i < count; i++) {
        const nb = neighborBuf[i];
        if (!visited.get(nb)) {
          unvisited.push(nb);
        }
      }

      if (unvisited.length > 0) {
        const nextCell = unvisited[genRng.int(unvisited.length)];
        grid.carve(current, nextCell);
        visited.set(nextCell);
        stack.push(nextCell);
        passages++;
        steps++;
        yield { t: 'CARVE', from: current, to: nextCell };
      } else {
        stack.pop();
        steps++;
        yield { t: 'BACKTRACK', cell: current };
      }
    }

    return { passages, steps };
  }
}
