import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../../src/core/grid.js';
import { SeededRNG } from '../../src/structures/rng.js';
import { RecursiveBacktracker } from '../../src/core/generators/backtracker.js';
import {
  Solver,
  SolveResult,
  reconstructPath,
  DFS,
  BFS,
  AStar,
} from '../../src/core/solvers/index.js';
import { manhattanDistance, euclideanDistance } from '../../src/core/heuristics.js';
import { STEP_TYPES } from '../../src/core/step.js';
import { NO_WALLS } from '../../src/core/cell.js';

test('Heuristics - Manhattan and Euclidean calculations', () => {
  const p1 = { row: 1, col: 2 };
  const p2 = { row: 4, col: 6 };

  assert.equal(manhattanDistance(p1, p2), 3 + 4);
  assert.equal(manhattanDistance(p1, p1), 0);
  assert.equal(euclideanDistance(p1, p2), 5); // 3-4-5 triangle
});

test('reconstructPath - handles edge cases and disconnected graphs', () => {
  const grid = new Grid(3, 3);
  const start = grid.getCell(0, 0);
  const end = grid.getCell(2, 2);

  // Missing arguments
  assert.deepEqual(reconstructPath(null, start, end, grid), []);

  // Same start and end
  assert.deepEqual(reconstructPath([], start, start, grid), [start]);

  // Destination never reached (null in parent map)
  const emptyParent = new Array(9).fill(null);
  assert.deepEqual(reconstructPath(emptyParent, start, end, grid), []);

  // Broken chain that does not connect back to start
  const brokenParent = new Array(9).fill(null);
  brokenParent[grid.cellIndex(2, 2)] = grid.getCell(2, 1);
  brokenParent[grid.cellIndex(2, 1)] = grid.getCell(2, 0); // Stops at (2,0), never connects to (0,0)
  assert.deepEqual(reconstructPath(brokenParent, start, end, grid), []);
});

test('Solver - abstract base class enforcement', () => {
  assert.throws(() => new Solver('TestSolver'), TypeError);

  class DummySolver extends Solver {
    constructor() {
      super('Dummy');
    }
  }
  const dummy = new DummySolver();
  assert.equal(dummy.name, 'Dummy');
  assert.throws(() => dummy.solve(new Grid(2, 2)), Error);
});

test('Solvers - solve hand-crafted deterministic maze with known path', () => {
  // 3x3 grid with a single forced U-turn path:
  // (0,0) -> (0,1) -> (0,2) -> (1,2) -> (1,1) -> (1,0) -> (2,0) -> (2,1) -> (2,2)
  // Length = 9 cells
  const grid = new Grid(3, 3, { start: [0, 0], end: [2, 2] });

  // Row 0
  grid.removeWall(grid.getCell(0, 0), grid.getCell(0, 1));
  grid.removeWall(grid.getCell(0, 1), grid.getCell(0, 2));
  // Down to row 1
  grid.removeWall(grid.getCell(0, 2), grid.getCell(1, 2));
  // Row 1
  grid.removeWall(grid.getCell(1, 2), grid.getCell(1, 1));
  grid.removeWall(grid.getCell(1, 1), grid.getCell(1, 0));
  // Down to row 2
  grid.removeWall(grid.getCell(1, 0), grid.getCell(2, 0));
  // Row 2
  grid.removeWall(grid.getCell(2, 0), grid.getCell(2, 1));
  grid.removeWall(grid.getCell(2, 1), grid.getCell(2, 2));

  const solvers = [new DFS(), new BFS(), new AStar()];

  for (const solver of solvers) {
    const result = solver.solve(grid);
    assert.equal(result.found, true);
    assert.equal(result.pathLength, 9);
    assert.equal(result.cost, 9); // 9 unweighted cells * weight 1

    // Verify exact path coordinates
    const expectedCoords = [
      [0, 0], [0, 1], [0, 2],
      [1, 2], [1, 1], [1, 0],
      [2, 0], [2, 1], [2, 2],
    ];
    assert.deepEqual(
      result.path.map((c) => [c.row, c.col]),
      expectedCoords,
      `${solver.name} failed to follow forced path`
    );
  }
});

