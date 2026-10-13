import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../../src/core/grid.js';
import { Dijkstra } from '../../src/core/solvers/dijkstra.js';
import { BFS } from '../../src/core/solvers/bfs.js';
import { NO_WALLS } from '../../src/core/cell.js';

test('Dijkstra - optimal path on unweighted grid matches BFS', () => {
  const grid = new Grid(4, 4, { start: [0, 0], end: [3, 3] });
  grid.resetWalls(NO_WALLS);

  const dijkstraResult = new Dijkstra().solve(grid);
  const bfsResult = new BFS().solve(grid);

  assert.equal(dijkstraResult.found, true);
  assert.equal(dijkstraResult.pathLength, 7);
  assert.equal(dijkstraResult.pathLength, bfsResult.pathLength);
  assert.equal(dijkstraResult.cost, bfsResult.cost);
});

test('Dijkstra - prefers longer hop count with lower total weight over shorter high-weight path', () => {
  // 3x3 grid with two paths from (0,0) to (2,2):
  // Path 1 (Short in hops): (0,0) -> (1,0) -> (2,0) -> (2,1) -> (2,2) with a heavy mud swamp at (1,0) weight 10
  // Path 2 (Long in hops): (0,0) -> (0,1) -> (0,2) -> (1,2) -> (2,2) with all normal weights 1
  const grid = new Grid(3, 3, { start: [0, 0], end: [2, 2] });

  // Open Path 1
  grid.removeWall(grid.getCell(0, 0), grid.getCell(1, 0));
  grid.removeWall(grid.getCell(1, 0), grid.getCell(2, 0));
  grid.removeWall(grid.getCell(2, 0), grid.getCell(2, 1));
  grid.removeWall(grid.getCell(2, 1), grid.getCell(2, 2));
  grid.getCell(1, 0).setWeight(10); // Heavy mud cell

  // Open Path 2
  grid.removeWall(grid.getCell(0, 0), grid.getCell(0, 1));
  grid.removeWall(grid.getCell(0, 1), grid.getCell(0, 2));
  grid.removeWall(grid.getCell(0, 2), grid.getCell(1, 2));
  grid.removeWall(grid.getCell(1, 2), grid.getCell(2, 2));

  const dijkstraResult = new Dijkstra().solve(grid);

  // Dijkstra must choose the unweighted Path 2 (cost = 5), avoiding mud cell (cost = 1 + 10 + 1 + 1 + 1 = 14)
  assert.equal(dijkstraResult.cost, 5);
  const pathCoords = dijkstraResult.path.map((c) => [c.row, c.col]);
  assert.deepEqual(pathCoords, [
    [0, 0], [0, 1], [0, 2], [1, 2], [2, 2],
  ]);
});
