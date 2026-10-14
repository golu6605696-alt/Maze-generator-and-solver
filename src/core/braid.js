/**
 * @file braid.js
 * Braid modification for mazes: selectively removes dead ends to introduce cycles.
 * Defined in RULES.md section 3.4.
 */

import { DIRS } from './constants.js';

/**
 * Braids a maze by removing a specified percentage of dead ends.
 * @param {import('./grid.js').Grid} grid
 * @param {number} pct Percentage of dead ends to remove (0..100).
 * @param {import('../structures/rng.js').Rng} rng
 * @returns {{ removed: number, deadEndsBefore: number, achievedPct: number }}
 */
export function braid(grid, pct, rng) {
  if (pct <= 0) {
    const neighborBuf = new Int32Array(4);
    let deadEnds = 0;
    for (let i = 0; i < grid.size; i++) {
      if (grid.openNeighbors(i, neighborBuf) === 1) deadEnds++;
    }
    return { removed: 0, deadEndsBefore: deadEnds, achievedPct: 0 };
  }

  const braidRng = rng.fork('braid');
  const neighborBuf = new Int32Array(4);
  const deadEndList = [];

  // 1. Identify all dead ends (cells with openNeighbors === 1)
  for (let i = 0; i < grid.size; i++) {
    if (grid.openNeighbors(i, neighborBuf) === 1) {
      deadEndList.push(i);
    }
  }

  const D0 = deadEndList.length;
  if (D0 === 0) {
    return { removed: 0, deadEndsBefore: 0, achievedPct: 0 };
  }

  const target = Math.round((D0 * pct) / 100);
  let removed = 0;

  // Shuffle candidate dead ends
  braidRng.shuffle(deadEndList);

  for (let idx = 0; idx < deadEndList.length && removed < target; idx++) {
    const cell = deadEndList[idx];
    // Check if cell is still a dead end
    if (grid.openNeighbors(cell, neighborBuf) !== 1) {
      continue;
    }

    // Find closed neighbors
    const closedNeighbors = [];
    const closedDeadEndNeighbors = [];

    for (let k = 0; k < 4; k++) {
      const dir = DIRS[k];
      if (grid.hasWall(cell, dir)) {
        const nb = grid.neighbor(cell, dir);
        if (nb !== -1) {
          closedNeighbors.push(nb);
          if (grid.openNeighbors(nb, neighborBuf) === 1) {
            closedDeadEndNeighbors.push(nb);
          }
        }
      }
    }

    if (closedNeighbors.length === 0) continue;

    // Prefer neighbor that is also a dead end
    let chosen;
    let removesTwo = false;
    if (closedDeadEndNeighbors.length > 0) {
      chosen = closedDeadEndNeighbors[braidRng.int(closedDeadEndNeighbors.length)];
      removesTwo = true;
    } else {
      chosen = closedNeighbors[braidRng.int(closedNeighbors.length)];
    }

    grid.carve(cell, chosen);
    removed += removesTwo ? 2 : 1;
  }

  const achievedPct = D0 > 0 ? Math.round((removed * 100) / D0) : 0;
  return {
    removed,
    deadEndsBefore: D0,
    achievedPct,
  };
}
