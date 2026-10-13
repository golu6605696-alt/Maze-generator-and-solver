/**
 * @file wall_follower.js
 * Wall Follower (Left-Hand Rule) maze solver.
 * Follows the leftmost accessible wall. Solves simply-connected mazes.
 * Includes state-based cycle detection to prevent infinite loops in braid mazes.
 *
 * Complexity: O(V) time and space on simply-connected mazes.
 */

import { Solver, SolveResult } from './solver.js';
import { Step } from '../step.js';
import { WALL_N, WALL_E, WALL_S, WALL_W } from '../cell.js';

// Direction order in clockwise rotation: N (0), E (1), S (2), W (3)
const CW_DIRECTIONS = [WALL_N, WALL_E, WALL_S, WALL_W];

export class WallFollower extends Solver {
  constructor() {
    super('Wall Follower (Left Hand)');
  }

  /**
   * Solves the maze using the left-hand wall-following rule.
   *
   * @param {import('../grid.js').Grid} grid
   * @param {import('../cell.js').Cell|[number, number]} [start]
   * @param {import('../cell.js').Cell|[number, number]} [end]
   * @returns {SolveResult}
   */
  solve(grid, start, end) {
    const startTime = performance.now();
    const { start: startCell, end: endCell } = this._resolveEndpoints(grid, start, end);

    const steps = [];
    const path = [];
    const visitedSet = new Set();
    const stateSet = new Set();

    let current = startCell;
    let headingIdx = 1; // Facing East initially
    let reached = false;

    // Push start
    path.push(current);
    visitedSet.add(grid.cellIndex(current.row, current.col));
    steps.push(Step.visit(current));

    const maxSteps = grid.totalCells * 8; // Safety ceiling
    let stepCount = 0;

    while (stepCount++ < maxSteps) {
      if (current.row === endCell.row && current.col === endCell.col) {
        reached = true;
        break;
      }

      const stateKey = `${current.row},${current.col},${headingIdx}`;
      if (stateSet.has(stateKey)) {
        // Detected closed cycle in a disconnected or looped region
        break;
      }
      stateSet.add(stateKey);

      // Left-hand rule: try turning left (counter-clockwise: (headingIdx + 3) % 4)
      let turnLeftIdx = (headingIdx + 3) % 4;

      // Find first open direction starting from left, rotating clockwise
      let chosenDir = null;
      let nextHeadingIdx = turnLeftIdx;

      for (let rot = 0; rot < 4; rot++) {
        const testDir = CW_DIRECTIONS[(turnLeftIdx + rot) % 4];
        if (!current.hasWall(testDir)) {
          chosenDir = testDir;
          nextHeadingIdx = (turnLeftIdx + rot) % 4;
          break;
        }
      }

      if (chosenDir === null) {
        // Enclosed cell with 4 walls
        break;
      }

      // Step forward in chosenDir
      const delta = {
        [WALL_N]: [-1, 0],
        [WALL_E]: [0, 1],
        [WALL_S]: [1, 0],
        [WALL_W]: [0, -1],
      }[chosenDir];

      const nextCell = grid.getCell(current.row + delta[0], current.col + delta[1]);
      if (!nextCell) break;

      current = nextCell;
      headingIdx = nextHeadingIdx;

      visitedSet.add(grid.cellIndex(current.row, current.col));
      path.push(current);
      steps.push(Step.visit(current));
    }

    const finalPath = reached ? this._pruneRedundantLoops(path) : [];
    for (let i = 0; i < finalPath.length; i++) {
      steps.push(Step.path(finalPath[i]));
    }

    const timeMs = performance.now() - startTime;
    const cost = this._computeCost(finalPath);

    return new SolveResult({
      path: finalPath,
      visitedCount: visitedSet.size,
      steps,
      timeMs,
      cost,
    });
  }

  /**
   * Prunes cul-de-sacs and backtracked loops from the raw wall-follower trail.
   *
   * @param {import('../cell.js').Cell[]} rawPath
   * @returns {import('../cell.js').Cell[]}
   * @private
   */
  _pruneRedundantLoops(rawPath) {
    const stack = [];
    const indexMap = new Map();

    for (let i = 0; i < rawPath.length; i++) {
      const cell = rawPath[i];
      const key = `${cell.row},${cell.col}`;

      if (indexMap.has(key)) {
        // Retraced to an earlier cell: truncate loop
        const prevIdx = indexMap.get(key);
        while (stack.length > prevIdx + 1) {
          const removed = stack.pop();
          indexMap.delete(`${removed.row},${removed.col}`);
        }
      } else {
        indexMap.set(key, stack.length);
        stack.push(cell);
      }
    }

    return stack;
  }
}
