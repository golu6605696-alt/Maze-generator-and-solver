import test from 'node:test';
import assert from 'node:assert/strict';
import { DisjointSetUnion } from '../../src/structures/dsu.js';

test('DisjointSetUnion - initialization and bounds checking', () => {
  const dsu = new DisjointSetUnion(5);
  assert.equal(dsu.size, 5);
  assert.equal(dsu.count, 5);

  for (let i = 0; i < 5; i++) {
    assert.equal(dsu.find(i), i);
  }

  assert.throws(() => new DisjointSetUnion(-1), TypeError);
  assert.throws(() => new DisjointSetUnion('abc'), TypeError);
  assert.throws(() => dsu.find(-1), RangeError);
  assert.throws(() => dsu.find(5), RangeError);
});

test('DisjointSetUnion - union and connected functionality', () => {
  const dsu = new DisjointSetUnion(6);

  assert.equal(dsu.connected(0, 1), false);
  assert.equal(dsu.union(0, 1), true);
  assert.equal(dsu.count, 5);
  assert.equal(dsu.connected(0, 1), true);

  // Redundant union should return false
  assert.equal(dsu.union(0, 1), false);
  assert.equal(dsu.count, 5);

  // Connect 1 and 2 -> 0, 1, 2 are all connected
  assert.equal(dsu.union(1, 2), true);
  assert.equal(dsu.connected(0, 2), true);
  assert.equal(dsu.count, 4);
});

test('DisjointSetUnion - path compression on a deep chain', () => {
  const dsu = new DisjointSetUnion(100);

  // Sequentially link elements 0 to 99
  for (let i = 0; i < 99; i++) {
    dsu.union(i, i + 1);
  }

  assert.equal(dsu.count, 1);
  const root = dsu.find(0);

  // After find(0), path compression ensures all nodes quickly resolve to root
  for (let i = 0; i < 100; i++) {
    assert.equal(dsu.find(i), root);
  }
});

test('DisjointSetUnion - simulates spanning tree for Kruskals algorithm', () => {
  // 4 cells (2x2 grid): 0-(0,0), 1-(0,1), 2-(1,0), 3-(1,1)
  const dsu = new DisjointSetUnion(4);
  const edges = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 3], // Cycle edge
  ];

  const acceptedEdges = [];
  for (const [u, v] of edges) {
    if (dsu.union(u, v)) {
      acceptedEdges.push([u, v]);
    }
  }

  // Exactly V - 1 = 3 edges accepted to form a spanning tree with no cycles
  assert.equal(acceptedEdges.length, 3);
  assert.equal(dsu.count, 1);
  assert.ok(dsu.connected(0, 3));
});
