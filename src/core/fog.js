/**
 * @file fog.js
 * Fog-of-War and Line of Sight (LOS) calculation.
 * Defined in RULES.md section 1.6.
 */

import { FogState, Wall } from './constants.js';

/**
 * Supercover line walk between two cells on a grid.
 * Returns true if line of sight is clear (unblocked by walls), false otherwise.
 * @param {import('./grid.js').Grid} grid
 * @param {number} r0 Scout row
 * @param {number} c0 Scout col
 * @param {number} r1 Target row
 * @param {number} c1 Target col
 * @returns {boolean}
 */
export function hasLineOfSight(grid, r0, c0, r1, c1) {
  let r = r0;
  let c = c0;
  const dr = r1 - r0;
  const dc = c1 - c0;
  const stepR = dr > 0 ? 1 : (dr < 0 ? -1 : 0);
  const stepC = dc > 0 ? 1 : (dc < 0 ? -1 : 0);

  const absDr = Math.abs(dr);
  const absDc = Math.abs(dc);

  // Purely horizontal line
  if (dr === 0) {
    const wallDir = stepC > 0 ? Wall.E : Wall.W;
    for (let currC = c0; currC !== c1; currC += stepC) {
      const idx = r0 * grid.cols + currC;
      if (grid.hasWall(idx, wallDir)) return false;
    }
    return true;
  }

  // Purely vertical line
  if (dc === 0) {
    const wallDir = stepR > 0 ? Wall.S : Wall.N;
    for (let currR = r0; currR !== r1; currR += stepR) {
      const idx = currR * grid.cols + c0;
      if (grid.hasWall(idx, wallDir)) return false;
    }
    return true;
  }

  // Bresenham error accumulator with supercover corner check
  let err = absDc - absDr;

  while (r !== r1 || c !== c1) {
    const e2 = err * 2;
    const canMoveR = e2 > -absDc;
    const canMoveC = e2 < absDr;

    if (canMoveR && canMoveC) {
      // Diagonal step: blocked ONLY if both L-shaped routes are blocked
      const nextR = r + stepR;
      const nextC = c + stepC;

      const currIdx = r * grid.cols + c;
      const intermediateR = nextR * grid.cols + c; // vertical first
      const intermediateC = r * grid.cols + nextC; // horizontal first

      const rWallDir = stepR > 0 ? Wall.S : Wall.N;
      const cWallDir = stepC > 0 ? Wall.E : Wall.W;

      // Route 1: (r, c) -> (nextR, c) -> (nextR, nextC)
      const route1Blocked = (
        grid.hasWall(currIdx, rWallDir) ||
        grid.hasWall(intermediateR, cWallDir)
      );

      // Route 2: (r, c) -> (r, nextC) -> (nextR, nextC)
      const route2Blocked = (
        grid.hasWall(currIdx, cWallDir) ||
        grid.hasWall(intermediateC, rWallDir)
      );

      if (route1Blocked && route2Blocked) {
        return false;
      }

      r = nextR;
      c = nextC;
      err -= absDr;
      err += absDc;
    } else if (canMoveR) {
      // Orthogonal step along row
      const nextR = r + stepR;
      const currIdx = r * grid.cols + c;
      const wallDir = stepR > 0 ? Wall.S : Wall.N;
      if (grid.hasWall(currIdx, wallDir)) {
        return false;
      }
      r = nextR;
      err -= absDc;
    } else if (canMoveC) {
      // Orthogonal step along col
      const nextC = c + stepC;
      const currIdx = r * grid.cols + c;
      const wallDir = stepC > 0 ? Wall.E : Wall.W;
      if (grid.hasWall(currIdx, wallDir)) {
        return false;
      }
      c = nextC;
      err += absDr;
    }
  }

  return true;
}

/**
 * Updates fog array based on scout position and lantern radius.
 * Mutates the fogState Uint8Array in place.
 * @param {import('./grid.js').Grid} grid
 * @param {number} scoutCell
 * @param {number} radius
 * @param {Uint8Array} fogState
 */
export function updateFog(grid, scoutCell, radius, fogState) {
  const V = grid.size;
  const sRow = grid.rowOf(scoutCell);
  const sCol = grid.colOf(scoutCell);
  const r2 = radius * radius;

  // 1. Mark previously VISIBLE cells as REMEMBERED
  for (let i = 0; i < V; i++) {
    if (fogState[i] === FogState.VISIBLE) {
      fogState[i] = FogState.REMEMBERED;
    }
  }

  // 2. Scout's cell is always VISIBLE
  fogState[scoutCell] = FogState.VISIBLE;

  // 3. Immediately open adjacent cells are always VISIBLE
  const neighborBuf = new Int32Array(4);
  const openCount = grid.openNeighbors(scoutCell, neighborBuf);
  for (let i = 0; i < openCount; i++) {
    fogState[neighborBuf[i]] = FogState.VISIBLE;
  }

  // 4. Test candidate cells in radius bounding box
  const minR = Math.max(0, sRow - radius);
  const maxR = Math.min(grid.rows - 1, sRow + radius);
  const minC = Math.max(0, sCol - radius);
  const maxC = Math.min(grid.cols - 1, sCol + radius);

  for (let r = minR; r <= maxR; r++) {
    const dr = r - sRow;
    for (let c = minC; c <= maxC; c++) {
      const dc = c - sCol;
      if (dr * dr + dc * dc <= r2) {
        const idx = r * grid.cols + c;
        if (fogState[idx] === FogState.VISIBLE) continue;

        if (hasLineOfSight(grid, sRow, sCol, r, c)) {
          fogState[idx] = FogState.VISIBLE;
        }
      }
    }
  }
}
