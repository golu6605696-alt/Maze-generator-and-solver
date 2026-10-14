/**
 * @file astar.js
 * A* search algorithm using Manhattan heuristic scaled by MIN_WEIGHT.
 * Complexity: O((V + E) log V) worst case; expands far fewer cells than Dijkstra in practice.
 * Guarantees optimal (lowest cost) path because heuristic is admissible and consistent.
 */

import { MinHeap } from '../../structures/minheap.js';
import { BitSet } from '../../structures/bitset.js';
import { manhattan } from '../heuristics.js';

export class AStarSolver {
  constructor() {
    this.id = 'ast';
    this.name = 'A* Search';
    this.complexity = Object.freeze({
      time: 'O((V + E) log V)',
      space: 'O(V)',
      note: 'MinHeap on f = g + h; directed heuristic funnel. Admissible & cost-optimal.',
    });
    this.guarantees = Object.freeze({
      optimalHops: false,
      optimalCost: true,
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
    const endR = grid.rowOf(end);
    const endC = grid.colOf(end);

    const heap = new MinHeap();
    const gScore = new Int32Array(V).fill(0x3fffffff);
    const parent = new Int32Array(V).fill(-1);
    const closed = new BitSet(V);
    const neighborBuf = new Int32Array(4);

    let expanded = 0;
    let frontierPeak = 0;
    let eventCount = 0;

    gScore[start] = 0;
    const startH = manhattan(grid.rowOf(start), grid.colOf(start), endR, endC);
    heap.insert(start, startH);
    frontierPeak = 1;
    eventCount++;
    yield { t: 'ENQUEUE', cell: start };

    let found = false;
    const useWeights = opts.weighted !== false;

    while (!heap.isEmpty()) {
      frontierPeak = Math.max(frontierPeak, heap.size);
      const curr = heap.extractMin();

      if (closed.get(curr)) continue;
      closed.set(curr);
      expanded++;
      const currG = gScore[curr];
      const currH = manhattan(grid.rowOf(curr), grid.colOf(curr), endR, endC);
      eventCount++;
      yield { t: 'VISIT', cell: curr, g: currG, h: currH };

      if (curr === end) {
        found = true;
        break;
      }

      const count = grid.openNeighbors(curr, neighborBuf);
      for (let i = 0; i < count; i++) {
        const nb = neighborBuf[i];
        if (closed.get(nb)) continue;

        const weight = useWeights ? grid.weightAt(nb) : 1;
        const tentativeG = currG + weight;

        if (tentativeG < gScore[nb]) {
          const isUpdate = gScore[nb] !== 0x3fffffff;
          gScore[nb] = tentativeG;
          parent[nb] = curr;
          const h = manhattan(grid.rowOf(nb), grid.colOf(nb), endR, endC);
          const f = tentativeG + h;
          heap.insert(nb, f);
          eventCount++;
          if (isUpdate) {
            yield { t: 'RELAX', cell: nb, g: tentativeG };
          } else {
            yield { t: 'ENQUEUE', cell: nb };
          }
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
