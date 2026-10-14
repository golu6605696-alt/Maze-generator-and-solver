/**
 * @file relics.js
 * Relic placement on dead-end cells off the optimal path.
 * Defined in RULES.md section 1.5.
 */

import { RelicKind } from './constants.js';

/**
 * Places relics on dead ends that are not on the reference optimal path.
 * @param {import('./grid.js').Grid} grid
 * @param {Set<number>} optimalPathSet Set of cell indices on the reference optimal path.
 * @param {import('../structures/rng.js').Rng} rng
 * @returns {Array<{ cell: number, kind: string }>}
 */
export function placeRelics(grid, optimalPathSet, rng) {
  const relicRng = rng.fork('relics');
  const V = grid.size;
  const targetCount = Math.min(24, Math.max(3, Math.round(V / 120)));

  const neighborBuf = new Int32Array(4);
  const candidates = [];

  for (let i = 0; i < V; i++) {
    // Only dead ends
    if (grid.openNeighbors(i, neighborBuf) === 1) {
      // Must NOT be on the optimal path, and not start or end
      if (!optimalPathSet.has(i) && i !== grid.start && i !== grid.end) {
        candidates.push(i);
      }
    }
  }

  // If not enough dead ends off-path, allow any cell off the optimal path
  if (candidates.length < targetCount) {
    for (let i = 0; i < V; i++) {
      if (!optimalPathSet.has(i) && i !== grid.start && i !== grid.end && !candidates.includes(i)) {
        candidates.push(i);
      }
    }
  }

  relicRng.shuffle(candidates);
  const count = Math.min(targetCount, candidates.length);
  const selectedCells = candidates.slice(0, count);

  // Mix: 50% Ration, 30% Lantern Oil, 20% Compass
  const rationCount = Math.max(1, Math.round(count * 0.5));
  const lanternCount = Math.round(count * 0.3);

  const relics = [];
  for (let i = 0; i < selectedCells.length; i++) {
    let kind = RelicKind.COMPASS;
    if (i < rationCount) {
      kind = RelicKind.RATION;
    } else if (i < rationCount + lanternCount) {
      kind = RelicKind.LANTERN_OIL;
    }
    relics.push({
      cell: selectedCells[i],
      kind,
    });
  }

  return relics;
}
