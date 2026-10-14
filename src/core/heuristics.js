/**
 * @file heuristics.js
 * Admissible heuristics for grid pathfinding.
 */

import { MIN_WEIGHT } from './constants.js';

/**
 * Admissible Manhattan distance scaled by MIN_WEIGHT.
 * @param {number} r1
 * @param {number} c1
 * @param {number} r2
 * @param {number} c2
 * @returns {number}
 */
export function manhattan(r1, c1, r2, c2) {
  return MIN_WEIGHT * (Math.abs(r1 - r2) + Math.abs(c1 - c2));
}

/**
 * Euclidean distance.
 * @param {number} r1
 * @param {number} c1
 * @param {number} r2
 * @param {number} c2
 * @returns {number}
 */
export function euclidean(r1, c1, r2, c2) {
  const dr = r1 - r2;
  const dc = c1 - c2;
  return Math.sqrt(dr * dr + dc * dc);
}
