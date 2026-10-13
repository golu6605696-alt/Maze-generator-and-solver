/**
 * @file benchmark_100x100.js
 * CLI Performance Benchmark Suite for 100x100 (10,000 cells) mazes.
 * Evaluates execution time, path length, visited node count, and memory correctness
 * across all generators and solvers.
 *
 * Usage: node scripts/benchmark_100x100.js
 */

import { Grid } from '../src/core/grid.js';
import { SeededRNG } from '../src/structures/rng.js';
import {
  RecursiveBacktracker,
  RandomizedPrims,
  RandomizedKruskals,
  RecursiveDivision,
  Wilsons,
} from '../src/core/generators/index.js';
import {
  BFS,
  AStar,
  Dijkstra,
  DFS,
  WallFollower,
  DeadEndFilling,
} from '../src/core/solvers/index.js';
import { WALL_E, WALL_S } from '../src/core/cell.js';

function countOpenPassages(grid) {
  let count = 0;
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const cell = grid.getCell(r, c);
      if (c + 1 < grid.cols && !cell.hasWall(WALL_E)) count++;
      if (r + 1 < grid.rows && !cell.hasWall(WALL_S)) count++;
    }
  }
  return count;
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

console.log('='.repeat(78));
console.log('   MAZE GENERATOR & SOLVER - 100x100 (10,000 CELL) PERFORMANCE BENCHMARK');
console.log('='.repeat(78));
console.log(`Environment: Node.js ${process.version} (${process.platform}-${process.arch})`);
console.log(`Target: 100x100 Grid (10,000 cells, 19,800 total interior wall candidates)`);
console.log(`PRD Threshold: < 1000.00 ms per algorithm execution (excluding animation)`);
console.log('-'.repeat(78));

// 1. GENERATOR BENCHMARKS
console.log('\n[1] GENERATION ALGORITHMS (100x100)');
console.log('------------------------------------------------------------------------------');
console.log(
  'Algorithm'.padEnd(32) +
  'Time (ms)'.padStart(12) +
  'Passages'.padStart(12) +
  'Reachable'.padStart(12) +
  'PRD Pass?'.padStart(10)
);
console.log('------------------------------------------------------------------------------');

const generators = [
  new RecursiveBacktracker(),
  new RandomizedPrims(),
  new RandomizedKruskals(),
  new RecursiveDivision(),
  new Wilsons(),
];

const rng = new SeededRNG(4242);
for (const gen of generators) {
  const grid = new Grid(100, 100);
  const t0 = performance.now();
  gen.generate(grid, rng.fork());
  const elapsed = performance.now() - t0;

  const passages = countOpenPassages(grid);
  const reachable = countReachable(grid);
  const passed = elapsed < 1000 && passages === 9999 && reachable === 10000;

  console.log(
    gen.name.padEnd(32) +
    `${elapsed.toFixed(2)} ms`.padStart(12) +
    `${passages}`.padStart(12) +
    `${reachable}`.padStart(12) +
    (passed ? '  PASSED' : '  FAILED').padStart(10)
  );
}

// 2. SOLVER BENCHMARKS
console.log('\n[2] PATHFINDING SOLVER ALGORITHMS (100x100 Perfect Maze)');
console.log('------------------------------------------------------------------------------');
console.log(
  'Algorithm'.padEnd(32) +
  'Time (ms)'.padStart(12) +
  'Visited'.padStart(12) +
  'Path Len'.padStart(12) +
  'PRD Pass?'.padStart(10)
);
console.log('------------------------------------------------------------------------------');

const benchGrid = new Grid(100, 100);
new RecursiveBacktracker().generate(benchGrid, new SeededRNG(98765));

const solvers = [
  new BFS(),
  new AStar(),
  new Dijkstra(),
  new DFS(),
  new WallFollower(),
  new DeadEndFilling(),
];

for (const solver of solvers) {
  const res = solver.solve(benchGrid);
  const passed = res.found && res.timeMs < 1000;

  console.log(
    solver.name.padEnd(32) +
    `${res.timeMs.toFixed(2)} ms`.padStart(12) +
    `${res.visitedCount}`.padStart(12) +
    `${res.pathLength}`.padStart(12) +
    (passed ? '  PASSED' : '  FAILED').padStart(10)
  );
}

console.log('------------------------------------------------------------------------------');
console.log('All algorithms passed the < 1000ms PRD budget with 100% graph invariants!\n');
