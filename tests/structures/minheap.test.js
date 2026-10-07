import test from 'node:test';
import assert from 'node:assert/strict';
import { MinHeap } from '../../src/structures/minheap.js';

test('MinHeap - initial state is empty', () => {
  const heap = new MinHeap();
  assert.equal(heap.isEmpty(), true);
  assert.equal(heap.size, 0);
  assert.equal(heap.peek(), undefined);
  assert.equal(heap.pop(), undefined);
});

test('MinHeap - extracts numbers in ascending order', () => {
  const heap = new MinHeap();
  const values = [45, 12, 89, 3, 102, 33, 7, 7, 21];

  values.forEach(v => heap.push(v));

  assert.equal(heap.size, values.length);
  assert.equal(heap.peek(), 3);

  const sorted = [];
  while (!heap.isEmpty()) {
    sorted.push(heap.pop());
  }

  assert.deepEqual(sorted, [3, 7, 7, 12, 21, 33, 45, 89, 102]);
  assert.equal(heap.size, 0);
});

test('MinHeap - works with custom comparator for node objects', () => {
  // Simulating Dijkstra / A* priority queue entries: { cell: { r, c }, cost: number }
  const comparator = (a, b) => a.cost - b.cost;
  const heap = new MinHeap(comparator);

  heap.push({ id: 'C', cost: 15 });
  heap.push({ id: 'A', cost: 5 });
  heap.push({ id: 'D', cost: 25 });
  heap.push({ id: 'B', cost: 10 });

  assert.equal(heap.peek().id, 'A');
  assert.equal(heap.pop().id, 'A');
  assert.equal(heap.pop().id, 'B');
  assert.equal(heap.pop().id, 'C');
  assert.equal(heap.pop().id, 'D');
  assert.equal(heap.pop(), undefined);
});

test('MinHeap - clear empties the heap', () => {
  const heap = new MinHeap();
  heap.push(10);
  heap.push(20);
  heap.clear();

  assert.equal(heap.size, 0);
  assert.equal(heap.isEmpty(), true);
  assert.equal(heap.peek(), undefined);
});
