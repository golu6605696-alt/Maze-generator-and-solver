import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../../src/core/grid.js';
import { SeededRNG } from '../../src/structures/rng.js';
import { RecursiveBacktracker } from '../../src/core/generators/backtracker.js';
import { BenchmarkRunner } from '../../src/app/benchmark.js';

test('BenchmarkRunner - runs all solvers and returns metrics for each', () => {
  const grid = new Grid(8, 8);
  new RecursiveBacktracker().generate(grid, new SeededRNG(42));

  const runner = new BenchmarkRunner();
  const results = runner.compare(grid);

  assert.equal(results.length, 4);

  const names = results.map((r) => r.name);
  assert.ok(names.includes('BFS'));
  assert.ok(names.includes('Dijkstra'));
  assert.ok(names.includes('A*'));
  assert.ok(names.includes('DFS'));

  for (const r of results) {
    assert.equal(r.found, true);
    assert.ok(r.visitedCount > 0);
    assert.ok(r.pathLength > 0);
    assert.ok(r.cost > 0);
    assert.ok(r.timeMs >= 0);
  }
});
