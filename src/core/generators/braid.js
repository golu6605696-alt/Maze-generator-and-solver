/**
 * @file braid.js
 * Transforms a perfect maze into a braid maze by identifying dead ends (cells with
 * only one open passage) and selectively removing walls to introduce cycles and loops.
 *
 * Complexity: O(V) time and space, where V = rows * cols.
 */

import { SeededRNG } from '../../structures/rng.js';
import { Step } from '../step.js';

/**
 * Transforms the provided maze grid into a braid maze by removing dead ends.
 *
 * @param {import('../grid.js').Grid} grid - The maze grid to modify in-place
 * @param {number} [rate=0.5] - Fraction of dead ends to remove (0.0 to 1.0)
 * @param {import('../../structures/rng.js').SeededRNG} [rng]
 * @returns {Step[]} Array of Step animation records representing the carved loops
 */
export function braidMaze(grid, rate = 0.5, rng = new SeededRNG()) {
  const clampedRate = Math.max(0, Math.min(1, rate));
  if (clampedRate === 0) return [];

  const steps = [];
  const deadEnds = [];

  // 1. Identify all dead-end cells (cells with exactly one open passage)
  for (const cell of grid) {
    if (grid.openNeighbors(cell).length === 1) {
      deadEnds.push(cell);
    }
  }

  // Shuffle dead ends for unbiased selection
  rng.shuffle(deadEnds);

  const targetRemovals = Math.ceil(deadEnds.length * clampedRate);
  let removedCount = 0;

  for (let i = 0; i < deadEnds.length && removedCount < targetRemovals; i++) {
    const cell = deadEnds[i];

    // If previous removals already opened this cell, it may no longer be a dead end
    if (grid.openNeighbors(cell).length > 1) {
      continue;
    }

    // Find closed orthogonal neighbors within bounds
    const closedNeighbors = grid.neighbors(cell).filter((n) => grid.hasWall(cell, n));
    if (closedNeighbors.length === 0) continue;

    // Prefer connecting to another dead end to resolve two dead ends simultaneously
    const neighborDeadEnds = closedNeighbors.filter((n) => grid.openNeighbors(n).length === 1);
    const candidate = neighborDeadEnds.length > 0
      ? rng.choice(neighborDeadEnds)
      : rng.choice(closedNeighbors);

    grid.removeWall(cell, candidate);
    steps.push(Step.carve(candidate, { from: cell }));
    removedCount++;
  }

  return steps;
}
