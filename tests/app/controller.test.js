import test from 'node:test';
import assert from 'node:assert/strict';
import { Controller, CONTROLLER_STATES } from '../../src/app/controller.js';

test('Controller - initializes in IDLE state with default grid and stats', () => {
  const controller = new Controller({ initialSize: 10, initialSpeed: 100 });
  assert.equal(controller.state, CONTROLLER_STATES.IDLE);
  assert.equal(controller.size, 10);
  assert.equal(controller.grid.rows, 10);
  assert.equal(controller.grid.cols, 10);
  assert.equal(controller.stats.status, 'Ready');
});

test('Controller - generates maze and notifies state and stats subscribers', (t, done) => {
  const controller = new Controller({ initialSize: 6, initialSpeed: 100 });
  const states = [];

  controller.onStateChange((state) => states.push(state));

  controller.generate('backtracker', 6, 12345);

  setTimeout(() => {
    assert.equal(controller.state, CONTROLLER_STATES.IDLE);
    assert.ok(states.includes(CONTROLLER_STATES.GENERATING));
    assert.ok(controller.stats.status.includes('Maze generated'));
    done();
  }, 40);
});

test('Controller - solves current maze and collects metrics', (t, done) => {
  const controller = new Controller({ initialSize: 8, initialSpeed: 100 });

  controller.generate('kruskal', 8, 999);

  setTimeout(() => {
    controller.solve('bfs');

    setTimeout(() => {
      assert.equal(controller.state, CONTROLLER_STATES.IDLE);
      assert.equal(controller.stats.algorithm, 'BFS');
      assert.ok(controller.stats.visitedCount > 0);
      assert.ok(controller.stats.pathLength > 0);
      assert.ok(controller.stats.cost > 0);
      assert.equal(controller.stats.status, 'Path found!');
      done();
    }, 40);
  }, 40);
});

test('Controller - reset clears animation and resets stats', () => {
  const controller = new Controller({ initialSize: 10 });
  controller.reset();
  assert.equal(controller.state, CONTROLLER_STATES.IDLE);
  assert.equal(controller.stats.pathLength, 0);
  assert.equal(controller.stats.status, 'Reset complete');
});

test('Controller - analyze returns topological metrics for current grid', (t, done) => {
  const controller = new Controller({ initialSize: 10, initialSpeed: 100 });
  controller.generate('backtracker', 10, 42);

  setTimeout(() => {
    const metrics = controller.analyze();
    assert.equal(metrics.totalCells, 100);
    assert.ok(metrics.deadEnds >= 2);
    assert.ok(metrics.difficultyScore >= 1 && metrics.difficultyScore <= 100);
    done();
  }, 50);
});

test('Controller - race compares two solvers on identical grid copy', (t, done) => {
  const controller = new Controller({ initialSize: 12, initialSpeed: 100 });
  controller.generate('prim', 12, 100);

  setTimeout(() => {
    const result = controller.race('bfs', 'astar');
    assert.ok(result.solverA);
    assert.ok(result.solverB);
    assert.equal(result.solverA.name, 'BFS');
    assert.equal(result.solverB.name, 'A*');
    assert.ok(result.winner);
    assert.ok(result.reason);
    done();
  }, 50);
});


