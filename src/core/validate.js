/**
 * @file validate.js
 * Graph integrity validator for mazes.
 * Checks wall symmetry, closed borders, connectivity, cyclomatic number (loops),
 * dead ends, and start-to-end reachability.
 */

import { Wall, DIRS, OPPOSITE } from './constants.js';
import { Queue } from '../structures/queue.js';
import { BitSet } from '../structures/bitset.js';

/**
 * Validates a grid and produces a ValidationReport.
 * @param {import('./grid.js').Grid} grid
 * @returns {object}
 */
export function validate(grid) {
  const V = grid.size;
  let symmetric = true;
  let bordersClosed = true;
  let openPassages = 0;
  let deadEnds = 0;

  const neighborBuf = new Int32Array(4);

  // 1. Check symmetry, borders, open passages, and dead ends
  for (let i = 0; i < V; i++) {
    const r = grid.rowOf(i);
    const c = grid.colOf(i);
    const w = grid.walls[i];

    // Border checks
    if (r === 0 && (w & Wall.N) === 0) bordersClosed = false;
    if (r === grid.rows - 1 && (w & Wall.S) === 0) bordersClosed = false;
    if (c === 0 && (w & Wall.W) === 0) bordersClosed = false;
    if (c === grid.cols - 1 && (w & Wall.E) === 0) bordersClosed = false;

    // Symmetry and open passages (count each internal edge once where i < nb)
    for (let k = 0; k < 4; k++) {
      const dir = DIRS[k];
      const nb = grid.neighbor(i, dir);
      if (nb !== -1) {
        const opp = OPPOSITE[dir];
        const hasMyWall = (w & dir) !== 0;
        const hasTheirWall = (grid.walls[nb] & opp) !== 0;
        if (hasMyWall !== hasTheirWall) {
          symmetric = false;
        }
        if (!hasMyWall && i < nb) {
          openPassages++;
        }
      }
    }

    // Dead end check: cell has exactly 1 open neighbor
    const openCount = grid.openNeighbors(i, neighborBuf);
    if (openCount === 1) {
      deadEnds++;
    }
  }

  // 2. Connected components via BFS
  const visited = new BitSet(V);
  let components = 0;
  const q = new Queue();

  for (let i = 0; i < V; i++) {
    if (!visited.get(i)) {
      components++;
      visited.set(i);
      q.enqueue(i);
      while (!q.isEmpty()) {
        const curr = q.dequeue();
        const count = grid.openNeighbors(curr, neighborBuf);
        for (let j = 0; j < count; j++) {
          const nb = neighborBuf[j];
          if (!visited.get(nb)) {
            visited.set(nb);
            q.enqueue(nb);
          }
        }
      }
    }
  }

  const connected = (components === 1);
  const islands = Math.max(0, components - 1);
  // Cyclomatic number of planar graph = E - V + components
  const loops = Math.max(0, openPassages - V + components);
  const isPerfect = connected && loops === 0 && openPassages === V - 1;

  // 3. Start and end validation
  const startEndValid = (
    grid.start >= 0 && grid.start < V &&
    grid.end >= 0 && grid.end < V &&
    grid.start !== grid.end
  );

  // 4. Solvability (path from start to end)
  let solvable = false;
  if (startEndValid) {
    const solveVisited = new BitSet(V);
    solveVisited.set(grid.start);
    q.clear();
    q.enqueue(grid.start);

    while (!q.isEmpty()) {
      const curr = q.dequeue();
      if (curr === grid.end) {
        solvable = true;
        break;
      }
      const count = grid.openNeighbors(curr, neighborBuf);
      for (let j = 0; j < count; j++) {
        const nb = neighborBuf[j];
        if (!solveVisited.get(nb)) {
          solveVisited.set(nb);
          q.enqueue(nb);
        }
      }
    }
  }

  return {
    symmetric,
    bordersClosed,
    connected,
    islands,
    openPassages,
    loops,
    isPerfect,
    deadEnds,
    startEndValid,
    solvable,
  };
}
