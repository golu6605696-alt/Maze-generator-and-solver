import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid3D, Cell3D } from '../../src/core/grid3d.js';
import { Queue } from '../../src/structures/queue.js';

test('Grid3D - initializes dimensions, cells, and default endpoints', () => {
  const grid = new Grid3D(3, 4, 5);
  assert.equal(grid.levels, 3);
  assert.equal(grid.rows, 4);
  assert.equal(grid.cols, 5);
  assert.equal(grid.totalCells, 60);

  const start = grid.start;
  assert.equal(start.level, 0);
  assert.equal(start.row, 0);
  assert.equal(start.col, 0);

  const end = grid.end;
  assert.equal(end.level, 2);
  assert.equal(end.row, 3);
  assert.equal(end.col, 4);
});

test('Grid3D - validates bounds and dimensions', () => {
  assert.throws(() => new Grid3D(0, 5, 5), /RangeError/);
  assert.throws(() => new Grid3D(2, 0, 5), /RangeError/);
  assert.throws(() => new Grid3D(2, 5, 0), /RangeError/);

  const grid = new Grid3D(2, 3, 3);
  assert.equal(grid.getCell(-1, 0, 0), undefined);
  assert.equal(grid.getCell(2, 0, 0), undefined);
  assert.equal(grid.getCell(0, 3, 0), undefined);
  assert.equal(grid.getCell(0, 0, 3), undefined);
  assert.ok(grid.getCell(1, 2, 2) instanceof Cell3D);
});

test('Grid3D - connects vertical stairs between floors', () => {
  const grid = new Grid3D(2, 2, 2);
  const lower = grid.getCell(0, 1, 1);
  const upper = grid.getCell(1, 1, 1);

  assert.equal(lower.hasStairsUp, false);
  assert.equal(upper.hasStairsDown, false);

  grid.addStairs(0, 1, 1);

  assert.equal(lower.hasStairsUp, true);
  assert.equal(upper.hasStairsDown, true);

  const lowerNeighbors = grid.openNeighbors(lower);
  assert.ok(lowerNeighbors.some((n) => n.level === 1 && n.row === 1 && n.col === 1));

  const upperNeighbors = grid.openNeighbors(upper);
  assert.ok(upperNeighbors.some((n) => n.level === 0 && n.row === 1 && n.col === 1));
});

test('Grid3D - 3D BFS pathfinding across vertical floors', () => {
  // Construct a 2-level 2x2 grid
  const grid = new Grid3D(2, 2, 2);

  // Level 0: open passage from (0,0) to (0,1)
  const l0_00 = grid.getCell(0, 0, 0);
  const l0_01 = grid.getCell(0, 0, 1);
  l0_00.removeWall(2); // East
  l0_01.removeWall(8); // West

  // Add stairs at (0, 0, 1) leading up to (1, 0, 1)
  grid.addStairs(0, 0, 1);

  // Level 1: open passage from (1, 0, 1) down to (1, 1, 1)
  const l1_01 = grid.getCell(1, 0, 1);
  const l1_11 = grid.getCell(1, 1, 1);
  l1_01.removeWall(4); // South
  l1_11.removeWall(1); // North

  // BFS search from start (0, 0, 0) to end (1, 1, 1)
  const queue = new Queue();
  const visited = new Set();
  const parent = new Map();

  queue.enqueue(grid.start);
  visited.add(`${grid.start.level},${grid.start.row},${grid.start.col}`);

  let reached = false;
  while (!queue.isEmpty()) {
    const curr = queue.dequeue();
    if (curr.level === grid.end.level && curr.row === grid.end.row && curr.col === grid.end.col) {
      reached = true;
      break;
    }

    for (const neighbor of grid.openNeighbors(curr)) {
      const key = `${neighbor.level},${neighbor.row},${neighbor.col}`;
      if (!visited.has(key)) {
        visited.add(key);
        parent.set(key, curr);
        queue.enqueue(neighbor);
      }
    }
  }

  assert.equal(reached, true, 'BFS must successfully navigate through staircases to upper floor');
});
