import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../../src/core/grid.js';
import { Rng } from '../../src/structures/rng.js';
import { DivisionGenerator } from '../../src/core/generators/division.js';
import { validate } from '../../src/core/validate.js';
import { drain } from '../../src/core/iter.js';

test('RecursiveDivision - generates a perfect maze (V-1 passages, fully connected)', () => {
  const grid = new Grid(12, 12, true);
  const division = new DivisionGenerator();
  drain(division.generate(grid, new Rng('div_42')));

  const rep = validate(grid);
  assert.equal(rep.connected, true);
  assert.equal(rep.isPerfect, true);
  assert.equal(rep.openPassages, grid.size - 1);
});

test('RecursiveDivision - seed reproducibility', () => {
  const gridA = new Grid(8, 8, true);
  const gridB = new Grid(8, 8, true);
  const division = new DivisionGenerator();

  drain(division.generate(gridA, new Rng('div_repro')));
  drain(division.generate(gridB, new Rng('div_repro')));

  assert.equal(gridA.fingerprint(), gridB.fingerprint());
});
