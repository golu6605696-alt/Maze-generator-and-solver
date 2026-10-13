/**
 * @file index.js
 * Barrel export for core domain models and constants.
 */

export {
  Cell,
  WALL_N,
  WALL_E,
  WALL_S,
  WALL_W,
  ALL_WALLS,
  NO_WALLS,
  DIRECTIONS,
  OPPOSITE_WALL,
  DIRECTION_DELTAS,
} from './cell.js';

export { Grid } from './grid.js';
export { Step, STEP_TYPES } from './step.js';
export {
  Generator,
  RecursiveBacktracker,
  RandomizedPrims,
  RandomizedKruskals,
  braidMaze,
  RecursiveDivision,
  Wilsons,
} from './generators/index.js';
export { manhattanDistance, euclideanDistance } from './heuristics.js';
export {
  Solver,
  SolveResult,
  reconstructPath,
  DFS,
  BFS,
  AStar,
  Dijkstra,
  WallFollower,
  DeadEndFilling,
} from './solvers/index.js';
export { MazeAnalyzer } from './analyzer.js';
export { Cell3D, Grid3D } from './grid3d.js';



