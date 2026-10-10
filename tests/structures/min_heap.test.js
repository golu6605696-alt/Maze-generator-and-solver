import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MinHeap } from '../../src/structures/min_heap.js';

describe('MinHeap', () => {
  it('starts empty', () => {
    const heap = new MinHeap();
    assert.equal(heap.isEmpty(), true);
    assert.equal(heap.size, 0);
    assert.equal(heap.peek(), undefined);
    assert.equal(heap.pop(), undefined);
  });

  it('maintains min-heap property with numbers', () => {
    const heap = new MinHeap();
    const numbers = [50, 20, 80, 10, 30, 70, 40, 60];
    for (const num of numbers) {
      heap.push(num);
    }

    assert.equal(heap.size, numbers.length);
    assert.equal(heap.peek(), 10);

    const sorted = [];
    while (!heap.isEmpty()) {
      sorted.push(heap.pop());
    }

    assert.deepEqual(sorted, [10, 20, 30, 40, 50, 60, 70, 80]);
  });

  it('works with custom comparator for graph nodes / priorities (A* and Dijkstra)', () => {
    // Comparator for { node, fScore }
    const heap = new MinHeap((a, b) => a.fScore - b.fScore);

    heap.push({ node: 'D', fScore: 12 });
    heap.push({ node: 'A', fScore: 3 });
    heap.push({ node: 'C', fScore: 8 });
    heap.push({ node: 'B', fScore: 5 });

    assert.equal(heap.peek().node, 'A');

    const extracted = [];
    while (!heap.isEmpty()) {
      extracted.push(heap.pop().node);
    }

    assert.deepEqual(extracted, ['A', 'B', 'C', 'D']);
  });

  it('handles duplicate priority values', () => {
    const heap = new MinHeap();
    heap.push(5);
    heap.push(2);
    heap.push(5);
    heap.push(1);
    heap.push(2);

    const result = [];
    while (!heap.isEmpty()) {
      result.push(heap.pop());
    }

    assert.deepEqual(result, [1, 2, 2, 5, 5]);
  });

  it('supports insert and extractMin aliases', () => {
    const heap = new MinHeap();
    heap.insert(4);
    heap.insert(1);
    assert.equal(heap.extractMin(), 1);
    assert.equal(heap.extractMin(), 4);
  });

  it('clears all items', () => {
    const heap = new MinHeap();
    heap.push(1);
    heap.push(2);
    heap.clear();
    assert.equal(heap.isEmpty(), true);
    assert.equal(heap.size, 0);
  });
});
