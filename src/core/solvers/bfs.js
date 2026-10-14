/**
 * @file bfs.js
 * Breadth-First Search maze solver.
 * Complexity: O(V + E) time, O(V) space.
 * Guarantees fewest hops (shortest path by edge count).
 */

import { Queue } from '../../structures/queue.js';
import { BitSet } from '../../structures/bitset.js';

export class BfsSolver {
  constructor() {
    this.id = 'bfs';
    this.name = 'Breadth-First Search';
    this.complexity = Object.freeze({
      time: 'O(V + E)',
      space: 'O(V)',
      note: 'FIFO ring-buffer queue; expands level by level. Guarantees fewest hops.',
    });
    this.guarantees = Object.freeze({
      optimalHops: true,
      optimalCost: false, // not optimal for arbitrary weights
    });
  }

  /**
   * @param {import('../grid.js').Grid} grid
   * @param {object} [opts]
   * @returns {Generator<object, import('../types.js').PathResult, void>}
   */
  *solve(grid, opts = {}) {
    const V = grid.size;
    const { start, end } = grid;
    const queue = new Queue();
    const visited = new BitSet(V);
    const parent = new Int32Array(V).fill(-1);
    const neighborBuf = new Int32Array(4);

    let expanded = 0;
    let frontierPeak = 0;
    let eventCount = 0;

    queue.enqueue(start);
    visited.set(start);
    frontierPeak = 1;
    eventCount++;
    yield { t: 'ENQUEUE', cell: start };

    let found = false;

    while (!queue.isEmpty()) {
      frontierPeak = Math.max(frontierPeak, queue.size);
      const curr = queue.dequeue();
      expanded++;
      eventCount++;
      yield { t: 'VISIT', cell: curr };

      if (curr === end) {
        found = true;
        break;
      }

      const count = grid.openNeighbors(curr, neighborBuf);
      for (let i = 0; i < count; i++) {
        const nb = neighborBuf[i];
        if (!visited.get(nb)) {
          visited.set(nb);
          parent[nb] = curr;
          queue.enqueue(nb);
          eventCount++;
          yield { t: 'ENQUEUE', cell: nb };
        }
      }
    }

    const path = [];
    let cost = 0;

    if (found) {
      let curr = end;
      while (curr !== -1) {
        path.push(curr);
        curr = parent[curr];
      }
      path.reverse();

      for (const cell of path) {
        eventCount++;
        yield { t: 'PATH', cell };
      }

      const useWeights = opts.weighted !== false;
      for (let i = 1; i < path.length; i++) {
        cost += useWeights ? grid.weightAt(path[i]) : 1;
      }
    }

    return {
      solverId: this.id,
      found,
      path,
      hops: found ? path.length - 1 : 0,
      cost,
      expanded,
      frontierPeak,
      eventCount,
    };
  }
}
