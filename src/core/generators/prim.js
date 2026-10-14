/**
 * @file prim.js
 * Randomized Prim's maze generator.
 * Complexity: O(V) time, O(V) space. Produces mazes with many short dead ends and a radial feel.
 */

import { BitSet } from '../../structures/bitset.js';

export class PrimGenerator {
  constructor() {
    this.id = 'prm';
    this.name = "Randomized Prim's";
    this.complexity = Object.freeze({
      time: 'O(V)',
      space: 'O(V)',
      note: "Frontier array with swap-remove; high branching factor, short dead ends.",
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
    const startCell = opts.start !== undefined ? opts.start : genRng.int(V);

    const inTree = new BitSet(V);
    const inFrontier = new BitSet(V);
    const frontier = []; // array of cell indices
    const neighborBuf = new Int32Array(4);

    let passages = 0;
    let steps = 0;

    inTree.set(startCell);

    // Add startCell's neighbors to frontier
    const initialCount = grid.neighbors(startCell, neighborBuf);
    for (let i = 0; i < initialCount; i++) {
      const nb = neighborBuf[i];
      inFrontier.set(nb);
      frontier.push(nb);
      steps++;
      yield { t: 'FRONTIER_ADD', cell: nb };
    }

    while (frontier.length > 0) {
      // Pick random cell from frontier using swap-remove
      const fIdx = genRng.int(frontier.length);
      const cell = frontier[fIdx];
      // swap-remove
      frontier[fIdx] = frontier[frontier.length - 1];
      frontier.pop();
      inFrontier.clear(cell);

      // Find all neighbors of cell that are already in the tree
      const count = grid.neighbors(cell, neighborBuf);
      const treeNeighbors = [];
      for (let i = 0; i < count; i++) {
        const nb = neighborBuf[i];
        if (inTree.get(nb)) {
          treeNeighbors.push(nb);
        }
      }

      if (treeNeighbors.length > 0) {
        // Connect to a random in-tree neighbor
        const chosen = treeNeighbors[genRng.int(treeNeighbors.length)];
        grid.carve(cell, chosen);
        inTree.set(cell);
        passages++;
        steps++;
        yield { t: 'CARVE', from: cell, to: chosen };

        // Add unvisited neighbors of cell to frontier
        for (let i = 0; i < count; i++) {
          const nb = neighborBuf[i];
          if (!inTree.get(nb) && !inFrontier.get(nb)) {
            inFrontier.set(nb);
            frontier.push(nb);
            steps++;
            yield { t: 'FRONTIER_ADD', cell: nb };
          }
        }
      }
    }

    return { passages, steps };
  }
}
