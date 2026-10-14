import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../../src/core/grid.js';
import { Rng } from '../../src/structures/rng.js';
import { GENERATORS } from '../../src/core/generators/index.js';
import { WallFollowerSolver } from '../../src/core/solvers/wallfollower.js';
import { drain } from '../../src/core/iter.js';

test('WallFollower - solves perfect maze from start to end', () => {
  const grid = new Grid(10, 10, true);
  drain(GENERATORS.bkt.generate(grid, new Rng('wfl_test_12345')));

  const solver = new WallFollowerSolver();
  const result = drain(solver.solve(grid));

  assert.equal(result.found, true);
  assert.ok(result.hops > 0);
  assert.equal(result.path[0], grid.start);
  assert.equal(result.path[result.path.length - 1], grid.end);

  // Every step along path must be an open passage
  const neighborBuf = new Int32Array(4);
  for (let i = 0; i < result.path.length - 1; i++) {
    const a = result.path[i];
    const b = result.path[i + 1];
    const count = grid.openNeighbors(a, neighborBuf);
    let isOpen = false;
    for (let k = 0; k < count; k++) {
      if (neighborBuf[k] === b) isOpen = true;
    }
    assert.equal(isOpen, true, `Passage must be open between ${a} and ${b}`);
  }
});
