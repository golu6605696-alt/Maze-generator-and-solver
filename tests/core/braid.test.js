import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../../src/core/grid.js';
import { Rng } from '../../src/structures/rng.js';
import { GENERATORS } from '../../src/core/generators/index.js';
import { braid } from '../../src/core/braid.js';
import { validate } from '../../src/core/validate.js';
import { drain } from '../../src/core/iter.js';

test('Braid - removes dead ends and introduces cycles (T-B1)', () => {
  const rng = new Rng('braid_test_1');
  const grid = new Grid(20, 20, true);
  drain(GENERATORS.bkt.generate(grid, rng));

  const beforeVal = validate(grid);
  assert.equal(beforeVal.loops, 0);
  assert.ok(beforeVal.deadEnds > 10);

  const res = braid(grid, 50, rng);
  const afterVal = validate(grid);

  assert.ok(afterVal.deadEnds < beforeVal.deadEnds, 'Dead ends should decrease');
  assert.ok(afterVal.loops > 0, 'Loops should be created');
  assert.equal(afterVal.connected, true, 'Grid must remain connected');
  assert.equal(afterVal.symmetric, true, 'Walls must remain symmetric');
  assert.ok(res.achievedPct > 0);
});
