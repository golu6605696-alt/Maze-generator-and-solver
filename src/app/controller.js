/**
 * @file controller.js
 * Central application controller orchestrating generators, solvers, animator,
 * canvas renderer, and UI event subscriptions.
 *
 * Complexity: O(1) state orchestration per event.
 */

import { Grid } from '../core/grid.js';
import { SeededRNG } from '../structures/rng.js';
import {
  RecursiveBacktracker,
  RandomizedPrims,
  RandomizedKruskals,
  braidMaze,
  RecursiveDivision,
  Wilsons,
} from '../core/generators/index.js';
import {
  BFS,
  AStar,
  DFS,
  Dijkstra,
  WallFollower,
  DeadEndFilling,
} from '../core/solvers/index.js';
import { MazeAnalyzer } from '../core/analyzer.js';
import { Animator, ANIMATOR_STATES } from './animator.js';
import { BenchmarkRunner } from './benchmark.js';
import { MazeIO } from './maze_io.js';
import { STEP_TYPES } from '../core/step.js';

export const CONTROLLER_STATES = Object.freeze({
  IDLE: 'IDLE',
  GENERATING: 'GENERATING',
  SOLVING: 'SOLVING',
  PAUSED: 'PAUSED',
});

export class Controller {
  /**
   * @param {object} [options={}]
   * @param {import('../ui/renderer.js').CanvasRenderer} [options.renderer]
   * @param {number} [options.initialSize=25]
   * @param {number} [options.initialSpeed=50]
   */
  constructor(options = {}) {
    this.renderer = options.renderer ?? null;
    this.animator = new Animator({ speed: options.initialSpeed ?? 50 });

    this.generators = {
      backtracker: new RecursiveBacktracker(),
      prim: new RandomizedPrims(),
      kruskal: new RandomizedKruskals(),
      division: new RecursiveDivision(),
      wilson: new Wilsons(),
    };

    this.solvers = {
      bfs: new BFS(),
      astar: new AStar(),
      dijkstra: new Dijkstra(),
      dfs: new DFS(),
      wall_follower: new WallFollower(),
      dead_end: new DeadEndFilling(),
    };
    this.benchmarkRunner = new BenchmarkRunner(Object.values(this.solvers));
    this.isEditMode = false;

    this._state = CONTROLLER_STATES.IDLE;
    this._previousActiveState = CONTROLLER_STATES.IDLE;
    this._size = options.initialSize ?? 25;
    this._seed = '';
    this._grid = new Grid(this._size, this._size);

    this._stats = {
      algorithm: '-',
      visitedCount: 0,
      pathLength: 0,
      cost: 0,
      timeMs: 0,
      status: 'Ready',
    };

    this._stateListeners = [];
    this._statsListeners = [];

    if (this.renderer) {
      this.renderer.setGrid(this._grid);
    }
  }

  get state() {
    return this._state;
  }

  get grid() {
    return this._grid;
  }

  get stats() {
    return { ...this._stats };
  }

  get size() {
    return this._size;
  }

  /**
   * Subscribes to application state changes.
   * @param {Function} listener
   */
  onStateChange(listener) {
    this._stateListeners.push(listener);
  }

  /**
   * Subscribes to statistics / status changes.
   * @param {Function} listener
   */
  onStatsUpdate(listener) {
    this._statsListeners.push(listener);
  }

  /**
   * Emits state changes to all subscribers.
   * @private
   */
  _setState(newState) {
    this._state = newState;
    for (const listener of this._stateListeners) {
      listener(newState);
    }
  }

  /**
   * Emits updated run metrics.
   * @private
   */
  _updateStats(patch) {
    this._stats = { ...this._stats, ...patch };
    for (const listener of this._statsListeners) {
      listener(this._stats);
    }
  }

