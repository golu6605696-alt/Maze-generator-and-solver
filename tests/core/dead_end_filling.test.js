import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../../src/core/grid.js';
import { SeededRNG } from '../../src/structures/rng.js';
import { RecursiveBacktracker } from '../../src/core/generators/backtracker.js';
import { BFS } from '../../src/core/solvers/bfs.js';
import { DeadEndFilling } from '../../src/core/solvers/dead_end_filling.js';

test('DeadEndFilling - finds identical solution path to BFS on perfect maze', () => {
  const grid = new Grid(12, 12);
  new RecursiveBacktracker().generate(grid, new SeededRNG(98765));

  const defSolver = new DeadEndFilling();
  const bfsSolver = new BFS();

  const defResult = defSolver.solve(grid);
  const bfsResult = bfsSolver.solve(grid);

  assert.equal(defResult.found, true);
  assert.equal(bfsResult.found, true);
  assert.equal(defResult.pathLength, bfsResult.pathLength);

  // Compare coordinates
  for (let i = 0; i < defResult.path.length; i++) {
    assert.equal(defResult.path[i].row, bfsResult.path[i].row);
    assert.equal(defResult.path[i].col, bfsResult.path[i].col);
  }
});

test('DeadEndFilling - prunes dead ends and records visit steps', () => {
  const grid = new Grid(8, 8);
  new RecursiveBacktracker().generate(grid, new SeededRNG(44221));

  const solver = new DeadEndFilling();
  const result = solver.solve(grid);

  assert.ok(result.visitedCount > 0, 'Dead-end filling must prune non-solution branches');
  assert.ok(result.steps.length > 0);
  assert.equal(result.path[0].row, grid.start.row);
  assert.equal(result.path[result.path.length - 1].row, grid.end.row);
});

test('DeadEndFilling - returns empty path gracefully on completely blocked maze', () => {
  const grid = new Grid(5, 5); // Default grid has all walls intact (no open passages)
  const solver = new DeadEndFilling();
  const result = solver.solve(grid);

  assert.equal(result.found, false);
  assert.equal(result.pathLength, 0);
  assert.deepEqual(result.path, []);
});
