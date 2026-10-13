/**
 * @file dead_end_filling.js
 * Dead-End Filling maze solver.
 * Systematically identifies and fills non-solution cul-de-sacs, leaving behind
 * only the true solution corridor paths.
 *
 * Complexity: O(V) time and space, where V = rows * cols.
 */

import { Solver, SolveResult } from './solver.js';
import { Queue } from '../../structures/queue.js';
import { Step } from '../step.js';
import { reconstructPath } from './reconstruct.js';

export class DeadEndFilling extends Solver {
  constructor() {
    super('Dead-End Filling');
  }

  /**
   * Solves the maze by pruning dead ends and routing through remaining passages.
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
    const degree = new Uint8Array(grid.totalCells);
    const filled = new Uint8Array(grid.totalCells);
    const deadEndQueue = new Queue();

    const startIdx = grid.cellIndex(startCell.row, startCell.col);
    const endIdx = grid.cellIndex(endCell.row, endCell.col);

    // 1. Calculate degrees of all cells and enqueue initial dead ends
    for (const cell of grid) {
      const idx = grid.cellIndex(cell.row, cell.col);
      const openCount = grid.openNeighbors(cell).length;
      degree[idx] = openCount;

      if (openCount === 1 && idx !== startIdx && idx !== endIdx) {
        deadEndQueue.enqueue(cell);
      }
    }

    let visitedCount = 0;

    // 2. Cascade fill dead ends
    while (!deadEndQueue.isEmpty()) {
      const current = deadEndQueue.dequeue();
      const currIdx = grid.cellIndex(current.row, current.col);

      if (filled[currIdx] === 1) continue;
      filled[currIdx] = 1;
      visitedCount++;
      steps.push(Step.visit(current));

      const neighbors = grid.openNeighbors(current);
      for (let i = 0; i < neighbors.length; i++) {
        const neighbor = neighbors[i];
        const nIdx = grid.cellIndex(neighbor.row, neighbor.col);

        if (filled[nIdx] === 0) {
          degree[nIdx]--;
          if (degree[nIdx] === 1 && nIdx !== startIdx && nIdx !== endIdx) {
            deadEndQueue.enqueue(neighbor);
          }
        }
      }
    }

    // 3. Route through remaining unfilled cells using BFS
    const path = this._routeThroughUnfilled(grid, startCell, endCell, filled);
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

  /**
   * Finds the path from start to end through unfilled cells.
   *
   * @param {import('../grid.js').Grid} grid
   * @param {import('../cell.js').Cell} start
   * @param {import('../cell.js').Cell} end
   * @param {Uint8Array} filled
   * @returns {import('../cell.js').Cell[]}
   * @private
   */
  _routeThroughUnfilled(grid, start, end, filled) {
    const queue = new Queue();
    const visited = new Uint8Array(grid.totalCells);
    const parent = new Array(grid.totalCells).fill(null);

    const startIdx = grid.cellIndex(start.row, start.col);
    visited[startIdx] = 1;
    queue.enqueue(start);

    let reached = false;

    while (!queue.isEmpty()) {
      const current = queue.dequeue();
      if (current.row === end.row && current.col === end.col) {
        reached = true;
        break;
      }

      const neighbors = grid.openNeighbors(current);
      for (let i = 0; i < neighbors.length; i++) {
        const neighbor = neighbors[i];
        const nIdx = grid.cellIndex(neighbor.row, neighbor.col);

        if (visited[nIdx] === 0 && filled[nIdx] === 0) {
          visited[nIdx] = 1;
          parent[nIdx] = current;
          queue.enqueue(neighbor);
        }
      }
    }

    return reached ? reconstructPath(parent, start, end, grid) : [];
  }
}
