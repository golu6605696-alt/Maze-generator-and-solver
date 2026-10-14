import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../../src/core/grid.js';
import { Rng } from '../../src/structures/rng.js';
import { WilsonGenerator } from '../../src/core/generators/wilson.js';
import { validate } from '../../src/core/validate.js';
import { drain } from '../../src/core/iter.js';

test("Wilson's - generates an unbiased uniform spanning tree (V-1 passages, fully connected)", () => {
  const grid = new Grid(10, 10, true);
  const wilson = new WilsonGenerator();
  drain(wilson.generate(grid, new Rng('wil_test_9999')));

  const rep = validate(grid);
  assert.equal(rep.connected, true);
  assert.equal(rep.isPerfect, true);
  assert.equal(rep.openPassages, grid.size - 1);
});

test("Wilson's - seed reproducibility", () => {
  const gridA = new Grid(8, 8, true);
  const gridB = new Grid(8, 8, true);
  const wilson = new WilsonGenerator();

  drain(wilson.generate(gridA, new Rng('wil_repro_1234')));
  drain(wilson.generate(gridB, new Rng('wil_repro_1234')));

  assert.equal(gridA.fingerprint(), gridB.fingerprint());
});
