import test from 'node:test';
import assert from 'node:assert/strict';
import { Queue } from '../../src/structures/queue.js';

test('Queue - starts empty', () => {
  const queue = new Queue();
  assert.equal(queue.isEmpty(), true);
  assert.equal(queue.size, 0);
  assert.equal(queue.peek(), undefined);
  assert.equal(queue.dequeue(), undefined);
});

test('Queue - FIFO ordering', () => {
  const queue = new Queue();
  queue.enqueue('A');
  queue.enqueue('B');
  queue.enqueue('C');

  assert.equal(queue.size, 3);
  assert.equal(queue.isEmpty(), false);
  assert.equal(queue.peek(), 'A');

  assert.equal(queue.dequeue(), 'A');
  assert.equal(queue.dequeue(), 'B');
  assert.equal(queue.dequeue(), 'C');
  assert.equal(queue.dequeue(), undefined);
  assert.equal(queue.isEmpty(), true);
  assert.equal(queue.size, 0);
});

test('Queue - circular buffer wraparound and growth', () => {
  const queue = new Queue(4);
  // Fill and dequeue to advance head/tail
  for (let i = 0; i < 50; i++) {
    queue.enqueue(i);
    assert.equal(queue.dequeue(), i);
  }
  assert.equal(queue.size, 0);

  // Enqueue past initial capacity
  for (let i = 0; i < 100; i++) {
    queue.enqueue(i);
  }
  assert.equal(queue.size, 100);

  for (let i = 0; i < 100; i++) {
    assert.equal(queue.dequeue(), i);
  }
  assert.equal(queue.isEmpty(), true);
});

test('Queue - clear resets buffer', () => {
  const queue = new Queue();
  queue.enqueue(1);
  queue.enqueue(2);
  queue.clear();
  assert.equal(queue.size, 0);
  assert.equal(queue.isEmpty(), true);
  assert.equal(queue.dequeue(), undefined);
});
