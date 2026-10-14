import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../../src/core/grid.js';
import { DijkstraSolver } from '../../src/core/solvers/dijkstra.js';
import { BfsSolver } from '../../src/core/solvers/bfs.js';
import { drain } from '../../src/core/iter.js';
import { TerrainType } from '../../src/core/constants.js';

test('Dijkstra - optimal path on unweighted grid matches BFS', () => {
  const grid = new Grid(4, 4, false); // open grid

  const dijkstraResult = drain(new DijkstraSolver().solve(grid, { weighted: false }));
  const bfsResult = drain(new BfsSolver().solve(grid, { weighted: false }));

  assert.equal(dijkstraResult.found, true);
  assert.equal(dijkstraResult.hops, 6);
  assert.equal(dijkstraResult.hops, bfsResult.hops);
  assert.equal(dijkstraResult.cost, bfsResult.cost);
});

test('Dijkstra - prefers longer hop count with lower total weight over shorter high-weight path', () => {
  // 3x3 grid with two paths from (0,0) to (2,2):
  // Path 1 (Short in hops): (0,0) -> (1,0) -> (2,0) -> (2,1) -> (2,2) with a heavy mud swamp at (1,0)
  // Path 2 (Long in hops): (0,0) -> (0,1) -> (0,2) -> (1,2) -> (2,2) with all normal Plain weights
  const grid = new Grid(3, 3, true); // fully walled
  grid.start = grid.index(0, 0);
  grid.end = grid.index(2, 2);

  // Carve Path 1
  grid.carve(grid.index(0, 0), grid.index(1, 0));
  grid.carve(grid.index(1, 0), grid.index(2, 0));
  grid.carve(grid.index(2, 0), grid.index(2, 1));
  grid.carve(grid.index(2, 1), grid.index(2, 2));
  grid.terrain[grid.index(1, 0)] = TerrainType.MUD; // Mud cost = 3

  // Carve Path 2
  grid.carve(grid.index(0, 0), grid.index(0, 1));
  grid.carve(grid.index(0, 1), grid.index(0, 2));
  grid.carve(grid.index(0, 2), grid.index(1, 2));
  grid.carve(grid.index(1, 2), grid.index(2, 2));

  const dijkstraResult = drain(new DijkstraSolver().solve(grid, { weighted: true }));

  // Path 2 cost: (0,1: 1) + (0,2: 1) + (1,2: 1) + (2,2: 1) = 4
  // Path 1 cost: (1,0: 3) + (2,0: 1) + (2,1: 1) + (2,2: 1) = 6
  assert.equal(dijkstraResult.cost, 4);
  assert.deepEqual(dijkstraResult.path, [
    grid.index(0, 0),
    grid.index(0, 1),
    grid.index(0, 2),
    grid.index(1, 2),
    grid.index(2, 2),
  ]);
});
