/**
 * @file analyzer.js
 * Structural analysis of mazes: dead ends, junctions, corridor lengths, cyclomatic loops.
 */

import { validate } from './validate.js';

/**
 * Analyzes a grid and returns structural metrics.
 * @param {import('./grid.js').Grid} grid
 * @returns {object}
 */
export function analyzeMaze(grid) {
  const val = validate(grid);
  const V = grid.size;
  const neighborBuf = new Int32Array(4);

  let deadEnds = 0;
  let straightCorridors = 0;
  let turns = 0;
  let junctions3 = 0;
  let junctions4 = 0;
  let totalDegree = 0;

  for (let i = 0; i < V; i++) {
    const deg = grid.openNeighbors(i, neighborBuf);
    totalDegree += deg;

    if (deg === 1) {
      deadEnds++;
    } else if (deg === 2) {
      const a = neighborBuf[0];
      const b = neighborBuf[1];
      const rA = grid.rowOf(a);
      const cA = grid.colOf(a);
      const rB = grid.rowOf(b);
      const cB = grid.colOf(b);
      if (rA === rB || cA === cB) {
        straightCorridors++;
      } else {
        turns++;
      }
    } else if (deg === 3) {
      junctions3++;
    } else if (deg === 4) {
      junctions4++;
    }
  }

  const avgBranchingFactor = V > 0 ? (totalDegree / V) : 0;
  const deadEndRatio = V > 0 ? (deadEnds / V) : 0;

  return {
    rows: grid.rows,
    cols: grid.cols,
    cells: V,
    openPassages: val.openPassages,
    isPerfect: val.isPerfect,
    loops: val.loops,
    islands: val.islands,
    connected: val.connected,
    deadEnds,
    deadEndRatio: Math.round(deadEndRatio * 1000) / 1000,
    straightCorridors,
    turns,
    junctions3,
    junctions4,
    avgBranchingFactor: Math.round(avgBranchingFactor * 100) / 100,
    solvable: val.solvable,
  };
}
