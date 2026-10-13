import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../../src/core/grid.js';
import { SeededRNG } from '../../src/structures/rng.js';
import { Wilsons } from '../../src/core/generators/wilson.js';
import { WALL_E, WALL_S } from '../../src/core/cell.js';

function countOpenPassages(grid) {
  let passages = 0;
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const cell = grid.getCell(r, c);
      if (c + 1 < grid.cols && !cell.hasWall(WALL_E)) passages++;
      if (r + 1 < grid.rows && !cell.hasWall(WALL_S)) passages++;
    }
  }
  return passages;
}

function countReachable(grid) {
  const visited = new Uint8Array(grid.totalCells);
  const queue = [grid.start];
  visited[grid.cellIndex(grid.start.row, grid.start.col)] = 1;
  let count = 0;

  while (queue.length > 0) {
    const current = queue.shift();
    count++;
    for (const neighbor of grid.openNeighbors(current)) {
      const idx = grid.cellIndex(neighbor.row, neighbor.col);
      if (visited[idx] === 0) {
        visited[idx] = 1;
        queue.push(neighbor);
      }
    }
  }
  return count;
}

test("Wilsons - generates an unbiased uniform spanning tree (V-1 passages, fully connected)", () => {
  const grid = new Grid(10, 10);
  const wilson = new Wilsons();
  const steps = wilson.generate(grid, new SeededRNG(9999));

  assert.ok(steps.length > 0);
  assert.equal(countOpenPassages(grid), grid.totalCells - 1);
  assert.equal(countReachable(grid), grid.totalCells);
});

test("Wilsons - seed reproducibility", () => {
  const gridA = new Grid(8, 8);
  const gridB = new Grid(8, 8);
  const wilson = new Wilsons();

  wilson.generate(gridA, new SeededRNG(1234));
  wilson.generate(gridB, new SeededRNG(1234));

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      assert.equal(gridA.getCell(r, c).walls, gridB.getCell(r, c).walls);
    }
  }
});
