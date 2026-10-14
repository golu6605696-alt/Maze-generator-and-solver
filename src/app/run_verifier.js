/**
 * @file run_verifier.js
 * Headless verifier that replays recorded move strings against an Expedition Code
 * to mathematically re-verify the score and detect tampering.
 * Defined in ARCHITECTURE.md section 8 and TASK.md item 2.12.
 */

import { buildMaze } from '../core/pipeline.js';
import { computeScore } from '../core/scoring.js';
import { buildPhantoms } from '../core/phantoms.js';
import { NAME_TO_DIR, TerrainType, RUBBLE_COST, DIFFICULTIES, RelicKind } from '../core/constants.js';

/**
 * Replays a run record and verifies its validity.
 * @param {object} runRecord The exported run JSON object.
 * @returns {{ valid: boolean, reason?: string, computedScore?: object, recordedScore?: object }}
 */
export function verifyRun(runRecord) {
  if (!runRecord || typeof runRecord !== 'object') {
    return { valid: false, reason: 'Invalid run record object' };
  }
  if (runRecord.format !== 'expedition-run') {
    return { valid: false, reason: `Unknown format: ${runRecord.format}` };
  }

  const { code, moves, score: recordedScore } = runRecord;
  if (!code || typeof moves !== 'string') {
    return { valid: false, reason: 'Missing code or moves string' };
  }

  // Build the pristine maze from code
  let buildRes;
  try {
    buildRes = buildMaze(code);
  } catch (err) {
    return { valid: false, reason: `Failed to build maze from code: ${err.message}` };
  }

  const { grid, relics, optCost, optPath, parsed } = buildRes;
  const diff = parsed.difficulty || 'srv';
  const diffSpec = DIFFICULTIES[diff] || DIFFICULTIES.srv;

  let budget = Math.ceil(optCost * diffSpec.slack);
  let spent = 0;
  let ticks = 0;
  let scoutCell = grid.start;
  const distinctCells = new Set([scoutCell]);
  let revisitCount = 0;
  let relicsCollected = 0;

  // Active relic items copy
  const activeRelics = relics.slice();

  // Replay each move character
  for (let idx = 0; idx < moves.length; idx++) {
    const char = moves[idx];
    const dir = NAME_TO_DIR[char];
    if (!dir) {
      return { valid: false, reason: `Illegal move direction character at index ${idx}: ${char}` };
    }

    if (grid.hasWall(scoutCell, dir)) {
      return { valid: false, reason: `Move ${idx} (${char}) hit a wall at cell ${scoutCell}` };
    }

    const nextCell = grid.neighbor(scoutCell, dir);
    if (nextCell === -1) {
      return { valid: false, reason: `Move ${idx} (${char}) walked out of bounds` };
    }

    // Ruin crumbling
    if (grid.terrain[scoutCell] === TerrainType.RUINS) {
      grid.terrain[scoutCell] = RUBBLE_COST;
    }

    const weight = grid.weightAt(nextCell);
    spent += weight;
    ticks += weight;

    if (distinctCells.has(nextCell)) {
      revisitCount++;
    } else {
      distinctCells.add(nextCell);
    }

    scoutCell = nextCell;

    // Relic collection
    const rIdx = activeRelics.findIndex(r => r.cell === nextCell);
    if (rIdx !== -1) {
      const collected = activeRelics.splice(rIdx, 1)[0];
      relicsCollected++;
      if (collected.kind === RelicKind.RATION) {
        budget += 6;
      }
    }

    // Check stamina depletion before reaching end
    if (spent >= budget && scoutCell !== grid.end) {
      return { valid: false, reason: `Out of stamina at move ${idx}` };
    }
  }

  const won = (scoutCell === grid.end && spent <= budget);
  if (!won) {
    return { valid: false, reason: 'Moves did not reach the exit with remaining stamina' };
  }

  // Phantoms beaten
  const phantoms = buildPhantoms(grid, diffSpec.phantoms);
  let phantomsBeaten = 0;
  for (const ph of phantoms) {
    if (ph.status === 'LOST' || ticks < ph.finishTick) {
      phantomsBeaten++;
    }
  }

  // Recompute score
  const computedScore = computeScore({
    optCost,
    playerCost: spent,
    L: optPath.length,
    D: distinctCells.size,
    Rv: revisitCount,
    t: recordedScore.t !== undefined ? recordedScore.t : 0,
    difficulty: diff,
    relicsCollected,
    phantomsBeaten,
    isZen: recordedScore.isZen || false,
  });

  const baseMatch = Math.abs(computedScore.base - recordedScore.base) <= 1;
  const totalMatch = Math.abs(computedScore.total - recordedScore.total) <= 1;

  if (!baseMatch || !totalMatch) {
    return {
      valid: false,
      reason: `Score mismatch: recorded ${recordedScore.total}, recomputed ${computedScore.total}`,
      computedScore,
      recordedScore,
    };
  }

  return {
    valid: true,
    computedScore,
    recordedScore,
  };
}
