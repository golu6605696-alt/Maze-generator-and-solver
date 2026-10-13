/**
<<<<<<< HEAD
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
=======
 * Disjoint Set Union (DSU) / Union-Find data structure.
 * Features path compression and union by rank.
 * Time Complexity: Amortized O(alpha(N)) per operation where alpha is the inverse Ackermann function.
 */
export class DisjointSet {
  /**
   * Optionally initializes with an array or count of elements.
   * If a number N is passed, initializes elements 0 through N - 1.
   * If an iterable is passed, initializes each element.
   * @param {number|Iterable<*>} [initialElements]
   */
  constructor(initialElements) {
    /** @private @type {Map<*, *>} */
    this._parent = new Map();
    /** @private @type {Map<*, number>} */
    this._rank = new Map();
    /** @private */
    this._setCount = 0;

    if (typeof initialElements === 'number') {
      for (let i = 0; i < initialElements; i++) {
        this.makeSet(i);
      }
    } else if (initialElements && Symbol.iterator in Object(initialElements)) {
      for (const item of initialElements) {
        this.makeSet(item);
      }
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
    }
  }

  /**
<<<<<<< HEAD
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
=======
   * Initializes a new singleton set containing element x.
   * @param {*} x
   * @returns {boolean} True if a new set was created, false if x already existed.
   */
  makeSet(x) {
    if (this._parent.has(x)) {
      return false;
    }
    this._parent.set(x, x);
    this._rank.set(x, 0);
    this._setCount++;
    return true;
  }

  /**
   * Finds the representative root of the set containing x with path compression.
   * @param {*} x
   * @returns {*} Root representative of x, or undefined if x is not in any set.
   */
  find(x) {
    if (!this._parent.has(x)) {
      this.makeSet(x);
    }

    let root = x;
    while (root !== this._parent.get(root)) {
      root = this._parent.get(root);
    }

    // Path compression: point all traversed nodes directly to root
    let curr = x;
    while (curr !== root) {
      const next = this._parent.get(curr);
      this._parent.set(curr, root);
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
      curr = next;
    }

    return root;
  }

  /**
<<<<<<< HEAD
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
=======
   * Merges the sets containing elements x and y using union by rank.
   * @param {*} x
   * @param {*} y
   * @returns {boolean} True if two previously disjoint sets were merged, false if already in the same set.
   */
  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) {
      return false;
    }

    const rankX = this._rank.get(rootX);
    const rankY = this._rank.get(rootY);

    if (rankX < rankY) {
      this._parent.set(rootX, rootY);
    } else if (rankX > rankY) {
      this._parent.set(rootY, rootX);
    } else {
      this._parent.set(rootY, rootX);
      this._rank.set(rootX, rankX + 1);
    }

    this._setCount--;
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
    return true;
  }

  /**
<<<<<<< HEAD
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
=======
   * Checks whether x and y belong to the same set.
   * @param {*} x
   * @param {*} y
   * @returns {boolean}
   */
  connected(x, y) {
    return this.find(x) === this.find(y);
  }

  /**
   * Returns the total number of disjoint sets.
   * @returns {number}
   */
  get count() {
    return this._setCount;
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
  }
}
