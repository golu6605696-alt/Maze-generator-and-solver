import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCode, parseCode, randomSeed } from '../../src/core/code.js';
import { buildMaze } from '../../src/core/pipeline.js';
import { computeScore } from '../../src/core/scoring.js';
import { verifyRun } from '../../src/app/run_verifier.js';
import { updateFog } from '../../src/core/fog.js';
import { FogState } from '../../src/core/constants.js';

test('Expedition Code - parse and format round trip (T-C1)', () => {
  const orig = 'v1/25x25/bkt/7K3Q9M2D/b20/t15/srv';
  const parsed = parseCode(orig);
  assert.equal(parsed.rows, 25);
  assert.equal(parsed.cols, 25);
  assert.equal(parsed.generator, 'bkt');
  assert.equal(parsed.seed, '7K3Q9M2D');
  assert.equal(parsed.braidPct, 20);
  assert.equal(parsed.terrainPct, 15);
  assert.equal(parsed.difficulty, 'srv');

  const formatted = formatCode(parsed);
  assert.equal(formatted, orig);
});

test('Scoring - matches worked example from RULES.md section 2.2 (T-P1)', () => {
  // optCost = 60, playerCost = 75 -> E = 0.80
  // L = 40, t = 24 s, tPar = 18 -> T = 0.75
  // D = 52, Rv = 6 -> W = 18, X = 0.775
  // base = round(1000 * (0.40 + 0.1875 + 0.19375)) = 781, grade B
  // Surveyor (M = 1.0), two relics, one phantom beaten: total = 781 + 80 + 100 = 961
  const score = computeScore({
    optCost: 60,
    playerCost: 75,
    L: 40,
    D: 52,
    Rv: 6,
    t: 24,
    difficulty: 'srv',
    relicsCollected: 2,
    phantomsBeaten: 1,
    isZen: false,
  });

  assert.equal(score.E, 0.80);
  assert.equal(score.T, 0.75);
  assert.equal(score.X, 0.775);
  assert.equal(score.base, 781);
  assert.equal(score.grade, 'B');
  assert.equal(score.total, 961);
});

test('Solvability Invariant - budget >= optimal cost (T-E1)', () => {
  for (let i = 0; i < 20; i++) {
    const code = `v1/21x21/bkt/SEED_${i}/b15/t10/srv`;
    const res = buildMaze(code);
    assert.ok(res.validation.solvable, 'Maze must be solvable');
    assert.ok(res.optCost > 0, 'Optimal cost must be positive');
  }
});

test('Fog of War - updates visibility correctly (T-F1)', () => {
  const code = 'v1/15x15/bkt/FOG_TEST_1/b0/t0/srv';
  const { grid } = buildMaze(code);
  const fog = new Uint8Array(grid.size);

  updateFog(grid, grid.start, 5, fog);

  assert.equal(fog[grid.start], FogState.VISIBLE, 'Start cell must be VISIBLE');

  // Adjacent open neighbors must be visible
  const neighborBuf = new Int32Array(4);
  const openCount = grid.openNeighbors(grid.start, neighborBuf);
  for (let i = 0; i < openCount; i++) {
    assert.equal(fog[neighborBuf[i]], FogState.VISIBLE, 'Open neighbor must be VISIBLE');
  }
});
