import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../../src/core/grid.js';
import { SeededRNG } from '../../src/structures/rng.js';
import { RecursiveBacktracker } from '../../src/core/generators/backtracker.js';
import { WallFollower } from '../../src/core/solvers/wall_follower.js';

test('WallFollower - solves perfect maze from start to end', () => {
  const grid = new Grid(10, 10);
  new RecursiveBacktracker().generate(grid, new SeededRNG(12345));

  const solver = new WallFollower();
  const result = solver.solve(grid);

  assert.equal(result.found, true);
  assert.ok(result.pathLength > 0);
  assert.equal(result.path[0].row, grid.start.row);
  assert.equal(result.path[0].col, grid.start.col);
  assert.equal(result.path[result.path.length - 1].row, grid.end.row);
  assert.equal(result.path[result.path.length - 1].col, grid.end.col);

  // Every step along path must be open
  for (let i = 0; i < result.path.length - 1; i++) {
    assert.equal(grid.hasWall(result.path[i], result.path[i + 1]), false);
  }
});
