import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SeededRNG } from '../../src/structures/rng.js';

describe('SeededRNG', () => {
  it('generates identical sequence from the same seed', () => {
    const rng1 = new SeededRNG(42);
    const rng2 = new SeededRNG(42);

    const seq1 = Array.from({ length: 10 }, () => rng1.nextFloat());
    const seq2 = Array.from({ length: 10 }, () => rng2.nextFloat());

    assert.deepEqual(seq1, seq2);
  });

  it('generates different sequence from different seeds', () => {
    const rng1 = new SeededRNG(42);
    const rng2 = new SeededRNG(999);

    const seq1 = Array.from({ length: 5 }, () => rng1.nextFloat());
    const seq2 = Array.from({ length: 5 }, () => rng2.nextFloat());

    assert.notDeepEqual(seq1, seq2);
  });

  it('produces floats strictly in [0, 1)', () => {
    const rng = new SeededRNG(12345);
    for (let i = 0; i < 500; i++) {
      const val = rng.nextFloat();
      assert.ok(val >= 0 && val < 1, `Value ${val} should be in [0, 1)`);
    }
  });

  it('produces integers inclusive of bounds', () => {
    const rng = new SeededRNG(777);
    const min = 3;
    const max = 7;
    const seen = new Set();

    for (let i = 0; i < 500; i++) {
      const val = rng.nextInt(min, max);
      assert.ok(val >= min && val <= max, `Value ${val} should be in [${min}, ${max}]`);
      assert.ok(Number.isInteger(val));
      seen.add(val);
    }

    // All values in [3, 7] should be seen with 500 iterations
    for (let expected = min; expected <= max; expected++) {
      assert.ok(seen.has(expected), `Should have generated integer ${expected}`);
    }
  });

  it('handles inverted bounds in nextInt', () => {
    const rng = new SeededRNG(123);
    const val = rng.nextInt(10, 5);
    assert.ok(val >= 5 && val <= 10);
  });

  it('picks random element with choice()', () => {
    const rng = new SeededRNG(88);
    const items = ['apple', 'banana', 'cherry'];
    const chosen = rng.choice(items);
    assert.ok(items.includes(chosen));
    assert.equal(rng.choice([]), null);
    assert.equal(rng.choice(null), null);
  });

  it('shuffles array in-place and preserves elements', () => {
    const rng = new SeededRNG(101);
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const toShuffle = [...original];
    const result = rng.shuffle(toShuffle);

    assert.equal(result, toShuffle);
    assert.equal(result.length, original.length);
    assert.deepEqual([...result].sort((a, b) => a - b), original);
  });

  it('resets to reproducible state when reset() is called', () => {
    const rng = new SeededRNG(555);
    const first5 = Array.from({ length: 5 }, () => rng.nextFloat());
    rng.reset();
    const second5 = Array.from({ length: 5 }, () => rng.nextFloat());
    assert.deepEqual(first5, second5);
  });

  it('accepts string seed', () => {
    const rng1 = new SeededRNG('maze-seed-alpha');
    const rng2 = new SeededRNG('maze-seed-alpha');
    assert.equal(rng1.nextFloat(), rng2.nextFloat());
  });
});
