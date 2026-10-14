/**
 * @file terrain.js
 * Terrain and elevation assignment using deterministic integer value noise.
 * Defined in RULES.md section 3.6.
 */

import { TerrainType, Wall } from './constants.js';

/**
 * Generates an integer 2D value noise field on a rows x cols grid with given lattice spacing.
 * Values are roughly in [0, 255].
 * @param {number} rows
 * @param {number} cols
 * @param {number} spacing
 * @param {import('../structures/rng.js').Rng} rng
 * @returns {Uint8Array}
 */
function generateValueNoise(rows, cols, spacing, rng) {
  const latticeRows = Math.ceil(rows / spacing) + 2;
  const latticeCols = Math.ceil(cols / spacing) + 2;
  const lattice = new Uint8Array(latticeRows * latticeCols);

  for (let i = 0; i < lattice.length; i++) {
    lattice[i] = rng.int(256);
  }

  const out = new Uint8Array(rows * cols);

  for (let r = 0; r < rows; r++) {
    const lr = Math.floor(r / spacing);
    const fr = (r % spacing) / spacing; // fraction
    for (let c = 0; c < cols; c++) {
      const lc = Math.floor(c / spacing);
      const fc = (c % spacing) / spacing;

      const v00 = lattice[lr * latticeCols + lc];
      const v10 = lattice[lr * latticeCols + (lc + 1)];
      const v01 = lattice[(lr + 1) * latticeCols + lc];
      const v11 = lattice[(lr + 1) * latticeCols + (lc + 1)];

      // Bilinear interpolation
      const top = v00 + (v10 - v00) * fc;
      const bot = v01 + (v11 - v01) * fc;
      const val = top + (bot - top) * fr;

      out[r * cols + c] = Math.min(255, Math.max(0, Math.round(val)));
    }
  }

  return out;
}

/**
 * Checks if a cell is a straight corridor (has open passages in opposite directions: N-S or E-W).
 * @param {import('./grid.js').Grid} grid
 * @param {number} i
 * @returns {boolean}
 */
function isStraightCorridor(grid, i) {
  const w = grid.walls[i];
  const openN = (w & Wall.N) === 0;
  const openS = (w & Wall.S) === 0;
  const openE = (w & Wall.E) === 0;
  const openW = (w & Wall.W) === 0;

  // NS corridor
  if (openN && openS && !openE && !openW) return true;
  // EW corridor
  if (openE && openW && !openN && !openS) return true;
  return false;
}

/**
 * Assigns terrain and elevation to the grid based on density percentage (0..40).
 * @param {import('./grid.js').Grid} grid
 * @param {number} density Target percentage of non-plain terrain (0..40).
 * @param {import('../structures/rng.js').Rng} rng
 */
export function assignTerrain(grid, density, rng) {
  const terrainRng = rng.fork('terrain');
  const V = grid.size;

  // Reset terrain and elevation
  grid.terrain.fill(TerrainType.PLAIN);
  grid.elevation.fill(0);

  // 1. Elevation field (spacing 4)
  const elevNoise = generateValueNoise(grid.rows, grid.cols, 4, terrainRng);
  for (let i = 0; i < V; i++) {
    // Quantize 0..255 into 0..3
    grid.elevation[i] = Math.min(3, Math.floor(elevNoise[i] / 64));
  }

  if (density <= 0) return;

  // 2. Mud noise field (spacing 6)
  const mudNoise = generateValueNoise(grid.rows, grid.cols, 6, terrainRng);

  // Find threshold for top density% of cells
  // Sort copies of noise values
  const sorted = Array.from(mudNoise).sort((a, b) => b - a);
  const cutoffIdx = Math.min(sorted.length - 1, Math.floor((V * density) / 100));
  const mudThreshold = sorted[cutoffIdx];

  // Set mud in top density%
  for (let i = 0; i < V; i++) {
    if (mudNoise[i] >= mudThreshold) {
      grid.terrain[i] = TerrainType.MUD;
    }
  }

  // 3. Bridges inside mud patches (35% of straight corridors inside mud)
  for (let i = 0; i < V; i++) {
    if (grid.terrain[i] === TerrainType.MUD && isStraightCorridor(grid, i)) {
      if (terrainRng.int(100) < 35) {
        grid.terrain[i] = TerrainType.BRIDGE;
      }
    }
  }

  // 4. Ruins: ~3% of cells, straight corridors only, non-mud
  for (let i = 0; i < V; i++) {
    if (grid.terrain[i] === TerrainType.PLAIN && isStraightCorridor(grid, i)) {
      if (terrainRng.int(100) < 3) {
        grid.terrain[i] = TerrainType.RUINS;
      }
    }
  }

  // 5. Invariant: Start and end cells and their immediate in-bounds neighbors are ALWAYS Plain
  const neighborBuf = new Int32Array(4);
  const protectCells = [grid.start, grid.end];

  for (const c of [grid.start, grid.end]) {
    const count = grid.neighbors(c, neighborBuf);
    for (let k = 0; k < count; k++) {
      protectCells.push(neighborBuf[k]);
    }
  }

  for (const c of protectCells) {
    if (c >= 0 && c < V) {
      grid.terrain[c] = TerrainType.PLAIN;
    }
  }
}
