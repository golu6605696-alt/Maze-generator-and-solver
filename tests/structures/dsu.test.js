import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DisjointSet } from '../../src/structures/dsu.js';

describe('DisjointSet (DSU)', () => {
  it('initializes with count of numeric items', () => {
    const dsu = new DisjointSet(5);
    assert.equal(dsu.count, 5);
    for (let i = 0; i < 5; i++) {
      assert.equal(dsu.find(i), i);
    }
  });

  it('unions sets and tracks connectivity', () => {
    const dsu = new DisjointSet(6); // 0, 1, 2, 3, 4, 5

    assert.equal(dsu.connected(0, 1), false);
    assert.equal(dsu.union(0, 1), true);
    assert.equal(dsu.connected(0, 1), true);
    assert.equal(dsu.count, 5);

    assert.equal(dsu.union(1, 2), true);
    assert.equal(dsu.connected(0, 2), true);
    assert.equal(dsu.count, 4);

    // Redundant union (cycle detection) returns false
    assert.equal(dsu.union(0, 2), false);
    assert.equal(dsu.count, 4);

    // Another component: 3 and 4
    dsu.union(3, 4);
    assert.equal(dsu.connected(3, 4), true);
    assert.equal(dsu.connected(0, 3), false);

    // Merge both components
    dsu.union(2, 4);
    assert.equal(dsu.connected(0, 4), true);
    assert.equal(dsu.connected(1, 3), true);
    assert.equal(dsu.count, 2); // {0,1,2,3,4} and {5}
  });

  it('works with coordinate strings or arbitrary keys (e.g., cell "r,c")', () => {
    const dsu = new DisjointSet();
    const cellA = '0,0';
    const cellB = '0,1';
    const cellC = '1,1';

    assert.equal(dsu.connected(cellA, cellB), false);
    assert.equal(dsu.union(cellA, cellB), true);
    assert.equal(dsu.connected(cellA, cellB), true);
    assert.equal(dsu.connected(cellA, cellC), false);

    assert.equal(dsu.union(cellB, cellC), true);
    assert.equal(dsu.connected(cellA, cellC), true);
  });

  it('path compression flattens tree structure', () => {
    const dsu = new DisjointSet(10);
    // Create chain
    for (let i = 0; i < 9; i++) {
      dsu.union(i, i + 1);
    }
    assert.equal(dsu.count, 1);
    // Find all - path compression points them directly
    for (let i = 0; i < 10; i++) {
      assert.equal(dsu.connected(0, i), true);
    }
  });
});
