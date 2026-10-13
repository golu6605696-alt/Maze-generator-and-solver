/**
 * @file bfs.js
 * Breadth-First Search maze solver.
 * Explores cell frontiers evenly level-by-level using a FIFO Queue.
 * Guarantees finding the shortest path on unweighted mazes.
 *
 * Complexity: O(V) time and space, where V = rows * cols.
 */

import { Solver, SolveResult } from './solver.js';
import { Queue } from '../../structures/queue.js';
import { Step } from '../step.js';
import { reconstructPath } from './reconstruct.js';

export class BFS extends Solver {
  constructor() {
    super('BFS');
  }

  /**
   * Solves the maze using breadth-first search.
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
    const queue = new Queue();
    const visited = new Uint8Array(grid.totalCells);
    const parent = new Array(grid.totalCells).fill(null);
    let visitedCount = 0;
    let reached = false;

    const startIdx = grid.cellIndex(startCell.row, startCell.col);
    visited[startIdx] = 1;
    queue.enqueue(startCell);

    while (!queue.isEmpty()) {
      const current = queue.dequeue();
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
        if (visited[nIdx] === 0) {
          visited[nIdx] = 1;
          parent[nIdx] = current;
          queue.enqueue(neighbor);
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
