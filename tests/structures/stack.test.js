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
});
