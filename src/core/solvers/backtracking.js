/**
 * @file backtracking.js
 * Backtracking (Recursive Depth-First Search with trail) maze solver.
 * Complexity: O(V + E) time, O(V) space.
 * Systematically advances along a tentative corridor path and backtracks
 * when encountering a dead end until reaching the goal. Complete on all mazes.
 */

import { BitSet } from '../../structures/bitset.js';

export class BacktrackingSolver {
  constructor() {
    this.id = 'bkt';
    this.name = 'Backtracking Search';
    this.complexity = Object.freeze({
      time: 'O(V + E)',
      space: 'O(V)',
      note: 'Explores along a tentative path; explicitly backtracks from dead ends. Complete.',
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
    const visited = new BitSet(V);
    const parent = new Int32Array(V).fill(-1);
    const neighborBuf = new Int32Array(4);

    let expanded = 0;
    let frontierPeak = 0;
    let eventCount = 0;

    // Tentative path stack
    const pathStack = [start];
    visited.set(start);
    frontierPeak = 1;
    expanded = 1;
    eventCount++;
    yield { t: 'ENQUEUE', cell: start };
    yield { t: 'VISIT', cell: start };

    let found = (start === end);

    while (pathStack.length > 0 && !found) {
      frontierPeak = Math.max(frontierPeak, pathStack.length);
      const curr = pathStack[pathStack.length - 1];

      if (curr === end) {
        found = true;
        break;
      }

      // Check open neighbors in canonical order (N, E, S, W)
      const count = grid.openNeighbors(curr, neighborBuf);
      let stepped = false;

      for (let i = 0; i < count; i++) {
        const nb = neighborBuf[i];
        if (!visited.get(nb)) {
          visited.set(nb);
          parent[nb] = curr;
          pathStack.push(nb);
          expanded++;
          eventCount++;
          yield { t: 'ENQUEUE', cell: nb };
          yield { t: 'VISIT', cell: nb };
          stepped = true;
          if (nb === end) {
            found = true;
          }
          break; // Step forward along this active branch
        }
      }

      if (!stepped && !found) {
        // Dead end reached! Backtrack step
        const deadEnd = pathStack.pop();
        eventCount++;
        yield { t: 'BACKTRACK', cell: deadEnd };
      }
    }

    const path = [];
    let cost = 0;

    if (found) {
      for (const cell of pathStack) {
        path.push(cell);
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
