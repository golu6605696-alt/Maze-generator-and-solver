/**
 * @file lab_controller.js
 * Cartographer Lab controller for algorithmic visualization, generation, solving,
 * multi-solver race, interactive editing, and benchmarks.
 */

import { Grid } from '../core/grid.js';
import { Rng } from '../structures/rng.js';
import { formatCode, parseCode, randomSeed } from '../core/code.js';
import { getGenerator } from '../core/generators/index.js';
import { getSolver, SOLVERS } from '../core/solvers/index.js';
import { validate } from '../core/validate.js';
import { braid } from '../core/braid.js';
import { assignTerrain } from '../core/terrain.js';
import { PlaybackTicker, PlaybackState } from './playback_ticker.js';
import { EventLog } from './event_log.js';

export class LabController {
  /**
   * @param {object} callbacks
   * @param {(state: object) => void} callbacks.onUpdate
   * @param {(event: object) => void} [callbacks.onEvent]
   * @param {(sound: string) => void} [callbacks.onSound]
   */
  constructor(callbacks) {
    this._onUpdate = callbacks.onUpdate;
    this._onEvent = callbacks.onEvent || (() => {});
    this._onSound = callbacks.onSound || (() => {});

    this.rows = 25;
    this.cols = 25;
    this.generatorId = 'bkt';
    this.solverId = 'ast';
    this.seed = randomSeed();
    this.braidPct = 0;
    this.terrainPct = 0;
    this.heatMode = 'order'; // 'order' | 'frequency'

    this.grid = new Grid(this.rows, this.cols, true);
    this.eventLog = new EventLog();
    this.validation = validate(this.grid);

    this.activeMode = 'IDLE'; // 'GENERATING' | 'SOLVING' | 'RACE' | 'IDLE' | 'EDIT'
    this.lastResult = null;
    this.raceResults = [];

    this.ticker = new PlaybackTicker({
      getIterator: () => this._createActiveIterator(),
      onStep: (event) => this._handleStep(event),
      onDone: (result) => this._handleDone(result),
      onStateChange: () => this._notify(),
    });

    this.generate();
  }

  get code() {
    return formatCode({
      version: 'v1',
      rows: this.rows,
      cols: this.cols,
      generator: this.generatorId,
      seed: this.seed,
      braidPct: this.braidPct,
      terrainPct: this.terrainPct,
    });
  }

  loadCode(codeStr) {
    const parsed = parseCode(codeStr);
    this.rows = parsed.rows;
    this.cols = parsed.cols;
    this.generatorId = parsed.generator;
    this.seed = parsed.seed;
    this.braidPct = parsed.braidPct;
    this.terrainPct = parsed.terrainPct;
    this.generate();
  }

  /**
   * Starts generating the maze.
   */
  generate() {
    this.ticker.reset();
    this.eventLog.clear();
    this.grid = new Grid(this.rows, this.cols, true);
    this.activeMode = 'GENERATING';
    this.lastResult = null;
    this.raceResults = [];
    this.validation = validate(this.grid);
    this._notify();
    this.ticker.play();
  }

  /**
   * Starts solving the current maze.
   * @param {string} [solverId]
   */
  solve(solverId) {
    if (solverId) this.solverId = solverId;
    this.ticker.reset();
    this.eventLog.clear();
    this.activeMode = 'SOLVING';
    this.lastResult = null;
    this._notify();
    this.ticker.play();
  }

  /**
   * Runs multi-solver race in lockstep across 2-4 solvers.
   * @param {string[]} [solverIds]
   */
  race(solverIds = ['dfs', 'bfs', 'dij', 'ast']) {
    this.ticker.reset();
    this.eventLog.clear();
    this.activeMode = 'RACE';
    this.raceSolvers = solverIds.map(id => ({
      id,
      solver: getSolver(id),
      iterator: getSolver(id).solve(this.grid, { weighted: true }),
      done: false,
      result: null,
      ticks: 0,
      expanded: 0,
    }));
    this._notify();
    this.ticker.play();
  }

  _createActiveIterator() {
    if (this.activeMode === 'GENERATING') {
      const rng = new Rng(this.seed);
      const gen = getGenerator(this.generatorId);
      const self = this;

      return (function* () {
        const it = gen.generate(self.grid, rng);
        let res = it.next();
        while (!res.done) {
          yield res.value;
          res = it.next();
        }

        // After generation, apply braid and terrain if set
        if (self.braidPct > 0) {
          braid(self.grid, self.braidPct, rng);
        }
        if (self.terrainPct > 0) {
          assignTerrain(self.grid, self.terrainPct, rng);
        }

        return res.value;
      })();
    } else if (this.activeMode === 'SOLVING') {
      const solver = getSolver(this.solverId);
      return solver.solve(this.grid, { weighted: true });
    } else if (this.activeMode === 'RACE') {
      const self = this;
      return (function* () {
        let activeCount = self.raceSolvers.length;
        while (activeCount > 0) {
          for (const s of self.raceSolvers) {
            if (!s.done) {
              const res = s.iterator.next();
              s.ticks++;
              if (res.done) {
                s.done = true;
                s.result = res.value;
                activeCount--;
              } else {
                if (res.value.t === 'VISIT') s.expanded++;
                yield { t: 'RACE_STEP', solverId: s.id, event: res.value };
              }
            }
          }
        }
        return self.raceSolvers.map(s => s.result);
      })();
    }
    return (function* () {})();
  }

  _handleStep(event) {
    this.eventLog.push(event);
    this._onEvent(event);
  }

  _handleDone(result) {
    this.lastResult = result;
    this.validation = validate(this.grid);
    this._onSound('click');
    this._notify();
  }

  /**
   * Toggles a wall between adjacent cells a and b in editor mode.
   * @param {number} a
   * @param {number} b
   */
  toggleWall(a, b) {
    const dir = this.grid.directionTo(a, b);
    if (!dir) return;

    if (this.grid.hasWall(a, dir)) {
      this.grid.carve(a, b);
    } else {
      this.grid.build(a, b);
    }
    this.validation = validate(this.grid);
    this._notify();
  }

  /**
   * Sets start or end cell in editor mode.
   * @param {'start'|'end'} which
   * @param {number} cell
   */
  setEndpoint(which, cell) {
    if (cell < 0 || cell >= this.grid.size) return;
    if (which === 'start' && cell !== this.grid.end) {
      this.grid.start = cell;
    } else if (which === 'end' && cell !== this.grid.start) {
      this.grid.end = cell;
    }
    this.validation = validate(this.grid);
    this._notify();
  }

  /**
   * Paints terrain on a cell in editor mode.
   * @param {number} cell
   * @param {number} terrainType
   */
  paintTerrain(cell, terrainType) {
    if (cell >= 0 && cell < this.grid.size) {
      this.grid.terrain[cell] = terrainType;
      this._notify();
    }
  }

  _notify() {
    if (this._onUpdate) {
      this._onUpdate({
        rows: this.rows,
        cols: this.cols,
        generatorId: this.generatorId,
        solverId: this.solverId,
        seed: this.seed,
        braidPct: this.braidPct,
        terrainPct: this.terrainPct,
        code: this.code,
        grid: this.grid,
        activeMode: this.activeMode,
        tickerState: this.ticker.state,
        speed: this.ticker.speed,
        heatMode: this.heatMode,
        validation: this.validation,
        lastResult: this.lastResult,
        raceSolvers: this.raceSolvers,
      });
    }
  }
}
