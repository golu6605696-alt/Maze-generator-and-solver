import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../../src/core/grid.js';
import { Rng } from '../../src/structures/rng.js';
import { GENERATORS } from '../../src/core/generators/index.js';
import { SOLVERS, runSolver } from '../../src/core/solvers/index.js';
import { placeRelics } from '../../src/core/relics.js';
import { updateFog } from '../../src/core/fog.js';
import { computeScore } from '../../src/core/scoring.js';
import { drain } from '../../src/core/iter.js';
import { FogState, RelicKind } from '../../src/core/constants.js';

test('relics - placeRelics places relics on dead ends off reference path', () => {
  const rng = new Rng('relic_test_1');
  const grid = new Grid(15, 15, true);
  drain(GENERATORS.bkt.generate(grid, rng));

  const dijkstraRes = runSolver(SOLVERS.dij, grid, { weighted: true });
  const optPathSet = new Set(dijkstraRes.path);

  const relics = placeRelics(grid, optPathSet, rng);
  assert.ok(relics.length >= 3);

  for (const r of relics) {
    assert.equal(optPathSet.has(r.cell), false, 'Relic must not be on optimal path');
    assert.notEqual(r.cell, grid.start, 'Relic cannot be at start');
    assert.notEqual(r.cell, grid.end, 'Relic cannot be at end');
    assert.ok(Object.values(RelicKind).includes(r.kind));
  }
});

test('fog - updateFog reveals cells within line of sight radius', () => {
  const grid = new Grid(10, 10, true);
  const fog = new Uint8Array(grid.size);

  // Uncarved grid: only cell 0 is visible
  updateFog(grid, 0, 5, fog);
  assert.equal(fog[0], FogState.VISIBLE);
  assert.equal(fog[1], FogState.UNSEEN);

  // Carve corridor east 0 -> 1 -> 2
  grid.carve(0, 1);
  grid.carve(1, 2);
  updateFog(grid, 0, 5, fog);

  assert.equal(fog[0], FogState.VISIBLE);
  assert.equal(fog[1], FogState.VISIBLE);
  assert.equal(fog[2], FogState.VISIBLE);

  // Moving scout to 2 with small radius: cell 0 becomes REMEMBERED
  updateFog(grid, 2, 1, fog);
  assert.equal(fog[2], FogState.VISIBLE);
  assert.equal(fog[0], FogState.REMEMBERED);
});

test('scoring - computes exact formula and grades', () => {
  const report = computeScore({
    optCost: 100,
    playerCost: 110,
    L: 50,
    D: 55,
    Rv: 5,
    t: 25,
    difficulty: 'srv',
    relicsCollected: 2,
    phantomsBeaten: 1,
  });

  assert.ok(report.total > 0);
  assert.ok(['S', 'A', 'B', 'C', 'D'].includes(report.grade));
  assert.ok(report.base > 0);
  assert.ok(report.E > 0 && report.E <= 1);
});
