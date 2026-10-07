import test from 'node:test';
import assert from 'node:assert/strict';
import { Queue } from '../../src/structures/queue.js';

test('Queue - initial state is empty', () => {
  const queue = new Queue();
  assert.equal(queue.isEmpty(), true);
  assert.equal(queue.size, 0);
  assert.equal(queue.peek(), undefined);
  assert.equal(queue.dequeue(), undefined);
});

test('Queue - follows FIFO ordering', () => {
  const queue = new Queue();
  queue.enqueue('A');
  queue.enqueue('B');
  queue.enqueue('C');

  assert.equal(queue.size, 3);
  assert.equal(queue.isEmpty(), false);
  assert.equal(queue.peek(), 'A');

  assert.equal(queue.dequeue(), 'A');
  assert.equal(queue.peek(), 'B');
  assert.equal(queue.dequeue(), 'B');
  assert.equal(queue.dequeue(), 'C');
  assert.equal(queue.dequeue(), undefined);
  assert.equal(queue.isEmpty(), true);
  assert.equal(queue.size, 0);
});

test('Queue - clear empties queue completely', () => {
  const queue = new Queue();
  queue.enqueue(1);
  queue.enqueue(2);
  queue.clear();

  assert.equal(queue.size, 0);
  assert.equal(queue.isEmpty(), true);
  assert.equal(queue.peek(), undefined);
});

test('Queue - toArray returns snapshot in FIFO order', () => {
  const queue = new Queue();
  queue.enqueue(100);
  queue.enqueue(200);

  const arr = queue.toArray();
  assert.deepEqual(arr, [100, 200]);
  arr.push(300);
  assert.equal(queue.size, 2);
});

test('Queue - compaction triggers under high throughput without losing data', () => {
  const queue = new Queue();
  const total = 3000;

  for (let i = 0; i < total; i++) {
    queue.enqueue(i);
  }

  assert.equal(queue.size, total);

  for (let i = 0; i < total; i++) {
    const item = queue.dequeue();
    assert.equal(item, i);
  }

  assert.equal(queue.isEmpty(), true);
  assert.equal(queue.size, 0);
});
