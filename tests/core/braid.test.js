import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../../src/core/grid.js';
import { SeededRNG } from '../../src/structures/rng.js';
import { RecursiveBacktracker } from '../../src/core/generators/backtracker.js';
import { braidMaze } from '../../src/core/generators/braid.js';

test('braidMaze - reduces dead ends and maintains wall consistency', () => {
  const grid = new Grid(10, 10);
  new RecursiveBacktracker().generate(grid, new SeededRNG(123));

  // Count dead ends before braid
  let deadEndsBefore = 0;
  for (const cell of grid) {
    if (grid.openNeighbors(cell).length === 1) {
      deadEndsBefore++;
    }
  }
  assert.ok(deadEndsBefore > 0, 'Initial perfect maze must have dead ends');

  // Apply full braid mode (rate 1.0)
  const steps = braidMaze(grid, 1.0, new SeededRNG(456));
  assert.ok(steps.length > 0, 'Must carve passages to remove dead ends');

  // Count dead ends after braid
  let deadEndsAfter = 0;
  for (const cell of grid) {
    if (grid.openNeighbors(cell).length === 1) {
      deadEndsAfter++;
    }
  }

  assert.ok(
    deadEndsAfter < deadEndsBefore,
    `Dead ends should decrease (before: ${deadEndsBefore}, after: ${deadEndsAfter})`
  );

  // Verify reciprocal wall consistency across all cells
  for (const cell of grid) {
    const openNeighbors = grid.openNeighbors(cell);
    for (const neighbor of openNeighbors) {
      assert.equal(
        grid.hasWall(cell, neighbor),
        false,
        `Reciprocal wall consistency violation between ${cell} and ${neighbor}`
      );
    }
  }
});
