/**
 * @file dsu.js
 * Disjoint-Set Union (Union-Find) with path compression and union by rank.
 * Complexity: nearly O(1) amortized: O(alpha(V)) per operation.
 */

export class DSU {
  /**
   * @param {number} size Total number of elements [0, size - 1].
   */
  constructor(size) {
    this._size = size;
    this._count = size; // number of disjoint sets
    this._parent = new Int32Array(size);
    this._rank = new Uint8Array(size);
    this._setSizes = new Int32Array(size);

    for (let i = 0; i < size; i++) {
      this._parent[i] = i;
      this._rank[i] = 0;
      this._setSizes[i] = 1;
    }
  }

  /**
   * Finds the representative root of element x with path compression.
   * @param {number} x
   * @returns {number}
   */
  find(x) {
    let root = x;
    while (root !== this._parent[root]) {
      root = this._parent[root];
    }
    // Path compression
    let curr = x;
    while (curr !== root) {
      const next = this._parent[curr];
      this._parent[curr] = root;
      curr = next;
    }
    return root;
  }

  /**
   * Unions the sets containing x and y by rank.
   * @param {number} x
   * @param {number} y
   * @returns {boolean} True if x and y were in different sets and merged; false if already in the same set.
   */
  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) return false;

    // Union by rank
    if (this._rank[rootX] < this._rank[rootY]) {
      this._parent[rootX] = rootY;
      this._setSizes[rootY] += this._setSizes[rootX];
    } else if (this._rank[rootX] > this._rank[rootY]) {
      this._parent[rootY] = rootX;
      this._setSizes[rootX] += this._setSizes[rootY];
    } else {
      this._parent[rootY] = rootX;
      this._setSizes[rootX] += this._setSizes[rootY];
      this._rank[rootX]++;
    }

    this._count--;
    return true;
  }

  /**
   * Returns whether x and y belong to the same set.
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  connected(x, y) {
    return this.find(x) === this.find(y);
  }

  /**
   * Returns current count of disjoint sets.
   * @returns {number}
   */
  get count() {
    return this._count;
  }

  /**
   * Returns the size of the set containing x.
   * @param {number} x
   * @returns {number}
   */
  sizeOf(x) {
    return this._setSizes[this.find(x)];
  }

  /**
   * Total number of elements.
   * @returns {number}
   */
  get totalElements() {
    return this._size;
  }
}
