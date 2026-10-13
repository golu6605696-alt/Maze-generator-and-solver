import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Cell,
  WALL_N,
  WALL_E,
  WALL_S,
  WALL_W,
  ALL_WALLS,
  NO_WALLS,
  OPPOSITE_WALL,
  DIRECTION_DELTAS,
} from '../../src/core/cell.js';

test('Cell - initializes with coordinates, all walls, and default weight 1', () => {
  const cell = new Cell(2, 3);
  assert.equal(cell.row, 2);
  assert.equal(cell.col, 3);
  assert.equal(cell.walls, ALL_WALLS);
  assert.equal(cell.weight, 1);
  assert.equal(cell.hasWall(WALL_N), true);
  assert.equal(cell.hasWall(WALL_E), true);
  assert.equal(cell.hasWall(WALL_S), true);
  assert.equal(cell.hasWall(WALL_W), true);
});

test('Cell - rejects invalid coordinates', () => {
  assert.throws(() => new Cell(-1, 0), RangeError);
  assert.throws(() => new Cell(0, -1), RangeError);
  assert.throws(() => new Cell(1.5, 2), TypeError);
  assert.throws(() => new Cell('0', 0), TypeError);
});

test('Cell - wall manipulation methods', () => {
  const cell = new Cell(0, 0, ALL_WALLS);

  cell.removeWall(WALL_N);
  assert.equal(cell.hasWall(WALL_N), false);
  assert.equal(cell.hasWall(WALL_E), true);

  cell.removeWall(WALL_E);
  assert.equal(cell.hasWall(WALL_E), false);

  cell.addWall(WALL_N);
  assert.equal(cell.hasWall(WALL_N), true);
  assert.equal(cell.hasWall(WALL_E), false);
});

test('Cell - weight validation enforces positive integers (min 1)', () => {
  const cell = new Cell(0, 0, ALL_WALLS, 5);
  assert.equal(cell.weight, 5);

  cell.setWeight(10);
  assert.equal(cell.weight, 10);

  assert.throws(() => cell.setWeight(0), RangeError);
  assert.throws(() => cell.setWeight(-2), RangeError);
  assert.throws(() => cell.setWeight(1.5), RangeError);
  assert.throws(() => cell.setWeight('3'), RangeError);
});

test('Cell - opposite wall and direction deltas mapping', () => {
  assert.equal(OPPOSITE_WALL[WALL_N], WALL_S);
  assert.equal(OPPOSITE_WALL[WALL_S], WALL_N);
  assert.equal(OPPOSITE_WALL[WALL_E], WALL_W);
  assert.equal(OPPOSITE_WALL[WALL_W], WALL_E);

  assert.deepEqual(DIRECTION_DELTAS[WALL_N], { row: -1, col: 0 });
  assert.deepEqual(DIRECTION_DELTAS[WALL_E], { row: 0, col: 1 });
  assert.deepEqual(DIRECTION_DELTAS[WALL_S], { row: 1, col: 0 });
  assert.deepEqual(DIRECTION_DELTAS[WALL_W], { row: 0, col: -1 });
});

test('Cell - clone creates independent copy', () => {
  const original = new Cell(1, 4, WALL_N | WALL_S, 3);
  const cloned = original.clone();

  assert.equal(cloned.row, original.row);
  assert.equal(cloned.col, original.col);
  assert.equal(cloned.walls, original.walls);
  assert.equal(cloned.weight, original.weight);

  cloned.removeWall(WALL_N);
  cloned.setWeight(7);
  assert.equal(original.hasWall(WALL_N), true);
  assert.equal(original.weight, 3);
});