test('Solvers - cross-check on generated perfect maze: BFS length == A* length == DFS length', () => {
  const grid = new Grid(20, 20);
  const generator = new RecursiveBacktracker();
  generator.generate(grid, new SeededRNG(4242));

  const dfsResult = new DFS().solve(grid);
  const bfsResult = new BFS().solve(grid);
  const astarResult = new AStar().solve(grid);

  assert.equal(dfsResult.found, true);
  assert.equal(bfsResult.found, true);
  assert.equal(astarResult.found, true);

  // In a tree, the unique simple path must match exactly across all solvers
  assert.equal(
    bfsResult.pathLength,
    astarResult.pathLength,
    'BFS path length must equal A* path length'
  );
  assert.equal(
    dfsResult.pathLength,
    bfsResult.pathLength,
    'On a perfect maze (spanning tree), DFS path length must equal BFS optimal path length'
  );

  // Verify contiguous open passages along the path
  for (let i = 0; i < bfsResult.path.length - 1; i++) {
    const a = bfsResult.path[i];
    const b = bfsResult.path[i + 1];
    assert.equal(grid.hasWall(a, b), false, `Step from ${a} to ${b} must be open`);
  }
});

test('Solvers - optimality on maze with alternative paths: BFS length == A* length <= DFS length', () => {
  // Create a 4x4 grid with all walls removed (many paths)
  const grid = new Grid(4, 4, { start: [0, 0], end: [3, 3] });
  grid.resetWalls(NO_WALLS);

  const bfsResult = new BFS().solve(grid);
  const astarResult = new AStar().solve(grid);
  const dfsResult = new DFS().solve(grid);

  // On an open 4x4 grid, the shortest Manhattan distance path is 7 cells (3 down, 3 right + 1 start)
  assert.equal(bfsResult.pathLength, 7, 'BFS must find optimal 7-cell path');
  assert.equal(astarResult.pathLength, 7, 'A* must find optimal 7-cell path');
  assert.equal(bfsResult.cost, astarResult.cost);

  // DFS is not required to find the shortest path, but must find a valid path
  assert.ok(dfsResult.pathLength >= bfsResult.pathLength);
});

test('Solvers - disconnected maze returns empty path without throwing', () => {
  // Grid with all walls intact (no open passages)
  const grid = new Grid(5, 5, { start: [0, 0], end: [4, 4] });

  const solvers = [new DFS(), new BFS(), new AStar()];

  for (const solver of solvers) {
    const result = solver.solve(grid);
    assert.equal(result.found, false);
    assert.deepEqual(result.path, []);
    assert.equal(result.pathLength, 0);
    assert.equal(result.cost, 0);
    assert.ok(result.visitedCount >= 1, 'Start cell is visited');

    // Only visit steps, no path steps
    const pathSteps = result.steps.filter((s) => s.type === STEP_TYPES.PATH);
    assert.equal(pathSteps.length, 0);
  }
});

test('Solvers - grid immutability: solvers never mutate grid walls or weights', () => {
  const grid = new Grid(10, 10);
  new RecursiveBacktracker().generate(grid, new SeededRNG(999));

  const snapshotBefore = JSON.stringify(grid.toJSON());

  new DFS().solve(grid);
  new BFS().solve(grid);
  new AStar().solve(grid);

  const snapshotAfter = JSON.stringify(grid.toJSON());
  assert.equal(snapshotBefore, snapshotAfter, 'Grid state must remain identical after solver runs');
});

test('Solvers - step recording formats: visit steps precede path steps', () => {
  const grid = new Grid(5, 5);
  new RecursiveBacktracker().generate(grid, new SeededRNG(777));

  const result = new BFS().solve(grid);
  assert.ok(result.steps.length > 0);

  let inPathPhase = false;
  for (const step of result.steps) {
    if (step.type === STEP_TYPES.PATH) {
      inPathPhase = true;
    } else if (inPathPhase) {
      assert.fail(`Found non-PATH step (${step.type}) after PATH phase had started`);
    }
  }
});

test('Solvers - performance on 100x100 grid (10,000 cells) finishes in under 1 second', () => {
  const grid = new Grid(100, 100);
  new RecursiveBacktracker().generate(grid, new SeededRNG(5555));

  const solvers = [new DFS(), new BFS(), new AStar()];

  for (const solver of solvers) {
    const result = solver.solve(grid);
    assert.ok(
      result.timeMs < 1000,
      `${solver.name} took ${result.timeMs.toFixed(2)}ms, exceeding 1000ms threshold`
    );
    assert.equal(result.found, true);
  }
});
