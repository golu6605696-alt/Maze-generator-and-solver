import test from 'node:test';
import assert from 'node:assert/strict';
import { DSU } from '../../src/structures/dsu.js';

test('DSU - starts with V disjoint sets', () => {
  const dsu = new DSU(10);
  assert.equal(dsu.count, 10);
  for (let i = 0; i < 10; i++) {
    assert.equal(dsu.find(i), i);
  }
});

test('DSU - union merges sets and tracks connectivity', () => {
  const dsu = new DSU(6);
  assert.equal(dsu.connected(0, 1), false);

  assert.equal(dsu.union(0, 1), true);
  assert.equal(dsu.count, 5);
  assert.equal(dsu.connected(0, 1), true);

  // Redundant union returns false
  assert.equal(dsu.union(0, 1), false);
  assert.equal(dsu.count, 5);

  dsu.union(1, 2);
  assert.equal(dsu.connected(0, 2), true);
  assert.equal(dsu.count, 4);
});

test('DSU - random unions agree with naive component labeling', () => {
  const N = 20;
  const dsu = new DSU(N);

  // Naive adjacency list
  const adj = Array.from({ length: N }, () => []);

  for (let step = 0; step < 30; step++) {
    const a = (step * 7) % N;
    const b = (step * 13 + 1) % N;
    dsu.union(a, b);
    adj[a].push(b);
    adj[b].push(a);
  }

  // Check all pairs vs BFS on naive graph
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      // BFS reachability
      const q = [i];
      const visited = new Set([i]);
      while (q.length > 0) {
        const u = q.shift();
        for (const v of adj[u]) {
          if (!visited.has(v)) {
            visited.add(v);
            q.push(v);
          }
        }
      }
      assert.equal(dsu.connected(i, j), visited.has(j));
    }
  }
});
