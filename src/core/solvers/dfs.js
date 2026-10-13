/**
 * @file dfs.js
 * Iterative Depth-First Search maze solver.
 * Uses an explicit Stack to avoid recursion limits. Explores deeply along branches.
 * Note: DFS is not guaranteed to find the shortest path in mazes with loops.
 *
 * Complexity: O(V) time and space, where V = rows * cols.
 */

import { Solver, SolveResult } from './solver.js';
import { Stack } from '../../structures/stack.js';
import { Step } from '../step.js';
import { reconstructPath } from './reconstruct.js';

export class DFS extends Solver {
  constructor() {
    super('DFS');
  }

  /**
   * Solves the maze using iterative depth-first search.
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
    const stack = new Stack();
    const visited = new Uint8Array(grid.totalCells);
    const parent = new Array(grid.totalCells).fill(null);
    let visitedCount = 0;
    let reached = false;

    const startIdx = grid.cellIndex(startCell.row, startCell.col);
    visited[startIdx] = 1;
    stack.push(startCell);

    while (!stack.isEmpty()) {
      const current = stack.pop();
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
          stack.push(neighbor);
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