  /**
   * Generates a new maze on the grid.
   *
   * @param {string} [algorithmKey='backtracker']
   * @param {number} [size=this._size]
   * @param {number|string} [seed]
   */
  generate(algorithmKey = 'backtracker', size = this._size, seed = '') {
    this.animator.cancel();

    this._size = Math.max(5, Math.min(100, Number(size) || 25));
    this._seed = seed;
    this._grid = new Grid(this._size, this._size);

    if (this.renderer) {
      this.renderer.setGrid(this._grid);
    }

    const generator = this.generators[algorithmKey] || this.generators.backtracker;
    const rng = seed !== '' && seed !== null && seed !== undefined
      ? new SeededRNG(seed)
      : new SeededRNG();

    this._setState(CONTROLLER_STATES.GENERATING);
    this._updateStats({
      algorithm: generator.name,
      visitedCount: 0,
      pathLength: 0,
      cost: 0,
      timeMs: 0,
      status: `Generating with ${generator.name}...`,
    });

    // Run headless generation to collect all Step animation events
    const steps = generator.generate(this._grid, rng);

    // Prepare fresh grid for visible carving replay
    this._grid.resetWalls();
    if (this.renderer) {
      this.renderer.render();
    }

    this.animator.play(
      steps,
      (step) => {
        if (step.type === STEP_TYPES.CARVE && step.extra?.from) {
          this._grid.removeWall(step.extra.from, step.cell);
        }
        if (this.renderer) {
          this.renderer.setCellState(step.cell.row, step.cell.col, step.type);
          this.renderer.setCurrentHead(step.cell.row, step.cell.col);
          this.renderer.render();
        }
      },
      () => {
        if (this.renderer) {
          this.renderer.setCurrentHead(null, null);
          this.renderer.render();
        }
        this._setState(CONTROLLER_STATES.IDLE);
        this._updateStats({ status: `Maze generated (${this._size}x${this._size})` });
      }
    );
  }

  /**
   * Solves the current maze.
   *
   * @param {string} [algorithmKey='bfs']
   */
  solve(algorithmKey = 'bfs') {
    if (this._state !== CONTROLLER_STATES.IDLE) return;

    this.animator.cancel();
    if (this.renderer) {
      this.renderer.clearOverlays();
    }

    const solver = this.solvers[algorithmKey] || this.solvers.bfs;
    this._setState(CONTROLLER_STATES.SOLVING);
    this._updateStats({
      algorithm: solver.name,
      status: `Solving with ${solver.name}...`,
    });

    // Headless solve execution
    const result = solver.solve(this._grid);

    this.animator.play(
      result.steps,
      (step) => {
        if (this.renderer) {
          this.renderer.setCellState(step.cell.row, step.cell.col, step.type);
          if (step.type !== STEP_TYPES.PATH) {
            this.renderer.setCurrentHead(step.cell.row, step.cell.col);
          }
          this.renderer.render();
        }
      },
      () => {
        if (this.renderer) {
          this.renderer.setCurrentHead(null, null);
          this.renderer.render();
        }
        this._setState(CONTROLLER_STATES.IDLE);
        this._updateStats({
          algorithm: solver.name,
          visitedCount: result.visitedCount,
          pathLength: result.pathLength,
          cost: result.cost,
          timeMs: Math.round(result.timeMs * 100) / 100,
          status: result.found ? 'Path found!' : 'No path found',
        });
      }
    );
  }

  /**
   * Pauses active animation.
   */
  pause() {
    if (this._state === CONTROLLER_STATES.GENERATING || this._state === CONTROLLER_STATES.SOLVING) {
      this._previousActiveState = this._state;
      this.animator.pause();
      this._setState(CONTROLLER_STATES.PAUSED);
      this._updateStats({ status: 'Paused' });
    }
  }

  /**
   * Resumes paused animation.
   */
  resume() {
    if (this._state === CONTROLLER_STATES.PAUSED) {
      this._setState(this._previousActiveState);
      this.animator.resume();
      this._updateStats({ status: 'Running...' });
    }
  }

  /**
   * Advances one step while paused.
   */
  step() {
    if (this._state === CONTROLLER_STATES.PAUSED) {
      this.animator.step();
    }
  }

  /**
   * Resets animation and clears visual overlays.
   */
  reset() {
    this.animator.cancel();
    if (this.renderer) {
      this.renderer.clearOverlays();
    }
    this._setState(CONTROLLER_STATES.IDLE);
    this._updateStats({
      visitedCount: 0,
      pathLength: 0,
      cost: 0,
      timeMs: 0,
      status: 'Reset complete',
    });
  }

  /**
   * Updates playback speed slider setting.
   *
   * @param {number} speed
   */
  setSpeed(speed) {
    this.animator.setSpeed(speed);
  }

  /**
   * Transforms current maze into a braid maze by eliminating dead ends.
   *
   * @param {number} [rate=0.5]
   */
  braid(rate = 0.5) {
    if (this._state !== CONTROLLER_STATES.IDLE) return;

    const steps = braidMaze(this._grid, rate);
    if (steps.length === 0) {
      this._updateStats({ status: 'No dead ends to braid' });
      return;
    }

    if (this.renderer) {
      this.renderer.render();
    }

    this._updateStats({ status: `Braid mode applied: removed ${steps.length} dead ends` });
  }

