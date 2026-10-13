import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../../src/core/grid.js';
import { SeededRNG } from '../../src/structures/rng.js';
import {
  Generator,
  RecursiveBacktracker,
  RandomizedPrims,
  RandomizedKruskals,
} from '../../src/core/generators/index.js';
import { WALL_E, WALL_S } from '../../src/core/cell.js';
import { STEP_TYPES } from '../../src/core/step.js';

/**
 * Counts total undirected open passages (edges) in the grid.
 *
 * @param {Grid} grid
 * @returns {number}
 */
function countOpenPassages(grid) {
  let passages = 0;
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const cell = grid.getCell(r, c);
      // Count East passage if open
      if (c + 1 < grid.cols && !cell.hasWall(WALL_E)) {
        passages++;
      }
      // Count South passage if open
      if (r + 1 < grid.rows && !cell.hasWall(WALL_S)) {
        passages++;
      }
    }
  }
  return passages;
}

/**
 * Counts reachable cells from start using BFS along open passages.
 *
 * @param {Grid} grid
 * @returns {number}
 */
function countReachableCells(grid) {
  const visited = new Uint8Array(grid.totalCells);
  const queue = [grid.start];
  visited[grid.cellIndex(grid.start.row, grid.start.col)] = 1;
  let count = 0;

  while (queue.length > 0) {
    const current = queue.shift();
    count++;

    const openNeighbors = grid.openNeighbors(current);
    for (const neighbor of openNeighbors) {
      const idx = grid.cellIndex(neighbor.row, neighbor.col);
      if (visited[idx] === 0) {
        visited[idx] = 1;
        queue.push(neighbor);
      }
    }
  }

  return count;
}

test('Generator - abstract base class enforcement', () => {
  assert.throws(() => new Generator('Base'), TypeError);

  class DummyGenerator extends Generator {
    constructor() {
      super('Dummy');
    }
  }
  const dummy = new DummyGenerator();
  assert.equal(dummy.name, 'Dummy');
  assert.throws(() => dummy.generate(new Grid(2, 2)), Error);
});

const GENERATORS = [
  { name: 'Recursive Backtracker', instance: new RecursiveBacktracker() },
  { name: "Randomized Prim's", instance: new RandomizedPrims() },
  { name: "Randomized Kruskal's", instance: new RandomizedKruskals() },
];

for (const { name, instance } of GENERATORS) {
  test(`${name} - generates a perfect maze (exactly V-1 passages, fully connected, no loops)`, () => {
    const rows = 12;
    const cols = 15;
    const grid = new Grid(rows, cols);
    const totalCells = grid.totalCells;

    const rng = new SeededRNG(12345);
    const steps = instance.generate(grid, rng);

    assert.ok(steps.length > 0, 'Steps must be generated');

    // 1. Spanning tree property: Exactly V - 1 passages
    const passages = countOpenPassages(grid);
    assert.equal(
      passages,
      totalCells - 1,
      `Expected exactly ${totalCells - 1} open passages for a spanning tree, found ${passages}`
    );

    // 2. Connectivity property: All cells must be reachable
    const reachable = countReachableCells(grid);
    assert.equal(
      reachable,
      totalCells,
      `All ${totalCells} cells must be reachable from start, found ${reachable}`
    );
  });

  test(`${name} - seed reproducibility: identical seeds produce identical mazes`, () => {
    const rows = 10;
    const cols = 10;
    const seed = 98765;

    const gridA = new Grid(rows, cols);
    const stepsA = instance.generate(gridA, new SeededRNG(seed));

    const gridB = new Grid(rows, cols);
    const stepsB = instance.generate(gridB, new SeededRNG(seed));

    // Both grids must have identical walls in every cell
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        assert.equal(
          gridA.getCell(r, c).walls,
          gridB.getCell(r, c).walls,
          `Mismatch at cell (${r}, ${c}) for identical seed ${seed}`
        );
      }
    }

    assert.equal(stepsA.length, stepsB.length);

    // Different seed produces different maze
    const gridC = new Grid(rows, cols);
    instance.generate(gridC, new SeededRNG(11111));
    let hasDifference = false;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (gridA.getCell(r, c).walls !== gridC.getCell(r, c).walls) {
          hasDifference = true;
          break;
        }
      }
      if (hasDifference) break;
    }
    assert.ok(hasDifference, 'Different seeds should produce different mazes');
  });

  test(`${name} - emits valid animation step records`, () => {
    const grid = new Grid(5, 5);
    const steps = instance.generate(grid, new SeededRNG(42));

    const validTypes = new Set(Object.values(STEP_TYPES));
    for (const step of steps) {
      assert.ok(validTypes.has(step.type), `Step type ${step.type} must be valid`);
      assert.ok(grid.inBounds(step.cell.row, step.cell.col), 'Step cell must be in bounds');
    }
  });

  test(`${name} - performance on 100x100 grid (10,000 cells) finishes in under 1 second`, () => {
    const grid = new Grid(100, 100);
    const startTime = performance.now();
    instance.generate(grid, new SeededRNG(42));
    const durationMs = performance.now() - startTime;

    assert.ok(
      durationMs < 1000,
      `${name} took ${durationMs.toFixed(2)}ms, exceeding 1000ms threshold`
    );

    // Spanning tree check on 100x100
    assert.equal(countOpenPassages(grid), 10000 - 1);
  });
}
