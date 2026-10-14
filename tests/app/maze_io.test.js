import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../../src/core/grid.js';
import { exportMazeJson, importMazeJson, exportRunJson } from '../../src/app/maze_io.js';

test('maze_io - export and import round-trip preserves grid integrity', () => {
  const grid = new Grid(5, 5, true);
  grid.carve(grid.index(0, 0), grid.index(0, 1));
  grid.terrain[grid.index(0, 1)] = 2; // Mud

  const jsonStr = exportMazeJson(grid, { code: 'v1/5x5/bkt/TEST/b0/t0' });
  const imported = importMazeJson(jsonStr);

  assert.equal(imported.grid.rows, 5);
  assert.equal(imported.grid.cols, 5);
  assert.equal(imported.grid.hasWall(0, 2), false); // East wall carved
  assert.equal(imported.grid.terrain[1], 2);
  assert.equal(imported.code, 'v1/5x5/bkt/TEST/b0/t0');
});

test('maze_io - exportRunJson produces valid JSON', () => {
  const run = {
    code: 'v1/25x25/bkt/ABC/b0/t0/srv',
    moves: 'EESSSW',
    score: { base: 800, total: 900, grade: 'A' },
  };
  const jsonStr = exportRunJson(run);
  const parsed = JSON.parse(jsonStr);
  assert.equal(parsed.format, 'expedition-run');
  assert.equal(parsed.code, run.code);
  assert.equal(parsed.moves, run.moves);
});
