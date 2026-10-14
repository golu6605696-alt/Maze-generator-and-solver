/**
 * @file kruskal.js
 * Randomized Kruskal's maze generator using Disjoint-Set Union (DSU).
 * Complexity: O(E * alpha(V)) near-linear time, O(V + E) space.
 * Produces uniform-looking mazes with many short cul-de-sacs.
 */

import { DSU } from '../../structures/dsu.js';
import { Wall } from '../constants.js';

export class KruskalGenerator {
  constructor() {
    this.id = 'krk';
    this.name = "Randomized Kruskal's";
    this.complexity = Object.freeze({
      time: 'O(E * alpha(V))',
      space: 'O(V + E)',
      note: 'DSU with path compression and rank union; shuffled edge list.',
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
    const dsu = new DSU(V);

    // Build all internal edges (a < b)
    const edges = [];
    for (let i = 0; i < V; i++) {
      // East neighbor
      const east = grid.neighbor(i, Wall.E);
      if (east !== -1) edges.push({ a: i, b: east });
      // South neighbor
      const south = grid.neighbor(i, Wall.S);
      if (south !== -1) edges.push({ a: i, b: south });
    }

    genRng.shuffle(edges);

    let passages = 0;
    let steps = 0;
    const targetPassages = V - 1;

    for (let i = 0; i < edges.length && passages < targetPassages; i++) {
      const { a, b } = edges[i];
      steps++;
      if (dsu.union(a, b)) {
        grid.carve(a, b);
        passages++;
        yield { t: 'UNION', a, b };
      } else {
        yield { t: 'REJECT', a, b };
      }
    }

    return { passages, steps };
  }
}
