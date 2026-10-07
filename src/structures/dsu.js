/**
 * @file dsu.js
 * Disjoint Set Union (Union-Find) with iterative path compression and union by rank.
 * Used by Randomized Kruskal's maze generator to detect cycles.
 * Complexity: O(alpha(N)) amortized per operation, where alpha is the inverse Ackermann function. O(N) space.
 */

export class DisjointSetUnion {
  /**
   * Initializes the DSU with `size` elements (indexed 0 to size - 1).
   *
   * @param {number} size
   */
  constructor(size) {
    if (!Number.isInteger(size) || size < 0) {
      throw new TypeError(`DSU size must be a non-negative integer, received ${size}`);
    }

    this._size = size;
    this._componentsCount = size;
    this._parent = new Int32Array(size);
    this._rank = new Uint8Array(size);

    for (let i = 0; i < size; i++) {
      this._parent[i] = i;
      this._rank[i] = 0;
    }
  }

  /**
   * Finds the representative root of element `i` with full path compression.
   * Uses an iterative two-pass approach to avoid recursion stack overflow.
   * Complexity: O(alpha(N)) amortized time.
   *
   * @param {number} i
   * @returns {number} representative root index
   */
  find(i) {
    if (i < 0 || i >= this._size) {
      throw new RangeError(`Index ${i} is out of bounds for DSU size ${this._size}`);
    }

    // Pass 1: Find the root representative
    let root = i;
    while (root !== this._parent[root]) {
      root = this._parent[root];
    }

    // Pass 2: Iterative path compression pointing every ancestor to root
    let curr = i;
    while (curr !== root) {
      const next = this._parent[curr];
      this._parent[curr] = root;
      curr = next;
    }

    return root;
  }

  /**
   * Unions the sets containing `i` and `j` using union by rank.
   * Complexity: O(alpha(N)) amortized time.
   *
   * @param {number} i
   * @param {number} j
   * @returns {boolean} true if sets were merged, false if already in same set
   */
  union(i, j) {
    const rootI = this.find(i);
    const rootJ = this.find(j);

    if (rootI === rootJ) {
      return false; // Already in the same component
    }

    // Union by rank: attach smaller rank tree under larger rank tree
    if (this._rank[rootI] < this._rank[rootJ]) {
      this._parent[rootI] = rootJ;
    } else if (this._rank[rootI] > this._rank[rootJ]) {
      this._parent[rootJ] = rootI;
    } else {
      this._parent[rootJ] = rootI;
      this._rank[rootI]++;
    }

    this._componentsCount--;
    return true;
  }

  /**
   * Returns true if elements `i` and `j` belong to the same connected component.
   * Complexity: O(alpha(N)) amortized time.
   *
   * @param {number} i
   * @param {number} j
   * @returns {boolean}
   */
  connected(i, j) {
    return this.find(i) === this.find(j);
  }

  /**
   * Returns the current number of disjoint components.
   * Complexity: O(1) time.
   *
   * @returns {number}
   */
  get count() {
    return this._componentsCount;
  }

  /**
   * Returns the total capacity / number of elements.
   * Complexity: O(1) time.
   *
   * @returns {number}
   */
  get size() {
    return this._size;
  }
}
