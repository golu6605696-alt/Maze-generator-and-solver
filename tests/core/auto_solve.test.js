import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../../src/core/grid.js';
import { Rng } from '../../src/structures/rng.js';
import { GENERATORS } from '../../src/core/generators/index.js';
import { getSolver, runSolver } from '../../src/core/solvers/index.js';
import { braid } from '../../src/core/braid.js';
import { drain } from '../../src/core/iter.js';

test('Auto-Solve - BFS, DFS, and Backtracking correctly solve Easy, Medium, and Hard mazes', () => {
  const difficulties = [
    { name: 'easy', gen: 'bkt', braidPct: 0 },
    { name: 'medium', gen: 'krk', braidPct: 5 },
    { name: 'hard', gen: 'prm', braidPct: 15 },
  ];

  const solverIds = ['bfs', 'dfs', 'bkt'];

  for (const diff of difficulties) {
    const rng = new Rng(`auto_solve_test_${diff.name}`);
    const grid = new Grid(15, 15, true);
    drain(GENERATORS[diff.gen].generate(grid, rng));
    if (diff.braidPct > 0) {
      braid(grid, diff.braidPct, rng);
    }

    for (const algoId of solverIds) {
      const solver = getSolver(algoId);
      assert.ok(solver, `Solver ${algoId} should be defined`);

      const t0 = performance.now();
      const res = runSolver(solver, grid, { weighted: false });
      const elapsedMs = performance.now() - t0;

      assert.equal(res.found, true, `${algoId} should find exit on ${diff.name} maze`);
      assert.ok(res.path.length > 0, `${algoId} should return path`);
      assert.equal(res.path[0], grid.start, `${algoId} path must start at maze start`);
      assert.equal(res.path[res.path.length - 1], grid.end, `${algoId} path must end at maze exit`);
      assert.ok(res.hops > 0, `${algoId} hops should be > 0`);
      assert.ok(res.expanded > 0, `${algoId} expanded count should be > 0`);
      assert.ok(elapsedMs >= 0, `Elapsed time should be measurable`);
    }
  }
});

test('Auto-Solve - BFS guarantees minimal hops compared to DFS and Backtrack', () => {
  const rng = new Rng('bfs_optimality_check');
  const grid = new Grid(15, 15, true);
  drain(GENERATORS.krk.generate(grid, rng));
  braid(grid, 25, rng);

  const resBfs = runSolver(getSolver('bfs'), grid, { weighted: false });
  const resDfs = runSolver(getSolver('dfs'), grid, { weighted: false });
  const resBkt = runSolver(getSolver('bkt'), grid, { weighted: false });

  assert.ok(resBfs.hops <= resDfs.hops, 'BFS hops must be <= DFS hops');
  assert.ok(resBfs.hops <= resBkt.hops, 'BFS hops must be <= Backtracking hops');
});

test('Auto-Solve - Backtracking yields VISIT and BACKTRACK events correctly removing dead ends', () => {
  const rng = new Rng('backtrack_trail_check');
  const grid = new Grid(15, 15, true);
  drain(GENERATORS.bkt.generate(grid, rng));

  const solver = getSolver('bkt');
  const iter = solver.solve(grid, { weighted: false });

  const activeTrail = [grid.start];
  let backtrackCount = 0;
  let visitCount = 0;

  for (const step of iter) {
    if (step.t === 'VISIT') {
      visitCount++;
      if (!activeTrail.includes(step.cell)) {
        activeTrail.push(step.cell);
      }
    } else if (step.t === 'BACKTRACK') {
      backtrackCount++;
      // Dead end removal
      const idx = activeTrail.lastIndexOf(step.cell);
      assert.ok(idx >= 0, `Backtracked cell ${step.cell} must be present in active trail to be removed`);
      activeTrail.splice(idx, 1);
    }
  }

  // Backtracking must have visited cells and backtracked from at least one dead end in a 15x15 maze
  assert.ok(visitCount > 10, 'Must visit multiple cells');
  assert.ok(backtrackCount >= 1, 'Must encounter dead ends and backtrack');
  assert.equal(activeTrail[activeTrail.length - 1], grid.end, 'Final active trail must lead to maze exit');
});

test('ClassicMazeRenderer - getThemeColors provides distinct palettes for sheet, cyber, jungle', async () => {
  const { ClassicMazeRenderer } = await import('../../src/ui/renderer/classic_renderer.js');
  const renderer = new ClassicMazeRenderer(null);

  const themes = ['sheet', 'cyber', 'jungle'];
  const palettes = new Set();

  for (const th of themes) {
    renderer.setTheme(th);
    const colors = renderer.getThemeColors();
    assert.ok(colors.bg, `Theme ${th} must define canvas bg`);
    assert.ok(colors.mazeBg, `Theme ${th} must define mazeBg`);
    assert.ok(colors.wallColor, `Theme ${th} must define wallColor`);
    assert.ok(colors.pathBoxFill, `Theme ${th} must define pathBoxFill`);
    assert.ok(colors.pathBoxBorder, `Theme ${th} must define pathBoxBorder`);
    assert.ok(colors.headFill, `Theme ${th} must define headFill`);
    palettes.add(colors.pathBoxFill);
  }

  // All 3 themes must have distinct path-finding box colors
  assert.equal(palettes.size, 3, 'All 3 themes must have unique path box colors');
});

test('ClassicMazeRenderer - setPlayer retracts trail when player gets back/backtracks from a covered path', async () => {
  const { ClassicMazeRenderer } = await import('../../src/ui/renderer/classic_renderer.js');
  const renderer = new ClassicMazeRenderer(null);

  // Fake minimal grid
  renderer.grid = {
    cols: 5,
    rows: 5,
    size: 25,
    start: 0,
    end: 24,
    colOf: (c) => c % 5,
    rowOf: (c) => Math.floor(c / 5)
  };
  renderer.playerTrail = [0];

  // Move forward: 0 -> 1 -> 2 -> 3 (dead end branch)
  renderer.setPlayer(1);
  renderer.setPlayer(2);
  renderer.setPlayer(3);
  assert.deepEqual(renderer.playerTrail, [0, 1, 2, 3], 'Trail extends as player advances');

  // Player gets back from dead-end 3 to 2: 3 must be removed
  renderer.setPlayer(2);
  assert.deepEqual(renderer.playerTrail, [0, 1, 2], 'Dead-end cell 3 removed when stepping back to 2');

  // Player gets back from 2 to 1: 2 must be removed
  renderer.setPlayer(1);
  assert.deepEqual(renderer.playerTrail, [0, 1], 'Cell 2 removed when stepping back to 1');

  // Player takes alternative route from 1 to 6
  renderer.setPlayer(6);
  assert.deepEqual(renderer.playerTrail, [0, 1, 6], 'New branch continues cleanly without previous dead-end markers');
});

