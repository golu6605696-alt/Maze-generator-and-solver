/**
 * @file expedition_controller.js
 * Game controller for playable Expedition Mode.
 * Manages scout movement, stamina budget, terrain costs, relic pickups, phantoms, fog, and scoring.
 * Defined in ARCHITECTURE.md section 5.2 and RULES.md section 1.
 */

import { buildMaze } from '../core/pipeline.js';
import { updateFog } from '../core/fog.js';
import { computeScore } from '../core/scoring.js';
import { buildPhantoms } from '../core/phantoms.js';
import { DIFFICULTIES, RelicKind, TerrainType, RUBBLE_COST, Wall } from '../core/constants.js';

export const ExpeditionState = Object.freeze({
  BRIEFING: 'BRIEFING',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  WON: 'WON',
  LOST: 'LOST',
});

export class ExpeditionController {
  /**
   * @param {object} callbacks
   * @param {(state: object) => void} callbacks.onUpdate
   * @param {(sound: string) => void} [callbacks.onSound]
   */
  constructor(callbacks) {
    this._onUpdate = callbacks.onUpdate;
    this._onSound = callbacks.onSound || (() => {});

    this.state = ExpeditionState.BRIEFING;
    this.code = '';
    this.grid = null;
    this.relics = [];
    this.phantoms = [];
    this.fog = null;

    this.scoutCell = 0;
    this.heading = Wall.E;
    this.budget = 0;
    this.spent = 0;
    this.bumps = 0;
    this.ticks = 0;
    this.moveCount = 0;
    this.movesString = '';

    this.relicsCollected = 0;
    this.activeRationBonus = 0;
    this.oilMovesRemaining = 0;
    this.compassMovesRemaining = 0;
    this.baseLanternRadius = 5;

    this.startTime = 0;
    this.elapsedSeconds = 0;
    this._timerInterval = null;

    this.distinctCells = new Set();
    this.revisitCount = 0;
    this.scoreReport = null;
  }

  /**
   * Initializes or loads an expedition with a given Expedition Code.
   * @param {string} code
   */
  load(code) {
    this.code = code;
    const { grid, relics, optCost, optPath, parsed } = buildMaze(code);
    this.grid = grid;
    this.relics = relics;
    this.optCost = optCost;
    this.optPath = optPath;
    this.optPathLength = optPath.length;

    const diff = parsed.difficulty || 'srv';
    this.difficulty = diff;
    const diffSpec = DIFFICULTIES[diff] || DIFFICULTIES.srv;

    this.baseLanternRadius = diffSpec.radius;
    this.budget = Math.ceil(this.optCost * diffSpec.slack);
    this.spent = 0;
    this.bumps = 0;
    this.ticks = 0;
    this.moveCount = 0;
    this.movesString = '';
    this.relicsCollected = 0;
    this.oilMovesRemaining = 0;
    this.compassMovesRemaining = 0;

    this.scoutCell = grid.start;
    this.heading = Wall.E;
    this.distinctCells.clear();
    this.distinctCells.add(this.scoutCell);
    this.revisitCount = 0;

    // Build phantoms
    this.phantoms = buildPhantoms(this.grid, diffSpec.phantoms);

    // Init fog array
    this.fog = new Uint8Array(this.grid.size);
    updateFog(this.grid, this.scoutCell, this.lanternRadius, this.fog);

    this.state = ExpeditionState.BRIEFING;
    this._notify();
  }

  get lanternRadius() {
    return this.baseLanternRadius + (this.oilMovesRemaining > 0 ? 2 : 0);
  }

  get remainingStamina() {
    return Math.max(0, this.budget - this.spent);
  }

  /**
   * Starts active play.
   */
  start() {
    if (this.state !== ExpeditionState.BRIEFING) return;
    this.state = ExpeditionState.PLAYING;
    this.startTime = performance.now();
    this.elapsedSeconds = 0;
    this._startTimer();
    this._onSound('click');
    this._notify();
  }

  pause() {
    if (this.state === ExpeditionState.PLAYING) {
      this.state = ExpeditionState.PAUSED;
      this._stopTimer();
      this._notify();
    }
  }

  resume() {
    if (this.state === ExpeditionState.PAUSED) {
      this.state = ExpeditionState.PLAYING;
      this._startTimer();
      this._notify();
    }
  }

