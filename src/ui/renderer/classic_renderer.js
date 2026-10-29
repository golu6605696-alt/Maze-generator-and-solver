/**
 * @file classic_renderer.js
 * Crisp, high-contrast, fully-visible 2D maze renderer.
 * Modeled after classic maze illustrations:
 * - 100% visible passages (no fog, no hidden walls)
 * - Solid crisp black walls on bright clean background
 * - Green arrow at Entrance (top-left) pointing inward
 * - Red arrow at Exit (bottom-right) pointing outward
 * - Smooth player trail and bold red solution path line
 */

import { Wall } from '../../core/constants.js';
import { ThreeSandstoneRenderer } from './three_sandstone_renderer.js';

export class ClassicMazeRenderer {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas && typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;

    this.grid = null;
    this.cellPx = 28;
    this.wallThick = 3;
    this.margin = 32; // space for entrance/exit arrows

    this.playerCell = -1;
    this.playerTrail = [];
    this.solutionPath = [];
    this.exploredCells = [];
    this.activeTrail = [];
    this.currentHead = -1;

    this.theme = 'sheet'; // 'sheet', 'cyber', 'jungle'

    // High-End Genuine 3D Sandstone Labyrinth WebGL Engine (active for 'sheet' / Treasure Map theme)
    if (canvas && typeof window !== 'undefined') {
      try {
        this.threeRenderer = new ThreeSandstoneRenderer(canvas);
      } catch (err) {
        console.warn('[ClassicMazeRenderer] ThreeSandstoneRenderer init fallback:', err);
        this.threeRenderer = null;
      }
    } else {
      this.threeRenderer = null;
    }
  }

  setTheme(theme) {
    this.theme = (theme === 'terminal' || !theme) ? 'sheet' : theme;
    if (this.threeRenderer) {
      this.threeRenderer.setTheme(this.theme);
    }
    if (this.canvas) {
      if (this.theme === 'sheet') {
        this.canvas.style.display = 'none';
        this.canvas.style.position = 'absolute';
        this.canvas.style.opacity = '0';
        this.canvas.style.pointerEvents = 'none';
      } else {
        this.canvas.style.display = 'block';
        this.canvas.style.position = 'relative';
        this.canvas.style.opacity = '1';
        this.canvas.style.pointerEvents = 'auto';
      }
    }
    this.render();
  }

  getThemeColors() {
    let t = this.theme || 'sheet';
    if (t === 'dark' || t === 'terminal') t = 'sheet';
    if (t === 'classic') t = 'sheet';

    switch (t) {
      case 'sheet': // 📜 Treasure Parchment / Aged Paper
      default:
        return {
          bg: '#140e0a',                      // Canvas outer background
          mazeBg: '#211811',                  // Inner maze dark sandstone background
          wallColor: '#d97706',               // Warm amber gold walls
          exploredFill: 'rgba(217, 119, 6, 0.15)',
          exploredBorder: 'rgba(217, 119, 6, 0.35)',
          pathBoxFill: 'rgba(217, 119, 6, 0.44)', // Golden treasure path box
          pathBoxBorder: 'rgba(245, 158, 11, 0.90)',
          headFill: '#f59e0b',                // Radiant gold seeker head
          headGlow: 'rgba(245, 158, 11, 0.55)',
          headBorder: '#ffffff',
          solutionLine: '#ef4444',            // Crimson solution path line
          playerTrail: '#f59e0b',
          arrowEntrance: '#10b981',
          arrowExit: '#ef4444',
        };

      case 'cyber': // 🌌 Arcade Neon
        return {
          bg: '#070913',                      // Deep midnight canvas
          mazeBg: '#0f1326',                  // Dark cyber indigo interior
          wallColor: '#00f5ff',               // Glowing cyan walls
          exploredFill: 'rgba(0, 245, 255, 0.12)',
          exploredBorder: 'rgba(0, 245, 255, 0.35)',
          pathBoxFill: 'rgba(0, 245, 255, 0.42)', // Electric cyan path-finding box
          pathBoxBorder: 'rgba(0, 245, 255, 0.90)',
          headFill: '#ff007f',                // Hot pink neon seeker orb
          headGlow: 'rgba(255, 0, 127, 0.65)',
          headBorder: '#ffffff',
          solutionLine: '#ff007f',            // Laser pink solution line
          playerTrail: '#00f5ff',
          arrowEntrance: '#39ff14',
          arrowExit: '#ff007f',
        };

      case 'jungle': // 🌿 Emerald Explorer
        return {
          bg: '#05130e',                      // Deep night rainforest canvas
          mazeBg: '#0c241b',                  // Dark moss emerald interior
          wallColor: '#34d399',               // Emerald green walls
          exploredFill: 'rgba(52, 211, 153, 0.12)',
          exploredBorder: 'rgba(52, 211, 153, 0.35)',
          pathBoxFill: 'rgba(52, 211, 153, 0.42)', // Emerald green path-finding box
          pathBoxBorder: 'rgba(52, 211, 153, 0.85)',
          headFill: '#facc15',                // Radiant sunlit gold seeker orb
          headGlow: 'rgba(250, 204, 21, 0.60)',
          headBorder: '#ffffff',
          solutionLine: '#facc15',            // Golden treasure solution line
          playerTrail: '#34d399',
          arrowEntrance: '#10b981',
          arrowExit: '#f43f5e',
        };
    }
  }

  setGrid(grid) {
    this.grid = grid;
    this.playerCell = grid ? grid.start : -1;
    this.playerTrail = grid ? [grid.start] : [];
    this.solutionPath = [];
    this.exploredCells = [];
    this.activeTrail = [];
    this.currentHead = -1;
    if (this.threeRenderer) {
      this.threeRenderer.setGrid(grid);
    }
    this.resize();
    this.render();
  }

  setPlayer(cell) {
    if (!this.grid || cell < 0 || cell >= this.grid.size) return;
    this.playerCell = cell;

    if (!Array.isArray(this.playerTrail) || this.playerTrail.length === 0) {
      this.playerTrail = [cell];
    } else {
      const last = this.playerTrail[this.playerTrail.length - 1];
      if (last !== cell) {
        // If backtracking into an earlier cell along the covered path, remove dead-end/retreated markers
        const prevIndex = this.playerTrail.lastIndexOf(cell);
        if (prevIndex !== -1) {
          this.playerTrail = this.playerTrail.slice(0, prevIndex + 1);
        } else {
          this.playerTrail.push(cell);
        }
      }
    }
    if (this.threeRenderer) {
      this.threeRenderer.setPlayer(cell);
    }
    this.render();
  }

  resetPlayer() {
    if (!this.grid) return;
    this.playerCell = this.grid.start;
    this.playerTrail = [this.grid.start];
    if (this.threeRenderer) {
      this.threeRenderer.resetPlayer();
    }
    this.render();
  }

  setSolution(path, explored = [], activeTrail = [], currentHead = -1) {
    this.solutionPath = path || [];
    this.exploredCells = explored || [];
    this.activeTrail = activeTrail || [];
    this.currentHead = typeof currentHead === 'number' ? currentHead : -1;
    if (this.threeRenderer) {
      this.threeRenderer.setSolution(path, explored, activeTrail, currentHead);
    }
    this.render();
  }

  clearSolution() {
    this.solutionPath = [];
    this.exploredCells = [];
    this.activeTrail = [];
    this.currentHead = -1;
    if (this.threeRenderer) {
      this.threeRenderer.clearSolution();
    }
    this.render();
  }

  // Compatibility stubs for callers
  setEntities() { }
  setFog() { }
  setFogEnabled() { }
  setScout(cell) { this.setPlayer(cell); }
  setPath(path) { this.solutionPath = path || []; this.render(); }
  clearHeat() { this.exploredCells = []; this.activeTrail = []; this.currentHead = -1; }
  recordVisit(cell) { this.exploredCells.push(cell); }

  resize() {
    if (this.threeRenderer) {
      this.threeRenderer.resize();
    }
    if (!this.grid || !this.canvas) return;
    const parent = this.canvas.parentElement;
    const availW = Math.max(320, (parent ? parent.clientWidth : 700) - 24);
    const availH = Math.max(320, (parent ? parent.clientHeight : 600) - 24);

    const fitPx = Math.floor(Math.min(
      (availW - this.margin * 2) / this.grid.cols,
      (availH - this.margin * 2) / this.grid.rows
    ));

    // Clamp cell size between 16px and 44px
    this.cellPx = Math.max(16, Math.min(44, fitPx));
    this.wallThick = this.theme === 'sheet' ? Math.max(3, Math.round(this.cellPx * 0.18)) : Math.max(2, Math.round(this.cellPx * 0.1));

    const totalW = this.grid.cols * this.cellPx + this.margin * 2;
    const totalH = this.grid.rows * this.cellPx + this.margin * 2;

    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    this.canvas.width = totalW * dpr;
    this.canvas.height = totalH * dpr;
    this.canvas.style.width = `${totalW}px`;
    this.canvas.style.height = `${totalH}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  render() {
    if (!this.grid || !this.ctx) return;
    const ctx = this.ctx;
    const m = this.margin;
    const cp = this.cellPx;
    const cols = this.grid.cols;
    const rows = this.grid.rows;
    const totalW = cols * cp + m * 2;
    const totalH = rows * cp + m * 2;

    // 1. Clear entire canvas so the rest of the screen shows background animation
    ctx.clearRect(0, 0, totalW, totalH);

    // If 'sheet' (Treasure Map), genuine 3D sandstone WebGL renderer has full visual focus
    if (this.theme === 'sheet') {
      return;
    }

    const colors = this.getThemeColors();

    // 2. Draw ONLY the selected maze part as opaque interior
    ctx.fillStyle = colors.mazeBg;
    ctx.fillRect(m, m, cols * cp, rows * cp);

    // 3. Draw Explored Cells (subtle themed backdrop during search)
    if (this.exploredCells && this.exploredCells.length > 0) {
      ctx.fillStyle = colors.exploredFill;
      for (const cell of this.exploredCells) {
        if (cell < 0 || cell >= this.grid.size) continue;
        const r = this.grid.rowOf(cell);
        const c = this.grid.colOf(cell);
        ctx.fillRect(m + c * cp + 1, m + r * cp + 1, cp - 2, cp - 2);
      }
    }

    // 4. Draw Active Path-Finding Cover Boxes (according to each theme!)
    // In backtracking, this shows the active corridor trail; as it backtracks from dead ends,
    // boxes are removed accordingly!
    if (this.activeTrail && this.activeTrail.length > 0) {
      ctx.save();
      ctx.fillStyle = colors.pathBoxFill;
      ctx.strokeStyle = colors.pathBoxBorder;
      ctx.lineWidth = 1.5;
      const pad = Math.max(1, Math.round(cp * 0.08));
      const boxSize = cp - pad * 2;

      for (const cell of this.activeTrail) {
        if (cell < 0 || cell >= this.grid.size) continue;
        const r = this.grid.rowOf(cell);
        const c = this.grid.colOf(cell);
        const bx = m + c * cp + pad;
        const by = m + r * cp + pad;
        ctx.fillRect(bx, by, boxSize, boxSize);
        ctx.strokeRect(bx, by, boxSize, boxSize);
      }
      ctx.restore();
    }

    // 5. Draw User Player Trail
    if (this.playerTrail && this.playerTrail.length > 1) {
      ctx.save();
      ctx.strokeStyle = colors.playerTrail;
      ctx.lineWidth = Math.max(3, Math.round(cp * 0.22));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i < this.playerTrail.length; i++) {
        const cell = this.playerTrail[i];
        const x = m + (this.grid.colOf(cell) + 0.5) * cp;
        const y = m + (this.grid.rowOf(cell) + 0.5) * cp;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 6. Draw Solution Path (Solid Bold Line)
    if (this.solutionPath && this.solutionPath.length > 1) {
      ctx.save();
      ctx.strokeStyle = colors.solutionLine;
      ctx.lineWidth = Math.max(4, Math.round(cp * 0.32));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();

      // Extend to the entrance arrow on the left
      const startCell = this.solutionPath[0];
      const startX = m + (this.grid.colOf(startCell) + 0.5) * cp;
      const startY = m + (this.grid.rowOf(startCell) + 0.5) * cp;
      ctx.moveTo(m - 8, startY);
      ctx.lineTo(startX, startY);

      for (let i = 1; i < this.solutionPath.length; i++) {
        const cell = this.solutionPath[i];
        const x = m + (this.grid.colOf(cell) + 0.5) * cp;
        const y = m + (this.grid.rowOf(cell) + 0.5) * cp;
        ctx.lineTo(x, y);
      }

      // Extend to the exit arrow on the bottom
      const endCell = this.solutionPath[this.solutionPath.length - 1];
      const endX = m + (this.grid.colOf(endCell) + 0.5) * cp;
      const endY = m + (this.grid.rowOf(endCell) + 0.5) * cp;
      ctx.lineTo(endX, endY + cp * 0.5 + 8);

      ctx.stroke();
      ctx.restore();
    }

    // 7. Draw Maze Walls (Solid crisp lines in theme colors)
    ctx.save();
    ctx.strokeStyle = colors.wallColor;
    ctx.lineWidth = this.wallThick;
    ctx.lineCap = 'square';
    ctx.beginPath();

    const startIdx = this.grid.start;
    const endIdx = this.grid.end;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const x = m + c * cp;
        const y = m + r * cp;
        const w = this.grid.walls[i];

        // North wall
        if (w & Wall.N) {
          ctx.moveTo(x, y);
          ctx.lineTo(x + cp, y);
        }

        // West wall (leave open at start cell 0,0 for entrance arrow!)
        if (w & Wall.W) {
          if (i !== startIdx) {
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + cp);
          }
        }

        // South wall on bottom row (leave open at end cell for exit arrow!)
        if (r === rows - 1 && (w & Wall.S)) {
          if (i !== endIdx) {
            ctx.moveTo(x, y + cp);
            ctx.lineTo(x + cp, y + cp);
          }
        }

        // East wall on right edge
        if (c === cols - 1 && (w & Wall.E)) {
          ctx.moveTo(x + cp, y);
          ctx.lineTo(x + cp, y + cp);
        }
      }
    }
    ctx.stroke();
    ctx.restore();

    // 8. Draw Entrance Arrow (Pointing Inward from Left into Start cell)
    this._drawEntranceArrow(ctx, m, cp, this.grid.start, colors.arrowEntrance);

    // 9. Draw Exit Arrow (Pointing Downward Out of Exit cell)
    this._drawExitArrow(ctx, m, cp, this.grid.end, colors.arrowExit);

    // 10. Draw Algorithm Seeker Head (during auto solve)
    if (this.currentHead >= 0 && this.currentHead < this.grid.size) {
      this._drawSeekerHead(ctx, m, cp, this.currentHead, colors);
    }

    // 11. Draw Player Marker (if placed inside maze)
    if (this.playerCell >= 0 && this.playerCell < this.grid.size) {
      this._drawPlayerToken(ctx, m, cp, this.playerCell, colors);
    }
  }

  _drawSeekerHead(ctx, m, cp, cell, colors) {
    const r = this.grid.rowOf(cell);
    const c = this.grid.colOf(cell);
    const x = m + (c + 0.5) * cp;
    const y = m + (r + 0.5) * cp;
    const rad = Math.max(5, cp * 0.32);

    ctx.save();
    // Soft outer glow
    ctx.fillStyle = colors.headGlow;
    ctx.beginPath();
    ctx.arc(x, y, rad * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Vibrant themed head
    ctx.fillStyle = colors.headFill;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();

    // Crisp rim border
    ctx.strokeStyle = colors.headBorder;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Center focal sparkle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, rad * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _drawEntranceArrow(ctx, m, cp, startCell, arrowColor = '#22c55e') {
    const r = this.grid.rowOf(startCell);
    const c = this.grid.colOf(startCell);
    const tipX = m - 2;
    const tipY = m + (r + 0.5) * cp;
    const arrowLen = Math.max(16, cp * 0.75);
    const headSize = Math.max(6, cp * 0.28);

    ctx.save();
    ctx.fillStyle = arrowColor;
    ctx.strokeStyle = arrowColor;
    ctx.lineWidth = 1.5;

    // Arrow body & head pointing right (➡️)
    ctx.beginPath();
    ctx.moveTo(tipX - arrowLen, tipY - headSize * 0.35);
    ctx.lineTo(tipX - headSize, tipY - headSize * 0.35);
    ctx.lineTo(tipX - headSize, tipY - headSize);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(tipX - headSize, tipY + headSize);
    ctx.lineTo(tipX - headSize, tipY + headSize * 0.35);
    ctx.lineTo(tipX - arrowLen, tipY + headSize * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawExitArrow(ctx, m, cp, endCell, arrowColor = '#ef4444') {
    const r = this.grid.rowOf(endCell);
    const c = this.grid.colOf(endCell);
    const tipX = m + (c + 0.5) * cp;
    const tipY = m + (r + 1) * cp + Math.max(16, cp * 0.75);
    const startY = m + (r + 1) * cp + 2;
    const headSize = Math.max(6, cp * 0.28);

    ctx.save();
    ctx.fillStyle = arrowColor;
    ctx.strokeStyle = arrowColor;
    ctx.lineWidth = 1.5;

    // Arrow body & head pointing down (⬇️)
    ctx.beginPath();
    ctx.moveTo(tipX - headSize * 0.35, startY);
    ctx.lineTo(tipX - headSize * 0.35, tipY - headSize);
    ctx.lineTo(tipX - headSize, tipY - headSize);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(tipX + headSize, tipY - headSize);
    ctx.lineTo(tipX + headSize * 0.35, tipY - headSize);
    ctx.lineTo(tipX + headSize * 0.35, startY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawPlayerToken(ctx, m, cp, cell, colors) {
    const r = this.grid.rowOf(cell);
    const c = this.grid.colOf(cell);
    const x = m + (c + 0.5) * cp;
    const y = m + (r + 0.5) * cp;
    const rad = Math.max(5, cp * 0.35);

    const tokenFill = (colors && colors.playerTrail) || '#3b82f6';
    const glowFill = (colors && colors.headGlow) || 'rgba(59, 130, 246, 0.35)';

    ctx.save();
    // Soft outer glow
    ctx.fillStyle = glowFill;
    ctx.beginPath();
    ctx.arc(x, y, rad * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Vibrant themed circle
    ctx.fillStyle = tokenFill;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();

    // Crisp white border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner center dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, rad * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
