import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../../src/core/grid.js';
import { Rng } from '../../src/structures/rng.js';
import { GENERATORS } from '../../src/core/generators/index.js';
import { analyzeMaze } from '../../src/core/analyzer.js';
import { drain } from '../../src/core/iter.js';

test('analyzeMaze - evaluates topological metrics on generated maze', () => {
  const rng = new Rng('analyzer_seed_1');
  const grid = new Grid(15, 15, true);
  drain(GENERATORS.bkt.generate(grid, rng));

  const stats = analyzeMaze(grid);
  assert.equal(stats.rows, 15);
  assert.equal(stats.cols, 15);
  assert.equal(stats.cells, 225);
  assert.equal(stats.isPerfect, true);
  assert.equal(stats.loops, 0);
  assert.equal(stats.connected, true);
  assert.ok(stats.deadEnds > 5);
  assert.ok(stats.avgBranchingFactor > 1.5);
  assert.equal(stats.solvable, true);
});
