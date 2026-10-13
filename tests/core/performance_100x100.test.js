/**
 * @file performance_100x100.test.js
 * Comprehensive automated 100x100 (10,000 cell) performance and correctness test suite.
 * Validates PRD Section 7 Non-Functional Requirement:
 * "generate and solve a 100x100 maze in under 1 second (excluding animation)."
 *
 * Checks:
 * 1. All 5 generators on 100x100: < 1000ms, V-1 passages, 100% connectivity.
 * 2. All 6 solvers on 100x100: < 1000ms, path found, contiguous valid passage.
 * 3. Optimality invariants: BFS length == A* length == Dijkstra length.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../../src/core/grid.js';
import { SeededRNG } from '../../src/structures/rng.js';
import {
  RecursiveBacktracker,
  RandomizedPrims,
  RandomizedKruskals,
  RecursiveDivision,
  Wilsons,
} from '../../src/core/generators/index.js';
import {
  BFS,
  AStar,
  DFS,
  Dijkstra,
  WallFollower,
  DeadEndFilling,
} from '../../src/core/solvers/index.js';
import { WALL_E, WALL_S } from '../../src/core/cell.js';

/**
 * Counts total open passages (edges) in the grid.
 * @param {Grid} grid
 * @returns {number}
 */
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

/**
 * Counts reachable cells via BFS traversal.
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

/**
 * Validates that every step along the path is an open orthogonal passage.
 * @param {Grid} grid
 * @param {Array} path
 */
function assertPathValidity(grid, path) {
  assert.ok(path.length >= 2, 'Path must connect start and end');
  for (let i = 0; i < path.length - 1; i++) {
    const curr = path[i];
    const next = path[i + 1];
    assert.equal(
      grid.hasWall(curr, next),
      false,
      `Wall found between path steps (${curr.row},${curr.col}) and (${next.row},${next.col})`
    );
  }
}

test('100x100 Performance & Correctness: Generators', async (t) => {
  const generators = [
    { name: 'Recursive Backtracker', instance: new RecursiveBacktracker() },
    { name: "Randomized Prim's", instance: new RandomizedPrims() },
    { name: "Randomized Kruskal's", instance: new RandomizedKruskals() },
    { name: 'Recursive Division', instance: new RecursiveDivision() },
    { name: "Wilson's (Uniform Spanning Tree)", instance: new Wilsons() },
  ];

  for (const { name, instance } of generators) {
    await t.test(`${name} generates 100x100 in < 1000ms with spanning tree properties`, () => {
      const grid = new Grid(100, 100);
      const rng = new SeededRNG(98765);

      const startTime = performance.now();
      const steps = instance.generate(grid, rng);
      const elapsedMs = performance.now() - startTime;

      // PRD Metric: under 1 second (1000ms)
      assert.ok(
        elapsedMs < 1000,
        `${name} took ${elapsedMs.toFixed(2)}ms, exceeding the 1000ms PRD budget`
      );

      // Verify V - 1 passages (9,999 open passages for 10,000 cells)
      const passages = countOpenPassages(grid);
      assert.equal(
        passages,
        10000 - 1,
        `${name} produced ${passages} passages; expected exactly 9999 for 10,000 cells`
      );

      // Verify all 10,000 cells are connected
      const reachable = countReachableCells(grid);
      assert.equal(
        reachable,
        10000,
        `${name} left unreachable subgraphs: only ${reachable} of 10,000 reachable`
      );

      assert.ok(steps.length > 0, 'Must record animation steps');
    });
  }
});

test('100x100 Performance & Correctness: Solvers', async (t) => {
  // Generate a standard benchmark 100x100 maze using Recursive Backtracker
  const grid = new Grid(100, 100);
  new RecursiveBacktracker().generate(grid, new SeededRNG(54321));

  const solvers = [
    { name: 'BFS (Breadth-First Search)', instance: new BFS(), optimal: true },
    { name: 'A* (Manhattan Heuristic)', instance: new AStar(), optimal: true },
    { name: 'Dijkstra (Weighted Shortest Path)', instance: new Dijkstra(), optimal: true },
    { name: 'DFS (Depth-First Search)', instance: new DFS(), optimal: false },
    { name: 'Wall Follower (Left-Hand Rule)', instance: new WallFollower(), optimal: false },
    { name: 'Dead-End Filling', instance: new DeadEndFilling(), optimal: true },
  ];

  let optimalLength = null;

  for (const { name, instance, optimal } of solvers) {
    await t.test(`${name} solves 100x100 in < 1000ms`, () => {
      const result = instance.solve(grid);

      // PRD Metric: under 1 second
      assert.ok(
        result.timeMs < 1000,
        `${name} took ${result.timeMs.toFixed(2)}ms, exceeding 1000ms budget`
      );

      assert.equal(result.found, true, `${name} failed to find path on connected 100x100 maze`);
      assertPathValidity(grid, result.path);

      if (optimal) {
        if (optimalLength === null) {
          optimalLength = result.pathLength;
        } else {
          // BFS, A*, Dijkstra, and Dead-End Filling on a perfect maze must yield identical optimal length
          assert.equal(
            result.pathLength,
            optimalLength,
            `${name} path length (${result.pathLength}) does not match optimal length (${optimalLength})`
          );
        }
      }
    });
  }
});
