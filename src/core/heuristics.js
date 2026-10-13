/**
 * @file heuristics.js
 * Admissible and consistent distance heuristics for grid pathfinding.
 * Used by A* and other informed search algorithms.
 *
 * Complexity: O(1) time and space for all heuristics.
 */

/**
 * Calculates Manhattan (L1 taxicab) distance between two cells: |r1 - r2| + |c1 - c2|.
 * Admissible and consistent for orthogonal (4-directional) grid movement with minimum edge weight >= 1.
 *
 * @param {{row: number, col: number}} a
 * @param {{row: number, col: number}} b
 * @returns {number}
 */
export function manhattanDistance(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

/**
 * Calculates Euclidean (L2 straight-line) distance between two cells: sqrt((r1 - r2)^2 + (c1 - c2)^2).
 * Admissible for unconstrained planar pathfinding.
 *
 * @param {{row: number, col: number}} a
 * @param {{row: number, col: number}} b
 * @returns {number}
 */
export function euclideanDistance(a, b) {
  const dRow = a.row - b.row;
  const dCol = a.col - b.col;
  return Math.hypot(dRow, dCol);
}
