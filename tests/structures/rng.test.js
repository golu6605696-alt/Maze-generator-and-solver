import test from 'node:test';
import assert from 'node:assert/strict';
import { SeededRNG } from '../../src/structures/rng.js';

test('SeededRNG - produces deterministic sequences with identical numeric seeds', () => {
  const seed = 42;
  const rng1 = new SeededRNG(seed);
  const rng2 = new SeededRNG(seed);

  const seq1 = Array.from({ length: 20 }, () => rng1.next());
  const seq2 = Array.from({ length: 20 }, () => rng2.next());

  assert.deepEqual(seq1, seq2);
  seq1.forEach(num => {
    assert.ok(num >= 0 && num < 1, `Value ${num} should be in [0, 1)`);
  });
});

test('SeededRNG - produces deterministic sequences with string seeds', () => {
  const seedStr = 'maze-test-seed-xyz';
  const rng1 = new SeededRNG(seedStr);
  const rng2 = new SeededRNG(seedStr);

  const seq1 = Array.from({ length: 15 }, () => rng1.nextInt(1, 100));
  const seq2 = Array.from({ length: 15 }, () => rng2.nextInt(1, 100));

  assert.deepEqual(seq1, seq2);
});

test('SeededRNG - different seeds produce different sequences', () => {
  const rng1 = new SeededRNG(12345);
  const rng2 = new SeededRNG(67890);

  const val1 = rng1.next();
  const val2 = rng2.next();

  assert.notEqual(val1, val2);
});

test('SeededRNG - nextInt respects bounds and validates arguments', () => {
  const rng = new SeededRNG(999);

  for (let i = 0; i < 100; i++) {
    const val = rng.nextInt(5, 10);
    assert.ok(Number.isInteger(val));
    assert.ok(val >= 5 && val <= 10, `Expected val ${val} to be between 5 and 10`);
  }

  assert.throws(() => rng.nextInt(10, 5), RangeError);
});

test('SeededRNG - choice picks from array and handles empty array', () => {
  const rng = new SeededRNG(101);
  const items = ['N', 'E', 'S', 'W'];

  assert.equal(rng.choice([]), null);
  assert.equal(rng.choice(null), null);

  const picked = rng.choice(items);
  assert.ok(items.includes(picked));
});

test('SeededRNG - shuffle preserves all elements and permutation is deterministic', () => {
  const rng1 = new SeededRNG(555);
  const rng2 = new SeededRNG(555);

  const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const copy1 = [...original];
  const copy2 = [...original];

  rng1.shuffle(copy1);
  rng2.shuffle(copy2);

  assert.deepEqual(copy1, copy2);
  assert.deepEqual([...copy1].sort((a, b) => a - b), original);
});

test('SeededRNG - fork creates a functional independent generator', () => {
  const rng = new SeededRNG(777);
  const child = rng.fork();

  const num1 = rng.next();
  const num2 = child.next();

  assert.equal(typeof num1, 'number');
  assert.equal(typeof num2, 'number');
});
