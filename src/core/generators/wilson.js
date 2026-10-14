/**
 * @file wilson.js
 * Wilson's algorithm for uniform spanning tree maze generation using loop-erased random walks.
 * Complexity: Expected O(V log V) time, O(V) space. Completely unbiased distribution.
 */

import { BitSet } from '../../structures/bitset.js';

export class WilsonGenerator {
  constructor() {
    this.id = 'wil';
    this.name = "Wilson's Algorithm";
    this.complexity = Object.freeze({
      time: 'Expected O(V log V)',
      space: 'O(V)',
      note: 'Loop-erased random walk; produces truly uniform spanning trees without bias.',
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
    const V = grid.size;
    const inTree = new BitSet(V);
    const next = new Int32Array(V).fill(-1);
    const neighborBuf = new Int32Array(4);

    let passages = 0;
    let steps = 0;

    // Pick first cell to add to the tree
    const root = opts.start !== undefined ? opts.start : genRng.int(V);
    inTree.set(root);
    let treeSize = 1;

    for (let i = 0; i < V && treeSize < V; i++) {
      if (inTree.get(i)) continue;

      // Start random walk from cell i
      let curr = i;
      while (!inTree.get(curr)) {
        const count = grid.neighbors(curr, neighborBuf);
        const stepNb = neighborBuf[genRng.int(count)];

        if (next[curr] !== -1 && next[curr] !== stepNb) {
          steps++;
          yield { t: 'ERASE', cell: curr };
        }

        next[curr] = stepNb;
        steps++;
        yield { t: 'WALK', cell: curr };
        curr = stepNb;
      }

      // Retrace the loop-erased path from i to the tree
      curr = i;
      while (!inTree.get(curr)) {
        const nxt = next[curr];
        grid.carve(curr, nxt);
        inTree.set(curr);
        treeSize++;
        passages++;
        steps++;
        yield { t: 'CARVE', from: curr, to: nxt };
        curr = nxt;
      }
    }

    return { passages, steps };
  }
}
