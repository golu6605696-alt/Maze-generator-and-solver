/**
 * @file benchmark.js
 * Multi-algorithm benchmark comparison runner.
 * Evaluates all solvers on independent clones of the current maze, collecting
 * performance metrics (visited count, path length, cost, and execution duration).
 *
 * Complexity: O(K * V log V) where K is number of solvers and V is grid size.
 */

import { BFS, Dijkstra, AStar, DFS } from '../core/solvers/index.js';

export class BenchmarkRunner {
  /**
   * @param {import('../core/solvers/solver.js').Solver[]} [solvers]
   */
  constructor(solvers = null) {
    this.solvers = solvers ?? [
      new BFS(),
      new Dijkstra(),
      new AStar(),
      new DFS(),
    ];
  }

  /**
   * Runs each configured solver on an isolated deep copy of the grid.
   *
   * @param {import('../core/grid.js').Grid} grid
   * @returns {Array<{name: string, found: boolean, visitedCount: number, pathLength: number, cost: number, timeMs: number}>}
   */
  compare(grid) {
    if (!grid) {
      throw new TypeError('BenchmarkRunner requires a valid Grid instance');
    }

    const results = [];

    for (let i = 0; i < this.solvers.length; i++) {
      const solver = this.solvers[i];
      // Clone grid to guarantee zero cross-run interference
      const isolatedGrid = grid.clone();

      const solveResult = solver.solve(isolatedGrid);

      results.push({
        name: solver.name,
        found: solveResult.found,
        visitedCount: solveResult.visitedCount,
        pathLength: solveResult.pathLength,
        cost: solveResult.cost,
        timeMs: Math.round(solveResult.timeMs * 100) / 100,
      });
    }

    return results;
  }
}
