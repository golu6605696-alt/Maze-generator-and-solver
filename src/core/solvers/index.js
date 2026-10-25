/**
 * @file index.js
 * Solver registry and runner export.
 */

import { DfsSolver } from './dfs.js';
import { BfsSolver } from './bfs.js';
import { DijkstraSolver } from './dijkstra.js';
import { AStarSolver } from './astar.js';
import { WallFollowerSolver } from './wallfollower.js';
import { BacktrackingSolver } from './backtracking.js';
import { drain } from '../iter.js';

export {
  DfsSolver,
  BfsSolver,
  DijkstraSolver,
  AStarSolver,
  WallFollowerSolver,
  BacktrackingSolver,
};

export const SOLVERS = Object.freeze({
  dfs: new DfsSolver(),
  bfs: new BfsSolver(),
  dij: new DijkstraSolver(),
  ast: new AStarSolver(),
  wfl: new WallFollowerSolver(),
  bkt: new BacktrackingSolver(),
});

/**
 * Retrieves a solver instance by id.
 * @param {string} id
 * @returns {import('../types.js').Solver}
 */
export function getSolver(id) {
  if (id === 'backtrack') return SOLVERS.bkt;
  const solver = SOLVERS[id];
  if (!solver) {
    throw new Error(`Unknown solver id: ${id}`);
  }
  return solver;
}

/**
 * Runs a solver headlessly to completion on a grid.
 * @param {import('../types.js').Solver} solver
 * @param {import('../grid.js').Grid} grid
 * @param {object} [opts]
 * @returns {import('../types.js').PathResult}
 */
export function runSolver(solver, grid, opts = { weighted: true }) {
  const it = solver.solve(grid, opts);
  return drain(it);
}
