import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../../src/core/grid.js';
import {
  WALL_N,
  WALL_E,
  WALL_S,
  WALL_W,
  ALL_WALLS,
} from '../../src/core/cell.js';

test('Grid - initializes with dimensions, cells, and default start/end', () => {
  const grid = new Grid(4, 5);

  assert.equal(grid.rows, 4);
  assert.equal(grid.cols, 5);
  assert.equal(grid.totalCells, 20);

  assert.equal(grid.start.row, 0);
  assert.equal(grid.start.col, 0);
  assert.equal(grid.end.row, 3);
  assert.equal(grid.end.col, 4);

  assert.deepEqual(grid.startCoords, [0, 0]);
  assert.deepEqual(grid.endCoords, [3, 4]);

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 5; c++) {
      const cell = grid.getCell(r, c);
      assert.equal(cell.row, r);
      assert.equal(cell.col, c);
      assert.equal(cell.walls, ALL_WALLS);
      assert.equal(cell.weight, 1);
    }
  }
});

test('Grid - validates dimensions and bounds', () => {
  assert.throws(() => new Grid(0, 5), RangeError);
  assert.throws(() => new Grid(5, -1), RangeError);
  assert.throws(() => new Grid(1, 1), RangeError); // Needs at least 2 cells for distinct start/end

  const grid = new Grid(3, 3);
  assert.equal(grid.inBounds(0, 0), true);
  assert.equal(grid.inBounds(2, 2), true);
  assert.equal(grid.inBounds(-1, 0), false);
  assert.equal(grid.inBounds(0, 3), false);
  assert.equal(grid.inBounds(3, 0), false);
  assert.equal(grid.getCell(3, 3), undefined);
});

test('Grid - start and end configuration and distinctness', () => {
  const grid = new Grid(3, 3, { start: [0, 1], end: [2, 1] });
  assert.deepEqual(grid.startCoords, [0, 1]);
  assert.deepEqual(grid.endCoords, [2, 1]);

  // Reject identical start and end
  assert.throws(() => new Grid(3, 3, { start: [1, 1], end: [1, 1] }), Error);

  // Reject out of bounds start or end
  assert.throws(() => new Grid(3, 3, { start: [5, 5], end: [0, 0] }), RangeError);

  // Setters
  grid.setStart([1, 0]);
  assert.deepEqual(grid.startCoords, [1, 0]);
  assert.throws(() => grid.setStart([2, 1]), Error); // clashes with end
  assert.throws(() => grid.setStart([10, 0]), RangeError);

  grid.setEnd([2, 2]);
  assert.deepEqual(grid.endCoords, [2, 2]);
  assert.throws(() => grid.setEnd([1, 0]), Error); // clashes with start
});

test('Grid - 1D index mapping round-trip', () => {
  const grid = new Grid(4, 6);
  assert.equal(grid.cellIndex(0, 0), 0);
  assert.equal(grid.cellIndex(1, 2), 8);
  assert.equal(grid.cellIndex(3, 5), 23);

  const cell = grid.cellFromIndex(8);
  assert.equal(cell.row, 1);
  assert.equal(cell.col, 2);

  assert.equal(grid.cellFromIndex(-1), undefined);
  assert.equal(grid.cellFromIndex(24), undefined);
});

test('Grid - neighbors returns orthogonal adjacent cells only', () => {
  const grid = new Grid(3, 3);

  // Top-left corner (0,0) -> East and South
  const cornerNeighbors = grid.neighbors(grid.getCell(0, 0));
  assert.equal(cornerNeighbors.length, 2);
  assert.deepEqual(
    cornerNeighbors.map((c) => [c.row, c.col]),
    [[0, 1], [1, 0]]
  );

  // Top edge (0,1) -> East, South, West
  const edgeNeighbors = grid.neighbors(grid.getCell(0, 1));
  assert.equal(edgeNeighbors.length, 3);
  assert.deepEqual(
    edgeNeighbors.map((c) => [c.row, c.col]),
    [[0, 2], [1, 1], [0, 0]]
  );

  // Center (1,1) -> North, East, South, West
  const centerNeighbors = grid.neighbors(grid.getCell(1, 1));
  assert.equal(centerNeighbors.length, 4);
  assert.deepEqual(
    centerNeighbors.map((c) => [c.row, c.col]),
    [[0, 1], [1, 2], [2, 1], [1, 0]]
  );
});

test('Grid - getDirection identifies orthogonal directions and rejects non-adjacent', () => {
  const grid = new Grid(3, 3);
  const center = grid.getCell(1, 1);
  const north = grid.getCell(0, 1);
  const east = grid.getCell(1, 2);
  const south = grid.getCell(2, 1);
  const west = grid.getCell(1, 0);
  const diagonal = grid.getCell(0, 0);

  assert.equal(grid.getDirection(center, north), WALL_N);
  assert.equal(grid.getDirection(center, east), WALL_E);
  assert.equal(grid.getDirection(center, south), WALL_S);
  assert.equal(grid.getDirection(center, west), WALL_W);
  assert.equal(grid.getDirection(center, diagonal), null);
});

