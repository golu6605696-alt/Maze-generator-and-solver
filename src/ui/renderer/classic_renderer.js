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

export class ClassicMazeRenderer {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.grid = null;
    this.cellPx = 28;
    this.wallThick = 3;
    this.margin = 32; // space for entrance/exit arrows

    this.playerCell = -1;
    this.playerTrail = [];
    this.solutionPath = [];
    this.exploredCells = [];

    this.theme = 'classic'; // 'classic' (white paper) or 'dark'
  }

  setTheme(theme) {
    this.theme = theme;
    this.render();
  }

  setGrid(grid) {
    this.grid = grid;
    this.playerCell = grid ? grid.start : -1;
    this.playerTrail = grid ? [grid.start] : [];
    this.solutionPath = [];
    this.exploredCells = [];
    this.resize();
    this.render();
  }

  setPlayer(cell) {
    if (!this.grid || cell < 0 || cell >= this.grid.size) return;
    this.playerCell = cell;
    if (this.playerTrail.length === 0 || this.playerTrail[this.playerTrail.length - 1] !== cell) {
      this.playerTrail.push(cell);
    }
    this.render();
  }

  resetPlayer() {
    if (!this.grid) return;
    this.playerCell = this.grid.start;
    this.playerTrail = [this.grid.start];
    this.render();
  }

  setSolution(path, explored = []) {
    this.solutionPath = path || [];
    this.exploredCells = explored || [];
    this.render();
  }

  clearSolution() {
    this.solutionPath = [];
    this.exploredCells = [];
    this.render();
  }

  // Compatibility stubs for callers
  setEntities() {}
  setFog() {}
  setFogEnabled() {}
  setScout(cell) { this.setPlayer(cell); }
  setPath(path) { this.solutionPath = path || []; this.render(); }
  clearHeat() { this.exploredCells = []; }
  recordVisit(cell) { this.exploredCells.push(cell); }

  resize() {
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
    this.wallThick = Math.max(2, Math.round(this.cellPx * 0.1));

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

    const isDark = this.theme === 'dark';
    const bg = isDark ? '#0f172a' : '#ffffff';
    const mazeBg = isDark ? '#1e293b' : '#ffffff';
    const wallColor = isDark ? '#f8fafc' : '#0f172a';

    // 1. Fill entire canvas background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, totalW, totalH);

    // 2. Draw maze interior background
    ctx.fillStyle = mazeBg;
    ctx.fillRect(m, m, cols * cp, rows * cp);

    // 3. Draw Explored / Search Frontier Cells (subtle pastel tint during solve)
    if (this.exploredCells && this.exploredCells.length > 0) {
      ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(147, 197, 253, 0.35)';
      for (const cell of this.exploredCells) {
        if (cell < 0 || cell >= this.grid.size) continue;
        const r = this.grid.rowOf(cell);
        const c = this.grid.colOf(cell);
        ctx.fillRect(m + c * cp + 1, m + r * cp + 1, cp - 2, cp - 2);
      }
    }

    // 4. Draw User Player Trail (Clean vibrant blue line)
    if (this.playerTrail && this.playerTrail.length > 1) {
      ctx.save();
      ctx.strokeStyle = isDark ? '#38bdf8' : '#2563eb';
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

    // 5. Draw Solution Path (Solid Bold Red Line like Image 2!)
    if (this.solutionPath && this.solutionPath.length > 1) {
      ctx.save();
      ctx.strokeStyle = '#ef4444'; // Bright Red
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

    // 6. Draw Maze Walls (Solid crisp lines, entrance & exit opened!)
    ctx.save();
    ctx.strokeStyle = wallColor;
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

    // 7. Draw Green Entrance Arrow (Pointing Inward from Left into Start cell)
    this._drawEntranceArrow(ctx, m, cp, this.grid.start);

    // 8. Draw Red Exit Arrow (Pointing Downward Out of Exit cell)
    this._drawExitArrow(ctx, m, cp, this.grid.end);

    // 9. Draw Player Marker (if placed inside maze)
    if (this.playerCell >= 0 && this.playerCell < this.grid.size) {
      this._drawPlayerToken(ctx, m, cp, this.playerCell, isDark);
    }
  }

  _drawEntranceArrow(ctx, m, cp, startCell) {
    const r = this.grid.rowOf(startCell);
    const c = this.grid.colOf(startCell);
    const tipX = m - 2;
    const tipY = m + (r + 0.5) * cp;
    const arrowLen = Math.max(16, cp * 0.75);
    const headSize = Math.max(6, cp * 0.28);

    ctx.save();
    ctx.fillStyle = '#22c55e'; // Vibrant Green
    ctx.strokeStyle = '#15803d';
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

  _drawExitArrow(ctx, m, cp, endCell) {
    const r = this.grid.rowOf(endCell);
    const c = this.grid.colOf(endCell);
    const tipX = m + (c + 0.5) * cp;
    const tipY = m + (r + 1) * cp + Math.max(16, cp * 0.75);
    const startY = m + (r + 1) * cp + 2;
    const headSize = Math.max(6, cp * 0.28);

    ctx.save();
    ctx.fillStyle = '#ef4444'; // Vibrant Red
    ctx.strokeStyle = '#b91c1c';
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

  _drawPlayerToken(ctx, m, cp, cell, isDark) {
    const r = this.grid.rowOf(cell);
    const c = this.grid.colOf(cell);
    const x = m + (c + 0.5) * cp;
    const y = m + (r + 0.5) * cp;
    const rad = Math.max(5, cp * 0.35);

    ctx.save();
    // Soft outer glow
    ctx.fillStyle = 'rgba(59, 130, 246, 0.35)';
    ctx.beginPath();
    ctx.arc(x, y, rad * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Vibrant blue circle
    ctx.fillStyle = '#3b82f6';
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
