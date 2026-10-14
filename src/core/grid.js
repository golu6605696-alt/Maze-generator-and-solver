/**
 * @file grid.js
 * Grid data structure backed by typed arrays (Uint8Array for walls, terrain, elevation).
 * Strictly maintains wall symmetry and fast zero-allocation neighbor lookups.
 */

import { Wall, DIRS, DR, DC, OPPOSITE, TERRAIN, TerrainType } from './constants.js';

export const NONE = -1;

export class Grid {
  /**
   * @param {number} rows
   * @param {number} cols
   * @param {boolean} [initClosed=true] If true, all walls are initially closed (15).
   */
  constructor(rows, cols, initClosed = true) {
    if (rows < 2 || cols < 2) {
      throw new Error(`Invalid grid dimensions: ${rows}x${cols}`);
    }
    this.rows = rows;
    this.cols = cols;
    this.size = rows * cols;
    this.start = 0;
    this.end = this.size - 1;

    this.walls = new Uint8Array(this.size);
    if (initClosed) {
      this.walls.fill(Wall.ALL);
    }
    this.terrain = new Uint8Array(this.size); // defaults to PLAIN (0)
    this.elevation = new Uint8Array(this.size); // defaults to 0
  }

  /**
   * @param {number} r
   * @param {number} c
   * @returns {number}
   */
  index(r, c) {
    if (!this.inBounds(r, c)) return NONE;
    return r * this.cols + c;
  }

  /**
   * @param {number} i
   * @returns {number}
   */
  rowOf(i) {
    return Math.floor(i / this.cols);
  }

  /**
   * @param {number} i
   * @returns {number}
   */
  colOf(i) {
    return i % this.cols;
  }

  /**
   * @param {number} r
   * @param {number} c
   * @returns {boolean}
   */
  inBounds(r, c) {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
  }

  /**
   * Returns adjacent cell in direction `dir` (Wall.N, Wall.E, Wall.S, Wall.W), or NONE if out of bounds.
   * @param {number} i
   * @param {number} dir
   * @returns {number}
   */
  neighbor(i, dir) {
    const r = this.rowOf(i);
    const c = this.colOf(i);
    switch (dir) {
      case Wall.N: return r > 0 ? i - this.cols : NONE;
      case Wall.E: return c < this.cols - 1 ? i + 1 : NONE;
      case Wall.S: return r < this.rows - 1 ? i + this.cols : NONE;
      case Wall.W: return c > 0 ? i - 1 : NONE;
      default: return NONE;
    }
  }

  /**
   * Returns direction from cell a to adjacent cell b, or 0 if not adjacent.
   * @param {number} a
   * @param {number} b
   * @returns {number}
   */
  directionTo(a, b) {
    const dr = this.rowOf(b) - this.rowOf(a);
    const dc = this.colOf(b) - this.colOf(a);
    if (dr === -1 && dc === 0) return Wall.N;
    if (dr === 0 && dc === 1) return Wall.E;
    if (dr === 1 && dc === 0) return Wall.S;
    if (dr === 0 && dc === -1) return Wall.W;
    return 0;
  }

  /**
   * Returns whether wall bit in direction `dir` is set on cell i.
   * @param {number} i
   * @param {number} dir
   * @returns {boolean}
   */
  hasWall(i, dir) {
    return (this.walls[i] & dir) !== 0;
  }

  /**
   * Writes open neighbors in N, E, S, W order into `out`; returns the count.
   * Zero allocation when using a pre-allocated Int32Array(4).
   * @param {number} i
   * @param {Int32Array|number[]} out
   * @returns {number}
   */
  openNeighbors(i, out) {
    let count = 0;
    const w = this.walls[i];
    for (let k = 0; k < 4; k++) {
      const dir = DIRS[k];
      if ((w & dir) === 0) {
        const nb = this.neighbor(i, dir);
        if (nb !== NONE) {
          out[count++] = nb;
        }
      }
    }
    return count;
  }

  /**
   * Writes all valid in-bounds neighbors (ignoring walls) in N, E, S, W order into `out`.
   * @param {number} i
   * @param {Int32Array|number[]} out
   * @returns {number}
   */
  neighbors(i, out) {
    let count = 0;
    for (let k = 0; k < 4; k++) {
      const nb = this.neighbor(i, DIRS[k]);
      if (nb !== NONE) {
        out[count++] = nb;
      }
    }
    return count;
  }

  /**
   * Carves passage between orthogonally adjacent cells a and b (removes walls symmetrically).
   * @param {number} a
   * @param {number} b
   */
  carve(a, b) {
    const dir = this.directionTo(a, b);
    if (!dir) return;
    const opp = OPPOSITE[dir];
    this.walls[a] &= ~dir;
    this.walls[b] &= ~opp;
  }

  /**
   * Builds wall between orthogonally adjacent cells a and b symmetrically.
   * @param {number} a
   * @param {number} b
   */
  build(a, b) {
    const dir = this.directionTo(a, b);
    if (!dir) return;
    const opp = OPPOSITE[dir];
    this.walls[a] |= dir;
    this.walls[b] |= opp;
  }

  /**
   * Returns movement cost to enter cell i.
   * @param {number} i
   * @returns {number}
   */
  weightAt(i) {
    const t = this.terrain[i];
    const spec = TERRAIN[t];
    return spec ? spec.cost : 1;
  }

  /**
   * Returns a lightweight read-only snapshot view of cell i.
   * @param {number} i
   * @returns {object}
   */
  cell(i) {
    const t = this.terrain[i];
    const spec = TERRAIN[t] || TERRAIN[TerrainType.PLAIN];
    return {
      index: i,
      row: this.rowOf(i),
      col: this.colOf(i),
      walls: this.walls[i],
      terrain: t,
      weight: spec.cost,
      elevation: this.elevation[i],
    };
  }

  /**
   * Returns a deep clone of this Grid.
   * @returns {Grid}
   */
  clone() {
    const g = new Grid(this.rows, this.cols, false);
    g.start = this.start;
    g.end = this.end;
    g.walls.set(this.walls);
    g.terrain.set(this.terrain);
    g.elevation.set(this.elevation);
    return g;
  }

  /**
   * FNV-1a 32-bit hash over walls, terrain, elevation, start, end.
   * Used for golden tests and tamper detection.
   * @returns {number}
   */
  fingerprint() {
    let h = 0x811c9dc5;
    const update = (byte) => {
      h ^= (byte & 0xff);
      h = Math.imul(h, 0x01000193) >>> 0;
    };

    update(this.rows);
    update(this.cols);
    update(this.start & 0xff);
    update((this.start >>> 8) & 0xff);
    update(this.end & 0xff);
    update((this.end >>> 8) & 0xff);

    for (let i = 0; i < this.size; i++) {
      update(this.walls[i]);
      update(this.terrain[i]);
      update(this.elevation[i]);
    }
    return h >>> 0;
  }
}
