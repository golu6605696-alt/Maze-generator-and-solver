import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../../src/core/grid.js';
import { MazeIO } from '../../src/app/maze_io.js';

test('MazeIO - serialize and deserialize round-trip matches original', () => {
  const grid = new Grid(4, 4, { start: [0, 0], end: [3, 3] });
  grid.removeWall(grid.getCell(0, 0), grid.getCell(0, 1));
  grid.getCell(0, 1).setWeight(5);

  const json = MazeIO.serialize(grid, 777);
  const restored = MazeIO.deserialize(json);

  assert.equal(restored.rows, 4);
  assert.equal(restored.cols, 4);
  assert.deepEqual(restored.startCoords, [0, 0]);
  assert.deepEqual(restored.endCoords, [3, 3]);
  assert.equal(restored.getCell(0, 0).hasWall(2), false); // East wall removed
  assert.equal(restored.getCell(0, 1).hasWall(8), false); // West wall removed
  assert.equal(restored.getCell(0, 1).weight, 5);
});

test('MazeIO - rejects invalid format version or corrupted payload', () => {
  assert.throws(() => MazeIO.deserialize(null), TypeError);
  assert.throws(() => MazeIO.deserialize({ version: 2, rows: 2, cols: 2, cells: [] }), Error);
  assert.throws(() => MazeIO.deserialize({ version: 1, rows: 2, cols: 2, cells: [{ w: 1, wt: 1 }] }), RangeError);
});
