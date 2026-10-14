/**
 * @file dijkstra.js
 * Dijkstra's algorithm for shortest cost pathfinding on weighted graphs.
 * Complexity: O((V + E) log V) time, O(V) space.
 * Guarantees optimal (lowest cost) path for non-negative weights.
 */

import { MinHeap } from '../../structures/minheap.js';
import { BitSet } from '../../structures/bitset.js';

export class DijkstraSolver {
  constructor() {
    this.id = 'dij';
    this.name = "Dijkstra's Algorithm";
    this.complexity = Object.freeze({
      time: 'O((V + E) log V)',
      space: 'O(V)',
      note: 'MinHeap with distance array; guarantees lowest-cost path on weighted grids.',
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
    const heap = new MinHeap();
    const dist = new Int32Array(V).fill(0x3fffffff); // large positive int sentinel
    const parent = new Int32Array(V).fill(-1);
    const settled = new BitSet(V);
    const neighborBuf = new Int32Array(4);

    let expanded = 0;
    let frontierPeak = 0;
    let eventCount = 0;

    dist[start] = 0;
    heap.insert(start, 0);
    frontierPeak = 1;
    eventCount++;
    yield { t: 'ENQUEUE', cell: start };

    let found = false;
    const useWeights = opts.weighted !== false;

    while (!heap.isEmpty()) {
      frontierPeak = Math.max(frontierPeak, heap.size);
      const curr = heap.extractMin();

      if (settled.get(curr)) continue;
      settled.set(curr);
      expanded++;
      eventCount++;
      yield { t: 'VISIT', cell: curr, g: dist[curr] };

      if (curr === end) {
        found = true;
        break;
      }

      const count = grid.openNeighbors(curr, neighborBuf);
      for (let i = 0; i < count; i++) {
        const nb = neighborBuf[i];
        if (settled.get(nb)) continue;

        const weight = useWeights ? grid.weightAt(nb) : 1;
        const newDist = dist[curr] + weight;

        if (newDist < dist[nb]) {
          const isUpdate = dist[nb] !== 0x3fffffff;
          dist[nb] = newDist;
          parent[nb] = curr;
          heap.insert(nb, newDist);
          eventCount++;
          if (isUpdate) {
            yield { t: 'RELAX', cell: nb, g: newDist };
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
