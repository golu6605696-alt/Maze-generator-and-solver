/**
 * @file kruskal.js
 * Randomized Kruskal's maze generator.
 * Treats the grid as an undirected graph, shuffles all internal walls as potential edges,
 * and uses Disjoint Set Union (DSU) to carve passages without creating cycles.
 * Produces mazes with a balanced tree topology, many dead ends, and short cul-de-sacs.
 *
 * Complexity: O(E alpha(V)) time, O(V + E) space, where V = cells and E = internal walls.
 */

import { Generator } from './generator.js';
import { DisjointSetUnion } from '../../structures/dsu.js';
import { SeededRNG } from '../../structures/rng.js';
import { Step } from '../step.js';
import { ALL_WALLS } from '../cell.js';

export class RandomizedKruskals extends Generator {
  constructor() {
    super("Randomized Kruskal's");
  }

  /**
   * Generates a perfect maze using Randomized Kruskal's algorithm.
   *
   * @param {import('../grid.js').Grid} grid
   * @param {import('../../structures/rng.js').SeededRNG} [rng]
   * @returns {Step[]}
   */
  generate(grid, rng = new SeededRNG()) {
    grid.resetWalls(ALL_WALLS);

    const steps = [];
    const edges = this._buildInternalEdges(grid);
    rng.shuffle(edges);

    const dsu = new DisjointSetUnion(grid.totalCells);

    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      if (dsu.union(edge.u, edge.v)) {
        grid.removeWall(edge.cellA, edge.cellB);
        steps.push(Step.carve(edge.cellB, { from: edge.cellA }));

        // Stop early once all cells form a single connected component
        if (dsu.count === 1) {
          break;
        }
      }
    }

    return steps;
  }

  /**
   * Builds an array of all internal orthogonal walls/edges in the grid.
   *
   * @param {import('../grid.js').Grid} grid
   * @returns {Array<{cellA: import('../cell.js').Cell, cellB: import('../cell.js').Cell, u: number, v: number}>}
   * @private
   */
  _buildInternalEdges(grid) {
    const edges = [];
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const u = grid.cellIndex(r, c);
        const cellA = grid.getCell(r, c);

        // East boundary edge
        if (c + 1 < grid.cols) {
          edges.push({
            cellA,
            cellB: grid.getCell(r, c + 1),
            u,
            v: grid.cellIndex(r, c + 1),
          });
        }

        // South boundary edge
        if (r + 1 < grid.rows) {
          edges.push({
            cellA,
            cellB: grid.getCell(r + 1, c),
            u,
            v: grid.cellIndex(r + 1, c),
          });
        }
      }
    }
    return edges;
  }
}
