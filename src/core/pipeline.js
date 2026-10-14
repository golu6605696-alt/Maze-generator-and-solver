/**
 * @file pipeline.js
 * Generation pipeline: buildMaze(code) wiring RULES.md section 3.2.
 */

import { Grid } from './grid.js';
import { Rng } from '../structures/rng.js';
import { parseCode } from './code.js';
import { getGenerator } from './generators/index.js';
import { braid } from './braid.js';
import { assignTerrain } from './terrain.js';
import { placeRelics } from './relics.js';
import { validate } from './validate.js';
import { drain } from './iter.js';
import { SOLVERS, runSolver } from './solvers/index.js';

/**
 * Builds a maze from an Expedition Code string according to the canonical pipeline.
 * @param {string|object} codeInput Expedition Code string or parsed code object.
 * @returns {{
 *   grid: Grid,
 *   code: string,
 *   parsed: object,
 *   relics: Array<{ cell: number, kind: string }>,
 *   optCost: number,
 *   optPath: number[],
 *   validation: object,
 *   fingerprint: number
 * }}
 */
export function buildMaze(codeInput) {
  const parsed = typeof codeInput === 'string' ? parseCode(codeInput) : codeInput;
  const { rows, cols, generator: genId, seed, braidPct = 0, terrainPct = 0 } = parsed;

  const rng = new Rng(seed);
  const grid = new Grid(rows, cols, true);

  // 1. Run generator with rng.fork("gen")
  const generator = getGenerator(genId);
  const genIt = generator.generate(grid, rng);
  drain(genIt);

  // 2. Validate perfect generator output
  if (genId !== 'div') { // Recursive division is also a tree generator
    const val0 = validate(grid);
    if (!val0.connected || val0.loops !== 0) {
      throw new Error(`Generator ${genId} failed tree invariant on seed ${seed}`);
    }
  }

  // 3. Braid if requested
  if (braidPct > 0) {
    braid(grid, braidPct, rng);
  }

  // 4. Terrain & elevation
  if (terrainPct > 0) {
    assignTerrain(grid, terrainPct, rng);
  }

  // 5. Reference solve (Dijkstra) for optimal path and cost
  const dijkstraRes = runSolver(SOLVERS.dij, grid, { weighted: true });
  const optCost = dijkstraRes.found ? dijkstraRes.cost : 0;
  const optPath = dijkstraRes.path;
  const optPathSet = new Set(optPath);

  // 6. Relics placed on dead ends off the reference path
  const relics = placeRelics(grid, optPathSet, rng);

  // 7. Final validation & fingerprint
  const validation = validate(grid);
  const fingerprint = grid.fingerprint();

  return {
    grid,
    code: typeof codeInput === 'string' ? codeInput : '',
    parsed,
    relics,
    optCost,
    optPath,
    validation,
    fingerprint,
  };
}
