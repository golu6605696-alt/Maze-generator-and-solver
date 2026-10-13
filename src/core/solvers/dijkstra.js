/**
 * @file dijkstra.js
 * Dijkstra's shortest path algorithm for weighted and unweighted mazes.
 * Uses a binary MinHeap priority queue ordered by cumulative path cost.
 * Guarantees optimal (lowest cost) path on graphs with non-negative edge weights.
 *
 * Complexity: O(V log V) time, O(V) space, where V = rows * cols.
 */

import { Solver, SolveResult } from './solver.js';
import { MinHeap } from '../../structures/minheap.js';
import { Step } from '../step.js';
import { reconstructPath } from './reconstruct.js';

export class Dijkstra extends Solver {
  constructor() {
    super('Dijkstra');
  }

  /**
   * Solves the maze grid finding the minimal-cost path.
   *
   * @param {import('../grid.js').Grid} grid
   * @param {import('../cell.js').Cell|[number, number]} [start]
   * @param {import('../cell.js').Cell|[number, number]} [end]
   * @returns {SolveResult}
   */
  solve(grid, start, end) {
    const startTime = performance.now();
    const { start: startCell, end: endCell } = this._resolveEndpoints(grid, start, end);

    const steps = [];
    const minHeap = new MinHeap((a, b) => a.dist - b.dist);
    const dist = new Float64Array(grid.totalCells).fill(Infinity);
    const closed = new Uint8Array(grid.totalCells);
    const parent = new Array(grid.totalCells).fill(null);

    const startIdx = grid.cellIndex(startCell.row, startCell.col);
    dist[startIdx] = 0;
    minHeap.push({ cell: startCell, dist: 0 });

    let visitedCount = 0;
    let reached = false;

    while (!minHeap.isEmpty()) {
      const { cell: current, dist: currentDist } = minHeap.pop();
      const currIdx = grid.cellIndex(current.row, current.col);

      // Lazy deletion: ignore outdated priority queue entries
      if (closed[currIdx] === 1) {
        continue;
      }
      closed[currIdx] = 1;

      steps.push(Step.visit(current));
      visitedCount++;

      if (current.row === endCell.row && current.col === endCell.col) {
        reached = true;
        break;
      }

      const neighbors = grid.openNeighbors(current);
      for (let i = 0; i < neighbors.length; i++) {
        const neighbor = neighbors[i];
        const nIdx = grid.cellIndex(neighbor.row, neighbor.col);

        if (closed[nIdx] === 1) {
          continue;
        }

        const altDist = currentDist + neighbor.weight;
        if (altDist < dist[nIdx]) {
          dist[nIdx] = altDist;
          parent[nIdx] = current;
          minHeap.push({ cell: neighbor, dist: altDist });
        }
      }
    }

    const path = reached ? reconstructPath(parent, startCell, endCell, grid) : [];
    for (let i = 0; i < path.length; i++) {
      steps.push(Step.path(path[i]));
    }

    const timeMs = performance.now() - startTime;
    const cost = this._computeCost(path);

    return new SolveResult({
      path,
      visitedCount,
      steps,
      timeMs,
      cost,
    });
  }
}
