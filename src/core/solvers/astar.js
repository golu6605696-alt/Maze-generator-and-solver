/**
 * @file astar.js
 * A* Search maze solver with Manhattan distance heuristic.
 * Uses a priority queue (MinHeap) on f = g + h to direct search toward the target.
 * Guarantees optimal path on 4-directional grids with admissible heuristic.
 *
 * Complexity: O(V log V) worst-case time, O(V) space, where V = rows * cols.
 */

import { Solver, SolveResult } from './solver.js';
import { MinHeap } from '../../structures/minheap.js';
import { manhattanDistance } from '../heuristics.js';
import { Step } from '../step.js';
import { reconstructPath } from './reconstruct.js';

export class AStar extends Solver {
  /**
   * @param {Function} [heuristic=manhattanDistance] - Admissible heuristic function (cell, target) => number
   */
  constructor(heuristic = manhattanDistance) {
    super('A*');
    this.heuristic = heuristic;
  }

  /**
   * Solves the maze using A* informed search.
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
    const minHeap = new MinHeap((a, b) => {
      if (a.f !== b.f) return a.f - b.f;
      return a.h - b.h; // Tie-breaker: prefer closer to goal
    });

    const gScore = new Float64Array(grid.totalCells).fill(Infinity);
    const closed = new Uint8Array(grid.totalCells);
    const parent = new Array(grid.totalCells).fill(null);

    const startIdx = grid.cellIndex(startCell.row, startCell.col);
    gScore[startIdx] = 0;
    const startH = this.heuristic(startCell, endCell);
    minHeap.push({ cell: startCell, g: 0, h: startH, f: startH });

    let visitedCount = 0;
    let reached = false;

    while (!minHeap.isEmpty()) {
      const { cell: current, g } = minHeap.pop();
      const currIdx = grid.cellIndex(current.row, current.col);

      // Skip stale priority queue entries
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

        const tentativeG = g + neighbor.weight;
        if (tentativeG < gScore[nIdx]) {
          gScore[nIdx] = tentativeG;
          parent[nIdx] = current;
          const h = this.heuristic(neighbor, endCell);
          const f = tentativeG + h;
          minHeap.push({ cell: neighbor, g: tentativeG, h, f });
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
