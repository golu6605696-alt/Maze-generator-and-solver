import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../../src/core/grid.js';
import { Rng } from '../../src/structures/rng.js';
import { GENERATORS } from '../../src/core/generators/index.js';
import { SOLVERS, runSolver } from '../../src/core/solvers/index.js';
import { braid } from '../../src/core/braid.js';
import { assignTerrain } from '../../src/core/terrain.js';
import { drain } from '../../src/core/iter.js';
import { Wall } from '../../src/core/constants.js';

test('Solvers - optimality agreement on perfect mazes (T-V1)', () => {
  const rng = new Rng('perfect_solver_test');
  const grid = new Grid(15, 15, true);
  drain(GENERATORS.bkt.generate(grid, rng));

  const resBfs = runSolver(SOLVERS.bfs, grid);
  const resDij = runSolver(SOLVERS.dij, grid);
  const resAst = runSolver(SOLVERS.ast, grid);

  assert.equal(resBfs.found, true);
  assert.equal(resDij.found, true);
  assert.equal(resAst.found, true);

  // In a perfect tree, there is exactly one unique simple path from start to end
  assert.equal(resBfs.hops, resDij.hops);
  assert.equal(resDij.hops, resAst.hops);
  assert.equal(resBfs.cost, resDij.cost);
  assert.equal(resDij.cost, resAst.cost);
  assert.deepEqual(resBfs.path, resDij.path);
  assert.deepEqual(resDij.path, resAst.path);
});

test('Solvers - weighted optimality on braided weighted mazes (T-V2)', () => {
  const rng = new Rng('weighted_solver_test');
  const grid = new Grid(20, 20, true);
  drain(GENERATORS.krk.generate(grid, rng));
  braid(grid, 30, rng);
  assignTerrain(grid, 25, rng);

  const resDij = runSolver(SOLVERS.dij, grid, { weighted: true });
  const resAst = runSolver(SOLVERS.ast, grid, { weighted: true });
  const resBfs = runSolver(SOLVERS.bfs, grid, { weighted: true });
  const resDfs = runSolver(SOLVERS.dfs, grid, { weighted: true });

  assert.equal(resDij.found, true);
  assert.equal(resAst.found, true);
  assert.equal(resBfs.found, true);

  // Dijkstra and A* must return equal optimal cost
  assert.equal(resDij.cost, resAst.cost, 'Dijkstra and A* cost mismatch');
  // Optimal cost must be <= BFS cost on weighted maze
  assert.ok(resDij.cost <= resBfs.cost, 'Dijkstra cost should be <= BFS cost');
  // DFS cost is >= Dijkstra optimal cost
  assert.ok(resDfs.cost >= resDij.cost, 'DFS cost should be >= optimal Dijkstra cost');
});

test('Solvers - unreachable end returns found=false and never throws (T-V4)', () => {
  const grid = new Grid(10, 10, true); // fully walled
  for (const solver of Object.values(SOLVERS)) {
    const res = runSolver(solver, grid);
    assert.equal(res.found, false, `${solver.id} should not find path in closed grid`);
    assert.equal(res.hops, 0);
    assert.equal(res.cost, 0);
    assert.deepEqual(res.path, []);
  }
});

test('Solvers - grid purity invariant (T-V5)', () => {
  const rng = new Rng('purity_test');
  const grid = new Grid(10, 10, true);
  drain(GENERATORS.prm.generate(grid, rng));

  const fpBefore = grid.fingerprint();

  for (const solver of Object.values(SOLVERS)) {
    runSolver(solver, grid);
    const fpAfter = grid.fingerprint();
    assert.equal(fpBefore, fpAfter, `Solver ${solver.id} mutated the grid`);
  }
});

test('Solvers - Wall Follower right-hand rule solves perfect mazes', () => {
  const rng = new Rng('wall_follower_test');
  const grid = new Grid(12, 12, true);
  drain(GENERATORS.bkt.generate(grid, rng));

  const res = runSolver(SOLVERS.wfl, grid);
  assert.equal(res.found, true);
  assert.ok(res.path.length > 0);
});

test('Solvers - Backtracking solver solves perfect and braided mazes', () => {
  const rng = new Rng('backtrack_solver_test');
  const grid = new Grid(15, 15, true);
  drain(GENERATORS.prm.generate(grid, rng));
  braid(grid, 20, rng);

  const res = runSolver(SOLVERS.bkt, grid);
  assert.equal(res.found, true);
  assert.ok(res.path.length > 0);
  assert.equal(res.path[0], grid.start);
  assert.equal(res.path[res.path.length - 1], grid.end);
});

