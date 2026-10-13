import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../../src/core/grid.js';
import { SeededRNG } from '../../src/structures/rng.js';
import { RecursiveBacktracker } from '../../src/core/generators/backtracker.js';
import { MazeAnalyzer } from '../../src/core/analyzer.js';

test('MazeAnalyzer - validates input argument', () => {
  assert.throws(() => {
    MazeAnalyzer.analyze(null);
  }, /TypeError/);
});

test('MazeAnalyzer - computes correct topological metrics on simple path', () => {
  // Create a 1x4 horizontal open corridor
  const grid = new Grid(1, 4);
  grid.removeWall(grid.getCell(0, 0), grid.getCell(0, 1));
  grid.removeWall(grid.getCell(0, 1), grid.getCell(0, 2));
  grid.removeWall(grid.getCell(0, 2), grid.getCell(0, 3));

  const stats = MazeAnalyzer.analyze(grid);
  assert.equal(stats.totalCells, 4);
  assert.equal(stats.deadEnds, 2); // endpoints (0,0) and (0,3)
  assert.equal(stats.corridors, 2); // interior cells (0,1) and (0,2)
  assert.equal(stats.junctions, 0);
  assert.equal(stats.solutionLength, 4);
  assert.equal(stats.longestPath, 4);
  assert.ok(stats.difficultyScore >= 1 && stats.difficultyScore <= 100);
});

test('MazeAnalyzer - evaluates generated maze metrics consistently', () => {
  const grid = new Grid(15, 15);
  new RecursiveBacktracker().generate(grid, new SeededRNG(1337));

  const stats = MazeAnalyzer.analyze(grid);

  assert.equal(stats.totalCells, 225);
  assert.ok(stats.deadEnds > 10, 'Generated maze must have dead ends');
  assert.ok(stats.junctions > 5, 'Generated maze must have junctions');
  assert.ok(stats.solutionLength > 1, 'Solution length must be positive');
  assert.ok(stats.longestPath >= stats.solutionLength, 'Longest path in maze must be >= solution length');
  assert.ok(stats.riverFactor >= 1.0, 'River factor must be at least 1.0');
  assert.ok(stats.difficultyScore >= 1 && stats.difficultyScore <= 100);
});
