/**
 * @file wallfollower.js
 * Wall Follower solver (right-hand rule with loop guard).
 * Complexity: O(V) steps on a simply connected (perfect) maze; loop-guarded on braided mazes.
 * Complete only on simply connected mazes without loops.
 */

import { BitSet } from '../../structures/bitset.js';
import { Wall, DIRS } from '../constants.js';

export class WallFollowerSolver {
  constructor() {
    this.id = 'wfl';
    this.name = 'Wall Follower (Right-Hand)';
    this.complexity = Object.freeze({
      time: 'O(V) on perfect mazes',
      space: 'O(V) for loop guard',
      note: 'Right-hand rule with state guard (cell, heading). Detects loops on braided grids.',
    });
    this.guarantees = Object.freeze({
      optimalHops: false,
      optimalCost: false,
    });
  }

  /**
   * @param {import('../grid.js').Grid} grid
   * @param {object} [opts]
   * @returns {Generator<object, import('../types.js').PathResult, void>}
   */
  *solve(grid, opts = {}) {
    const V = grid.size;
    const { start, end } = grid;
    const maxEvents = opts.maxEvents || (V * 16);

    // Heading index into DIRS: 0=N, 1=E, 2=S, 3=W
    // State is cell * 4 + heading
    const stateGuard = new BitSet(V * 4);
    const trace = [start];

    let curr = start;
    let heading = 1; // initial heading: East

    let expanded = 0;
    let eventCount = 0;
    let found = (start === end);

    eventCount++;
    yield { t: 'VISIT', cell: curr };

    while (!found && eventCount < maxEvents) {
      const stateKey = curr * 4 + heading;
      if (stateGuard.get(stateKey)) {
        // Loop detected!
        break;
      }
      stateGuard.set(stateKey);

      // Directions to try in order of right-hand rule preference:
      // 1. Right: (heading + 1) % 4
      // 2. Straight: heading
      // 3. Left: (heading + 3) % 4
      // 4. Back: (heading + 2) % 4
      const order = [
        (heading + 1) & 3,
        heading,
        (heading + 3) & 3,
        (heading + 2) & 3,
      ];

      let moved = false;
      for (let k = 0; k < 4; k++) {
        const nextHeading = order[k];
        const dirBit = DIRS[nextHeading];
        if (!grid.hasWall(curr, dirBit)) {
          const nextCell = grid.neighbor(curr, dirBit);
          if (nextCell !== -1) {
            heading = nextHeading;
            curr = nextCell;
            trace.push(curr);
            expanded++;
            eventCount++;
            yield { t: 'VISIT', cell: curr };
            if (curr === end) {
              found = true;
            }
            moved = true;
            break;
          }
        }
      }

      if (!moved) {
        // Completely trapped
        break;
      }
    }

    // Clean up trace into a simple path without loops if found
    let path = [];
    let cost = 0;

    if (found) {
      // Simplify trace by loop erasure
      const simplePath = [];
      const posInPath = new Map();
      for (const cell of trace) {
        if (posInPath.has(cell)) {
          const idx = posInPath.get(cell);
          while (simplePath.length > idx) {
            const popped = simplePath.pop();
            posInPath.delete(popped);
          }
        }
        posInPath.set(cell, simplePath.length);
        simplePath.push(cell);
        if (cell === end) break;
      }
      path = simplePath;

      for (const cell of path) {
        eventCount++;
        yield { t: 'PATH', cell };
      }

      const useWeights = opts.weighted !== false;
      for (let j = 1; j < path.length; j++) {
        cost += useWeights ? grid.weightAt(path[j]) : 1;
      }
    }

    return {
      solverId: this.id,
      found,
      path,
      hops: found ? path.length - 1 : 0,
      cost,
      expanded,
      frontierPeak: 1,
      eventCount,
    };
  }
}
