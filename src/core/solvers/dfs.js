/**
 * @file dfs.js
 * Depth-First Search maze solver.
 * Complexity: O(V + E) time, O(V) space.
 * Does not guarantee shortest or least-cost path.
 */

import { Stack } from '../../structures/stack.js';
import { BitSet } from '../../structures/bitset.js';

export class DfsSolver {
  constructor() {
    this.id = 'dfs';
    this.name = 'Depth-First Search';
    this.complexity = Object.freeze({
      time: 'O(V + E)',
      space: 'O(V)',
      note: 'Stack with parent map; explores deeply before backtracking. Not optimal.',
    });
    this.guarantees = Object.freeze({
      optimalHops: false,
      optimalCost: false,
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
    const stack = new Stack();
    const visited = new BitSet(V);
    const parent = new Int32Array(V).fill(-1);
    const neighborBuf = new Int32Array(4);

    let expanded = 0;
    let frontierPeak = 0;
    let eventCount = 0;

    stack.push(start);
    visited.set(start);
    frontierPeak = 1;
    eventCount++;
    yield { t: 'ENQUEUE', cell: start };

    let found = false;

    while (!stack.isEmpty()) {
      frontierPeak = Math.max(frontierPeak, stack.size);
      const curr = stack.pop();
      expanded++;
      eventCount++;
      yield { t: 'VISIT', cell: curr };

      if (curr === end) {
        found = true;
        break;
      }

      // Check open neighbors in N, E, S, W canonical order
      const count = grid.openNeighbors(curr, neighborBuf);
      let pushedAny = false;
      for (let i = 0; i < count; i++) {
        const nb = neighborBuf[i];
        if (!visited.get(nb)) {
          visited.set(nb);
          parent[nb] = curr;
          stack.push(nb);
          eventCount++;
          yield { t: 'ENQUEUE', cell: nb };
          pushedAny = true;
        }
      }

      if (!pushedAny && curr !== end) {
        eventCount++;
        yield { t: 'BACKTRACK', cell: curr };
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

      // Yield PATH events in start -> end order
      for (const cell of path) {
        eventCount++;
        yield { t: 'PATH', cell };
      }

      // Cost is sum of entered cells (start excluded)
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
