/**
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
    }
  }

  /**
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
      curr = next;
    }

    return root;
  }

  /**
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
    return true;
  }

  /**
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
  }
}
