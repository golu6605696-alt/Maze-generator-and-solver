<<<<<<< HEAD
import test from 'node:test';
import assert from 'node:assert/strict';
import { Stack } from '../../src/structures/stack.js';

test('Stack - initial state is empty', () => {
  const stack = new Stack();
  assert.equal(stack.isEmpty(), true);
  assert.equal(stack.size, 0);
  assert.equal(stack.peek(), undefined);
  assert.equal(stack.pop(), undefined);
});

test('Stack - follows LIFO ordering', () => {
  const stack = new Stack();
  stack.push('first');
  stack.push('second');
  stack.push('third');

  assert.equal(stack.size, 3);
  assert.equal(stack.isEmpty(), false);
  assert.equal(stack.peek(), 'third');

  assert.equal(stack.pop(), 'third');
  assert.equal(stack.pop(), 'second');
  assert.equal(stack.pop(), 'first');
  assert.equal(stack.pop(), undefined);
  assert.equal(stack.isEmpty(), true);
  assert.equal(stack.size, 0);
});

test('Stack - clear empties the stack', () => {
  const stack = new Stack();
  stack.push(1);
  stack.push(2);
  stack.clear();

  assert.equal(stack.size, 0);
  assert.equal(stack.isEmpty(), true);
  assert.equal(stack.peek(), undefined);
});

test('Stack - toArray returns snapshot without mutation', () => {
  const stack = new Stack();
  stack.push(10);
  stack.push(20);

  const arr = stack.toArray();
  assert.deepEqual(arr, [10, 20]);
  arr.push(30);
  assert.equal(stack.size, 2);
=======
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Stack } from '../../src/structures/stack.js';

describe('Stack', () => {
  it('starts empty', () => {
    const stack = new Stack();
    assert.equal(stack.isEmpty(), true);
    assert.equal(stack.size, 0);
    assert.equal(stack.peek(), undefined);
    assert.equal(stack.pop(), undefined);
  });

  it('pushes and pops in LIFO order', () => {
    const stack = new Stack();
    stack.push(10);
    stack.push(20);
    stack.push(30);

    assert.equal(stack.size, 3);
    assert.equal(stack.isEmpty(), false);
    assert.equal(stack.peek(), 30);

    assert.equal(stack.pop(), 30);
    assert.equal(stack.pop(), 20);
    assert.equal(stack.pop(), 10);
    assert.equal(stack.pop(), undefined);
    assert.equal(stack.isEmpty(), true);
    assert.equal(stack.size, 0);
  });

  it('clears all items', () => {
    const stack = new Stack();
    stack.push('a');
    stack.push('b');
    stack.clear();

    assert.equal(stack.isEmpty(), true);
    assert.equal(stack.size, 0);
    assert.equal(stack.pop(), undefined);
  });

  it('handles objects and complex types', () => {
    const stack = new Stack();
    const cellA = { row: 0, col: 0 };
    const cellB = { row: 0, col: 1 };
    stack.push(cellA);
    stack.push(cellB);

    assert.equal(stack.peek(), cellB);
    assert.equal(stack.pop(), cellB);
    assert.equal(stack.pop(), cellA);
  });
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
});
