/**
 * @file performance_100x100.test.js
 * 100x100 performance test suite verifying headless speed benchmarks.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../../src/core/grid.js';
import { Rng } from '../../src/structures/rng.js';
import { GENERATORS } from '../../src/core/generators/index.js';
import { SOLVERS, runSolver } from '../../src/core/solvers/index.js';
import { validate } from '../../src/core/validate.js';
import { drain } from '../../src/core/iter.js';

test('Performance 100x100 - Recursive Backtracker generates 10,000 cells fast', () => {
  const rng = new Rng('perf_100_bkt');
  const grid = new Grid(100, 100, true);

  const t0 = performance.now();
  drain(GENERATORS.bkt.generate(grid, rng));
  const elapsed = performance.now() - t0;

  const val = validate(grid);
  assert.equal(val.isPerfect, true);
  assert.equal(val.openPassages, 9999);
  assert.ok(elapsed < 1000, `Generation took ${elapsed}ms (expected < 1000ms)`);
});

test('Performance 100x100 - A* and BFS solve 10,000 cell maze fast', () => {
  const rng = new Rng('perf_100_solve');
  const grid = new Grid(100, 100, true);
  drain(GENERATORS.bkt.generate(grid, rng));

  const t0 = performance.now();
  const resAst = runSolver(SOLVERS.ast, grid);
  const astElapsed = performance.now() - t0;

  assert.equal(resAst.found, true);
  assert.ok(resAst.hops > 100);
  assert.ok(astElapsed < 500, `A* solve took ${astElapsed}ms`);

  const t1 = performance.now();
  const resBfs = runSolver(SOLVERS.bfs, grid);
  const bfsElapsed = performance.now() - t1;

  assert.equal(resBfs.found, true);
  assert.equal(resBfs.hops, resAst.hops);
  assert.ok(bfsElapsed < 500, `BFS solve took ${bfsElapsed}ms`);
});
