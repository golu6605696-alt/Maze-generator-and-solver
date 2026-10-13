/**
 * @file analyzer.js
 * Comprehensive topological and structural maze analyzer.
 * Calculates dead ends, junctions, longest path (tree diameter),
 * solution distance, branching metrics, and composite difficulty score.
 *
 * Complexity: O(V) time and space using two-pass breadth-first searches.
 */

import { Queue } from '../structures/queue.js';
import { BFS } from './solvers/bfs.js';
import { manhattanDistance } from './heuristics.js';

export class MazeAnalyzer {
  /**
   * Evaluates metrics and topology for the provided maze grid.
   *
   * @param {import('./grid.js').Grid} grid
   * @returns {{
   *   totalCells: number,
   *   deadEnds: number,
   *   deadEndPct: number,
   *   junctions: number,
   *   corridors: number,
   *   solutionLength: number,
   *   longestPath: number,
   *   riverFactor: number,
   *   difficultyScore: number
   * }}
   */
  static analyze(grid) {
    if (!grid) throw new TypeError('MazeAnalyzer requires a valid Grid instance');

    let deadEnds = 0;
    let junctions = 0;
    let corridors = 0;

    for (const cell of grid) {
      const openCount = grid.openNeighbors(cell).length;
      if (openCount === 1) {
        deadEnds++;
      } else if (openCount === 2) {
        corridors++;
      } else if (openCount >= 3) {
        junctions++;
      }
    }

    // 1. Solution path metric
    const bfsResult = new BFS().solve(grid);
    const solutionLength = bfsResult.pathLength;

    // 2. Longest simple path (tree diameter) via 2-pass BFS
    const longestPath = MazeAnalyzer._computeDiameter(grid);

    // 3. River factor (windingness ratio = solution length vs straight-line distance)
    const minDistance = manhattanDistance(grid.start, grid.end) + 1;
    const windingRatio = solutionLength > 0 ? solutionLength / minDistance : 1;
    const riverFactor = Math.round(windingRatio * 100) / 100;

    // 4. Composite Difficulty Score (0 to 100)
    const deadEndDensity = deadEnds / grid.totalCells; // Typically 0.2 to 0.4
    const lengthScore = Math.min(40, (solutionLength / (grid.totalCells * 0.4)) * 40);
    const deadEndScore = Math.min(30, (deadEndDensity / 0.35) * 30);
    const windingScore = Math.min(30, ((riverFactor - 1) / 3) * 30);

    const difficultyScore = Math.max(1, Math.min(100, Math.round(lengthScore + deadEndScore + windingScore)));

    return {
      totalCells: grid.totalCells,
      deadEnds,
      deadEndPct: Math.round((deadEnds / grid.totalCells) * 100),
      junctions,
      corridors,
      solutionLength,
      longestPath,
      riverFactor,
      difficultyScore,
    };
  }

  /**
   * Computes the diameter of the maze (longest shortest path between any two cells).
   *
   * @param {import('./grid.js').Grid} grid
   * @returns {number}
   * @private
   */
  static _computeDiameter(grid) {
    // Pass 1: Find farthest cell from start
    const { farthestNode } = MazeAnalyzer._bfsFarthest(grid, grid.start);
    // Pass 2: Find farthest cell from that node
    const { maxDist } = MazeAnalyzer._bfsFarthest(grid, farthestNode);
    return maxDist + 1; // Count cells in path
  }

  /**
   * Runs BFS from origin cell to find the maximum distance and the farthest reached cell.
   *
   * @param {import('./grid.js').Grid} grid
   * @param {import('./cell.js').Cell} origin
   * @returns {{farthestNode: import('./cell.js').Cell, maxDist: number}}
   * @private
   */
  static _bfsFarthest(grid, origin) {
    const queue = new Queue();
    const dist = new Int32Array(grid.totalCells).fill(-1);

    const originIdx = grid.cellIndex(origin.row, origin.col);
    dist[originIdx] = 0;
    queue.enqueue(origin);

    let farthestNode = origin;
    let maxDist = 0;

    while (!queue.isEmpty()) {
      const current = queue.dequeue();
      const currDist = dist[grid.cellIndex(current.row, current.col)];

      if (currDist > maxDist) {
        maxDist = currDist;
        farthestNode = current;
      }

      const neighbors = grid.openNeighbors(current);
      for (let i = 0; i < neighbors.length; i++) {
        const neighbor = neighbors[i];
        const nIdx = grid.cellIndex(neighbor.row, neighbor.col);
        if (dist[nIdx] === -1) {
          dist[nIdx] = currDist + 1;
          queue.enqueue(neighbor);
        }
      }
    }

    return { farthestNode, maxDist };
  }
}
