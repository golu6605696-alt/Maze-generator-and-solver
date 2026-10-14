/**
 * @file duel_controller.js
 * 2-Player Local Same-Keyboard Race Duel Controller.
 * Player 1 (Blue Scout) uses WASD.
 * Player 2 (Red Scout) uses Arrow Keys.
 * First explorer to reach the golden exit wins the match!
 */

import { buildMaze } from '../core/pipeline.js';
import { updateFog } from '../core/fog.js';
import { Wall } from '../core/constants.js';

export const DuelState = Object.freeze({
  READY: 'READY',
  RACING: 'RACING',
  FINISHED: 'FINISHED',
});

export class DuelController {
  /**
   * @param {object} callbacks
   * @param {(data: object) => void} callbacks.onUpdate
   * @param {(sound: string) => void} [callbacks.onSound]
   */
  constructor(callbacks) {
    this._onUpdate = callbacks.onUpdate;
    this._onSound = callbacks.onSound || (() => {});

    this.state = DuelState.READY;
    this.code = '';
    this.grid = null;
    this.relics = [];
    this.fog = null;

    // Player 1 (Blue)
    this.p1 = {
      id: 1,
      name: 'Player 1 (Blue)',
      cell: 0,
      heading: Wall.E,
      steps: 0,
      bumps: 0,
      relics: 0,
      color: '#38bdf8',
      trail: [],
    };

    // Player 2 (Red)
    this.p2 = {
      id: 2,
      name: 'Player 2 (Red)',
      cell: 0,
      heading: Wall.E,
      steps: 0,
      bumps: 0,
      relics: 0,
      color: '#f43f5e',
      trail: [],
    };

    this.winner = null;
    this.startTime = 0;
    this.elapsedSeconds = 0;
    this._timerInterval = null;
  }

  load(code = 'v1/21x21/bkt/DUEL1/b20/t10/srv') {
    this.code = code;
    const { grid, relics } = buildMaze(code);
    this.grid = grid;
    this.relics = relics;

    this.p1.cell = grid.start;
    this.p1.heading = Wall.E;
    this.p1.steps = 0;
    this.p1.bumps = 0;
    this.p1.relics = 0;
    this.p1.trail = [grid.start];

    this.p2.cell = grid.start;
    this.p2.heading = Wall.E;
    this.p2.steps = 0;
    this.p2.bumps = 0;
    this.p2.relics = 0;
    this.p2.trail = [grid.start];

    this.fog = new Uint8Array(grid.size);
    // Combine fog for both players
    updateFog(this.grid, this.p1.cell, 5, this.fog);
    updateFog(this.grid, this.p2.cell, 5, this.fog);

    this.winner = null;
    this.state = DuelState.READY;
    this._notify();
  }

  start() {
    if (this.state !== DuelState.READY) return;
    this.state = DuelState.RACING;
    this.startTime = performance.now();
    this.elapsedSeconds = 0;
    this._startTimer();
    this._onSound('click');
    this._notify();
  }

  moveP1(dir) {
    if (this.state !== DuelState.RACING) return;
    this._applyMove(this.p1, dir);
  }

  moveP2(dir) {
    if (this.state !== DuelState.RACING) return;
    this._applyMove(this.p2, dir);
  }

  _applyMove(player, dir) {
    player.heading = dir;

    // Check wall
    if (this.grid.hasWall(player.cell, dir)) {
      player.bumps++;
      this._onSound('thud');
      this._notify();
      return;
    }

    const nextCell = this.grid.neighbor(player.cell, dir);
    if (nextCell === -1) {
      player.bumps++;
      this._onSound('thud');
      this._notify();
      return;
    }

    player.cell = nextCell;
    player.steps++;
    player.trail.push(nextCell);
    if (player.trail.length > 30) player.trail.shift();

    // Check relic pickup
    const relicIdx = this.relics.findIndex(r => r.cell === nextCell);
    if (relicIdx !== -1) {
      this.relics.splice(relicIdx, 1);
      player.relics++;
      this._onSound('relic');
    }

    // Update fog
    updateFog(this.grid, this.p1.cell, 5, this.fog);
    updateFog(this.grid, this.p2.cell, 5, this.fog);

    // Check victory condition
    if (nextCell === this.grid.end) {
      this.winner = player;
      this.state = DuelState.FINISHED;
      this._stopTimer();
      this._onSound('win');
    } else {
      this._onSound('step');
    }

    this._notify();
  }

  _startTimer() {
    this._stopTimer();
    this._timerInterval = setInterval(() => {
      this.elapsedSeconds += 0.1;
      this._notify();
    }, 100);
    if (this._timerInterval?.unref) this._timerInterval.unref();
  }

  _stopTimer() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  }

  destroy() {
    this._stopTimer();
  }

  _notify() {
    if (this._onUpdate) {
      this._onUpdate({
        state: this.state,
        code: this.code,
        grid: this.grid,
        fog: this.fog,
        relics: this.relics,
        p1: this.p1,
        p2: this.p2,
        winner: this.winner,
        elapsedSeconds: this.elapsedSeconds,
      });
    }
  }
}