  /**
   * Applies player movement in direction `dir` (Wall.N, Wall.E, Wall.S, Wall.W).
   * @param {number} dir
   * @param {string} dirKey 'N' | 'E' | 'S' | 'W'
   */
  move(dir, dirKey) {
    if (this.state !== ExpeditionState.PLAYING) return;

    this.heading = dir;

    // 1. Check if wall blocks move
    if (this.grid.hasWall(this.scoutCell, dir)) {
      this.bumps++;
      this._onSound('thud');
      this._notify();
      return;
    }

    const nextCell = this.grid.neighbor(this.scoutCell, dir);
    if (nextCell === -1) {
      this.bumps++;
      this._onSound('thud');
      this._notify();
      return;
    }

    // 2. Ruin crumbling: if current cell is RUINS, turn it into RUBBLE as scout leaves
    if (this.grid.terrain[this.scoutCell] === TerrainType.RUINS) {
      this.grid.terrain[this.scoutCell] = RUBBLE_COST; // 6
    }

    // 3. Enter next cell and charge stamina
    const cellWeight = this.grid.weightAt(nextCell);
    this.spent += cellWeight;
    this.ticks += cellWeight;
    this.moveCount++;
    this.movesString += dirKey;

    if (this.distinctCells.has(nextCell)) {
      this.revisitCount++;
    } else {
      this.distinctCells.add(nextCell);
    }

    this.scoutCell = nextCell;

    // 4. Update buffs
    if (this.oilMovesRemaining > 0) this.oilMovesRemaining--;
    if (this.compassMovesRemaining > 0) this.compassMovesRemaining--;

    // 5. Check relic collection
    const relicIdx = this.relics.findIndex(r => r.cell === nextCell);
    if (relicIdx !== -1) {
      const collected = this.relics.splice(relicIdx, 1)[0];
      this.relicsCollected++;
      this._onSound('relic');

      if (collected.kind === RelicKind.RATION) {
        this.budget += 6;
      } else if (collected.kind === RelicKind.LANTERN_OIL) {
        this.oilMovesRemaining = 25;
      } else if (collected.kind === RelicKind.COMPASS) {
        this.compassMovesRemaining = 15;
      }
    } else {
      this._onSound('step');
    }

    // 6. Update fog
    updateFog(this.grid, this.scoutCell, this.lanternRadius, this.fog);

    // 7. Check win / loss condition
    // Invariant: Landing on exit with spent <= budget wins
    if (this.scoutCell === this.grid.end) {
      if (this.spent <= this.budget) {
        this._resolve(true);
        return;
      }
    }

    if (this.spent >= this.budget && this.scoutCell !== this.grid.end) {
      this._resolve(false);
      return;
    }

    this._notify();
  }

  _resolve(won) {
    this._stopTimer();
    this.state = won ? ExpeditionState.WON : ExpeditionState.LOST;

    // Reveal entire map on resolution
    this.fog.fill(2); // VISIBLE

    // Count beaten phantoms
    let phantomsBeaten = 0;
    for (const ph of this.phantoms) {
      if (won) {
        if (ph.status === 'LOST' || this.ticks < ph.finishTick) {
          phantomsBeaten++;
        }
      }
    }

    this.scoreReport = computeScore({
      optCost: this.optCost,
      playerCost: this.spent,
      L: this.optPathLength,
      D: this.distinctCells.size,
      Rv: this.revisitCount,
      t: this.elapsedSeconds,
      difficulty: this.difficulty,
      relicsCollected: this.relicsCollected,
      phantomsBeaten,
      isZen: false,
    });

    this._onSound(won ? 'win' : 'defeat');
    this._notify();
  }

  destroy() {
    this._stopTimer();
  }

  _startTimer() {
    this._stopTimer();
    this._timerInterval = setInterval(() => {
      this.elapsedSeconds += 0.1;
      this._notify();
    }, 100);
    if (this._timerInterval && typeof this._timerInterval.unref === 'function') {
      this._timerInterval.unref();
    }
  }

  _stopTimer() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  }

  _notify() {
    if (this._onUpdate) {
      this._onUpdate({
        state: this.state,
        code: this.code,
        grid: this.grid,
        scoutCell: this.scoutCell,
        heading: this.heading,
        budget: this.budget,
        spent: this.spent,
        remainingStamina: this.remainingStamina,
        bumps: this.bumps,
        ticks: this.ticks,
        moveCount: this.moveCount,
        movesString: this.movesString,
        elapsedSeconds: this.elapsedSeconds,
        lanternRadius: this.lanternRadius,
        relics: this.relics,
        relicsCollected: this.relicsCollected,
        totalRelics: this.relicsCollected + (this.relics ? this.relics.length : 0),
        phantoms: this.phantoms,
        fog: this.fog,
        scoreReport: this.scoreReport,
        oilActive: this.oilMovesRemaining > 0,
        compassActive: this.compassMovesRemaining > 0,
      });
    }
  }
}
