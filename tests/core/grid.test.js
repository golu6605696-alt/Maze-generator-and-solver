import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../../src/core/grid.js';
import { Wall } from '../../src/core/constants.js';

test('Grid - initializes with typed arrays and default start/end', () => {
  const grid = new Grid(4, 5, true);

  assert.equal(grid.rows, 4);
  assert.equal(grid.cols, 5);
  assert.equal(grid.size, 20);
  assert.equal(grid.start, 0);
  assert.equal(grid.end, 19);

  assert.equal(grid.walls.length, 20);
  assert.equal(grid.terrain.length, 20);
  assert.equal(grid.elevation.length, 20);

  for (let i = 0; i < grid.size; i++) {
    assert.equal(grid.walls[i], Wall.ALL);
    assert.equal(grid.terrain[i], 0);
    assert.equal(grid.elevation[i], 0);
  }
});

test('Grid - index, rowOf, and colOf mapping', () => {
  const grid = new Grid(5, 6);
  assert.equal(grid.index(0, 0), 0);
  assert.equal(grid.index(2, 3), 15);
  assert.equal(grid.index(4, 5), 29);
  assert.equal(grid.index(-1, 0), -1);
  assert.equal(grid.index(5, 0), -1);

  assert.equal(grid.rowOf(15), 2);
  assert.equal(grid.colOf(15), 3);
});

test('Grid - carve and build maintain symmetric wall bits (TASK 0.8)', () => {
  const grid = new Grid(4, 4, true);
  const a = grid.index(1, 1);
  const b = grid.index(1, 2); // East of a

  assert.equal(grid.hasWall(a, Wall.E), true);
  assert.equal(grid.hasWall(b, Wall.W), true);

  grid.carve(a, b);
  assert.equal(grid.hasWall(a, Wall.E), false);
  assert.equal(grid.hasWall(b, Wall.W), false);

  grid.build(a, b);
  assert.equal(grid.hasWall(a, Wall.E), true);
  assert.equal(grid.hasWall(b, Wall.W), true);
});

test('Grid - openNeighbors zero-allocation buffer returns correct count', () => {
  const grid = new Grid(3, 3, true);
  const center = grid.index(1, 1);
  const north = grid.index(0, 1);
  const east = grid.index(1, 2);

  grid.carve(center, north);
  grid.carve(center, east);

  const out = new Int32Array(4);
  const count = grid.openNeighbors(center, out);

  assert.equal(count, 2);
  assert.equal(out[0], north);
  assert.equal(out[1], east);
});

test('Grid - clone is completely independent', () => {
  const grid = new Grid(3, 3, true);
  grid.terrain[0] = 2;
  const clone = grid.clone();

  assert.equal(clone.terrain[0], 2);
  clone.terrain[0] = 0;
  assert.equal(grid.terrain[0], 2);
  assert.notEqual(clone.walls, grid.walls);
});

test('Grid - fingerprint is stable and sensitive to 1-bit change', () => {
  const g1 = new Grid(10, 10, true);
  const g2 = new Grid(10, 10, true);
  assert.equal(g1.fingerprint(), g2.fingerprint());

  g2.walls[0] ^= 1;
  assert.notEqual(g1.fingerprint(), g2.fingerprint());
});