test('Grid - removeWall and addWall maintain bidirectional wall consistency on both cells', () => {
  const grid = new Grid(3, 3);
  const a = grid.getCell(1, 1);
  const b = grid.getCell(1, 2); // b is East of a

  // Initially, both have wall between them
  assert.equal(a.hasWall(WALL_E), true);
  assert.equal(b.hasWall(WALL_W), true);
  assert.equal(grid.hasWall(a, b), true);

  // Remove wall between a and b
  grid.removeWall(a, b);
  assert.equal(a.hasWall(WALL_E), false, 'East wall on cell A must be removed');
  assert.equal(b.hasWall(WALL_W), false, 'West wall on cell B must be removed');
  assert.equal(grid.hasWall(a, b), false);

  // Add wall back
  grid.addWall(a, b);
  assert.equal(a.hasWall(WALL_E), true, 'East wall on cell A must be restored');
  assert.equal(b.hasWall(WALL_W), true, 'West wall on cell B must be restored');
  assert.equal(grid.hasWall(a, b), true);

  // Symmetrical operation via vertical neighbors (North/South)
  const c = grid.getCell(0, 1); // c is North of a
  grid.removeWall(c, a);
  assert.equal(c.hasWall(WALL_S), false, 'South wall on cell C must be removed');
  assert.equal(a.hasWall(WALL_N), false, 'North wall on cell A must be removed');

  // Rejects non-adjacent cells
  const far = grid.getCell(0, 2);
  assert.throws(() => grid.removeWall(a, far), Error);
  assert.throws(() => grid.addWall(a, far), Error);
  assert.throws(() => grid.hasWall(a, far), Error);
});

test('Grid - openNeighbors reflects open passages', () => {
  const grid = new Grid(3, 3);
  const center = grid.getCell(1, 1);

  // Initially all walls exist, so no open neighbors
  assert.deepEqual(grid.openNeighbors(center), []);

  // Open wall to East
  const east = grid.getCell(1, 2);
  grid.removeWall(center, east);
  assert.deepEqual(grid.openNeighbors(center), [east]);
  assert.deepEqual(grid.openNeighbors(east), [center]);

  // Open wall to North
  const north = grid.getCell(0, 1);
  grid.removeWall(center, north);
  assert.deepEqual(grid.openNeighbors(center), [north, east]);
});

test('Grid - resetWalls updates all cells', () => {
  const grid = new Grid(2, 2);
  grid.removeWall(grid.getCell(0, 0), grid.getCell(0, 1));
  assert.equal(grid.getCell(0, 0).hasWall(WALL_E), false);

  grid.resetWalls(ALL_WALLS);
  for (const cell of grid) {
    assert.equal(cell.walls, ALL_WALLS);
  }
});

test('Grid - iterable iterates all cells in row-major order', () => {
  const grid = new Grid(2, 3);
  const visited = [];
  for (const cell of grid) {
    visited.push([cell.row, cell.col]);
  }

  assert.deepEqual(visited, [
    [0, 0], [0, 1], [0, 2],
    [1, 0], [1, 1], [1, 2],
  ]);
});

test('Grid - clone produces independent deep copy', () => {
  const grid = new Grid(2, 2, { start: [0, 0], end: [1, 1] });
  grid.removeWall(grid.getCell(0, 0), grid.getCell(0, 1));
  grid.getCell(0, 0).setWeight(5);

  const clone = grid.clone();
  assert.equal(clone.rows, 2);
  assert.equal(clone.cols, 2);
  assert.deepEqual(clone.startCoords, [0, 0]);
  assert.deepEqual(clone.endCoords, [1, 1]);
  assert.equal(clone.getCell(0, 0).hasWall(WALL_E), false);
  assert.equal(clone.getCell(0, 0).weight, 5);

  // Mutating original does not affect clone
  grid.getCell(0, 0).setWeight(10);
  grid.addWall(grid.getCell(0, 0), grid.getCell(0, 1));
  assert.equal(clone.getCell(0, 0).weight, 5);
  assert.equal(clone.getCell(0, 0).hasWall(WALL_E), false);
});

test('Grid - serialization toJSON and fromJSON round-trip', () => {
  const grid = new Grid(2, 2, { start: [0, 0], end: [1, 1] });
  grid.removeWall(grid.getCell(0, 0), grid.getCell(1, 0));
  grid.getCell(1, 0).setWeight(3);

  const json = grid.toJSON(42);
  assert.equal(json.version, 1);
  assert.equal(json.rows, 2);
  assert.equal(json.cols, 2);
  assert.equal(json.seed, 42);
  assert.deepEqual(json.start, [0, 0]);
  assert.deepEqual(json.end, [1, 1]);
  assert.equal(json.cells.length, 4);

  const restored = Grid.fromJSON(json);
  assert.equal(restored.rows, 2);
  assert.equal(restored.cols, 2);
  assert.deepEqual(restored.startCoords, [0, 0]);
  assert.deepEqual(restored.endCoords, [1, 1]);
  assert.equal(restored.getCell(0, 0).hasWall(WALL_S), false);
  assert.equal(restored.getCell(1, 0).hasWall(WALL_N), false);
  assert.equal(restored.getCell(1, 0).weight, 3);
});
