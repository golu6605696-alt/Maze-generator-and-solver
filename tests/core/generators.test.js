import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../../src/core/grid.js';
import { Rng } from '../../src/structures/rng.js';
import { GENERATORS } from '../../src/core/generators/index.js';
import { validate } from '../../src/core/validate.js';
import { drain } from '../../src/core/iter.js';

const TEST_SIZES = [
  [5, 5],
  [7, 13],
  [15, 15],
  [25, 25],
];

for (const [genId, generator] of Object.entries(GENERATORS)) {
  test(`Generator (${genId}) - satisfies spanning-tree property on multiple sizes (T-G1)`, () => {
    for (const [rows, cols] of TEST_SIZES) {
      const rng = new Rng(`seed_${genId}_${rows}x${cols}`);
      const grid = new Grid(rows, cols, true);

      drain(generator.generate(grid, rng));

      const report = validate(grid);
      assert.equal(report.symmetric, true, `${genId} failed symmetry on ${rows}x${cols}`);
      assert.equal(report.bordersClosed, true, `${genId} leaked border on ${rows}x${cols}`);
      assert.equal(report.connected, true, `${genId} disconnected on ${rows}x${cols}`);
      assert.equal(report.islands, 0, `${genId} has islands on ${rows}x${cols}`);
      assert.equal(report.openPassages, grid.size - 1, `${genId} edge count mismatch on ${rows}x${cols}`);
      assert.equal(report.loops, 0, `${genId} introduced loops on ${rows}x${cols}`);
      assert.equal(report.isPerfect, true, `${genId} is not a perfect tree on ${rows}x${cols}`);
    }
  });

  test(`Generator (${genId}) - is deterministic for identical seeds`, () => {
    const rng1 = new Rng('identical_test_seed');
    const rng2 = new Rng('identical_test_seed');
    const g1 = new Grid(10, 10, true);
    const g2 = new Grid(10, 10, true);

    drain(generator.generate(g1, rng1));
    drain(generator.generate(g2, rng2));

    assert.equal(g1.fingerprint(), g2.fingerprint());
    assert.deepEqual(Array.from(g1.walls), Array.from(g2.walls));
  });
}
