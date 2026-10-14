import test from 'node:test';
import assert from 'node:assert/strict';
import { Rng } from '../../src/structures/rng.js';

test('Rng - deterministic sequence for same seed', () => {
  const rng1 = new Rng('expedition_seed_1');
  const rng2 = new Rng('expedition_seed_1');

  const seq1 = Array.from({ length: 50 }, () => rng1.nextU32());
  const seq2 = Array.from({ length: 50 }, () => rng2.nextU32());

  assert.deepEqual(seq1, seq2);
});

test('Rng - different seeds yield different sequences', () => {
  const rng1 = new Rng('seed_alpha');
  const rng2 = new Rng('seed_beta');

  assert.notEqual(rng1.nextU32(), rng2.nextU32());
});

test('Rng - int(n) generates integers in [0, n)', () => {
  const rng = new Rng('bounds_test');
  for (let i = 0; i < 500; i++) {
    const v = rng.int(10);
    assert.ok(Number.isInteger(v));
    assert.ok(v >= 0 && v < 10);
  }
});

test('Rng - shuffle works in place and maintains elements', () => {
  const rng = new Rng('shuffle_seed');
  const orig = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const arr = orig.slice();
  rng.shuffle(arr);

  assert.equal(arr.length, orig.length);
  assert.deepEqual(arr.slice().sort((a, b) => a - b), orig);
});

test('Rng - fork produces independent reproducible streams', () => {
  const parent = new Rng('parent_seed');
  const child1 = parent.fork('terrain');
  const child2 = parent.fork('relics');

  const v1 = child1.nextU32();
  const v2 = child2.nextU32();
  assert.notEqual(v1, v2);

  // Reproducible from same parent state and label
  const parentB = new Rng('parent_seed');
  const child1B = parentB.fork('terrain');
  assert.equal(child1B.nextU32(), v1);
});