  /**
   * Compares all solvers on independent copies of the current grid.
   *
   * @returns {Array<object>}
   */
  compareAll() {
    if (this._state !== CONTROLLER_STATES.IDLE) return [];
    return this.benchmarkRunner.compare(this._grid);
  }

  /**
   * Exports current maze state as JSON string or file download.
   *
   * @param {boolean} [triggerDownload=false]
   * @returns {string}
   */
  saveMaze(triggerDownload = false) {
    if (triggerDownload) {
      MazeIO.download(this._grid, this._seed);
    }
    return MazeIO.serialize(this._grid, this._seed);
  }

  /**
   * Loads a maze from JSON string or object.
   *
   * @param {string|object} jsonInput
   */
  loadMaze(jsonInput) {
    this.animator.cancel();
    const newGrid = MazeIO.deserialize(jsonInput);
    this._grid = newGrid;
    this._size = newGrid.rows;

    if (this.renderer) {
      this.renderer.setGrid(this._grid);
    }

    this._setState(CONTROLLER_STATES.IDLE);
    this._updateStats({
      visitedCount: 0,
      pathLength: 0,
      cost: 0,
      timeMs: 0,
      status: `Loaded maze (${this._grid.rows}x${this._grid.cols})`,
    });
  }

  /**
   * Handles user interaction for manual editing (toggling walls or cycling weights).
   *
   * @param {number} canvasX
   * @param {number} canvasY
   * @param {boolean} [isSecondary=false] - Right click or modifier key
   */
  handleCanvasClick(canvasX, canvasY, isSecondary = false) {
    if (this._state !== CONTROLLER_STATES.IDLE || !this.renderer) return;

    const hit = this.renderer.cellAtPoint(canvasX, canvasY);
    if (!hit) return;

    if (isSecondary) {
      // Cycle cell terrain weight
      this.renderer.cycleWeight(hit.row, hit.col);
      this._updateStats({ status: `Cell (${hit.row}, ${hit.col}) weight: ${hit.cell.weight}` });
    } else if (hit.isNearBorder && hit.wallDir) {
      // Toggle wall
      const toggled = this.renderer.toggleWall(hit.row, hit.col, hit.wallDir);
      if (toggled) {
        this.renderer.clearOverlays();
        this._updateStats({ status: `Toggled wall at (${hit.row}, ${hit.col})` });
      }
    } else {
      // Clicked cell interior: cycle weight
      this.renderer.cycleWeight(hit.row, hit.col);
      this._updateStats({ status: `Cell (${hit.row}, ${hit.col}) weight: ${hit.cell.weight}` });
    }
  }

  /**
   * Evaluates topological metrics and difficulty score of current maze.
   *
   * @returns {object}
   */
  analyze() {
    return MazeAnalyzer.analyze(this._grid);
  }

  /**
   * Runs a race between two solvers, returning a comparison breakdown.
   *
   * @param {string} [solverKeyA='bfs']
   * @param {string} [solverKeyB='astar']
   * @returns {{solverA: object, solverB: object, winner: string, reason: string}}
   */
  race(solverKeyA = 'bfs', solverKeyB = 'astar') {
    const sA = this.solvers[solverKeyA] || this.solvers.bfs;
    const sB = this.solvers[solverKeyB] || this.solvers.astar;

    const resA = sA.solve(this._grid.clone());
    const resB = sB.solve(this._grid.clone());

    let winner = 'Tie';
    let reason = 'Equal efficiency';

    if (resA.visitedCount < resB.visitedCount) {
      winner = sA.name;
      reason = `Explored fewer cells (${resA.visitedCount} vs ${resB.visitedCount})`;
    } else if (resB.visitedCount < resA.visitedCount) {
      winner = sB.name;
      reason = `Explored fewer cells (${resB.visitedCount} vs ${resA.visitedCount})`;
    } else if (resA.timeMs < resB.timeMs) {
      winner = sA.name;
      reason = `Faster compute time (${resA.timeMs.toFixed(2)}ms vs ${resB.timeMs.toFixed(2)}ms)`;
    } else if (resB.timeMs < resA.timeMs) {
      winner = sB.name;
      reason = `Faster compute time (${resB.timeMs.toFixed(2)}ms vs ${resA.timeMs.toFixed(2)}ms)`;
    }

    return {
      solverA: { name: sA.name, visited: resA.visitedCount, pathLength: resA.pathLength, timeMs: resA.timeMs },
      solverB: { name: sB.name, visited: resB.visitedCount, pathLength: resB.pathLength, timeMs: resB.timeMs },
      winner,
      reason,
    };
  }
}
