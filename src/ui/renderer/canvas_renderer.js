/**
 * @file canvas_renderer.js
 * Multi-layer double-buffered Canvas 2D renderer for Expedition Cartographer.
 * Defined in ARCHITECTURE.md section 6 and DESIGN.md section 4.
 */

import { Wall, FogState, RelicKind } from '../../core/constants.js';
import { PatternManager } from './patterns.js';
import { ParticleSystem } from './particles.js';

export class CanvasRenderer {
  /**
   * @param {HTMLCanvasElement} canvas The visible canvas element.
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.theme = 'sheet';
    this.patterns = new PatternManager(this.theme);
    this.particles = new ParticleSystem();

    // Layer 0: Maze cached offscreen
    this.l0Canvas = document.createElement('canvas');
    this.l0Ctx = this.l0Canvas.getContext('2d');

    // Layer 1: Heatmap offscreen
    this.l1Canvas = document.createElement('canvas');
    this.l1Ctx = this.l1Canvas.getContext('2d');

    this.grid = null;
    this.fog = null;
    this.path = [];
    this.playerRoute = [];
    this.scoutCell = -1;
    this.heading = Wall.E;
    this.phantoms = [];
    this.relics = [];
    this.heatMap = null; // Uint32Array visit counts
    this.maxHeat = 1;

    this.fogEnabled = true;
    this.cellPx = 20;
    this.wallThick = 2;
    this.margin = 24; // margin for rulers
    this.hoverCell = -1;

    this.duelP1 = null;
    this.duelP2 = null;

    this._bindPointerEvents();
  }

  setTheme(theme) {
    this.theme = (theme === 'terminal' || !theme) ? 'sheet' : theme;
    this.patterns.setTheme(this.theme);
    if (this.grid) {
      this.rebuildL0();
      this.render();
    }
  }

  setGrid(grid) {
    this.grid = grid;
    this.heatMap = new Uint32Array(grid.size);
    this.maxHeat = 1;
    this.path = [];
    this.playerRoute = [];
    this.scoutCell = grid.start;
    this.resize();
    this.rebuildL0();
    this.clearHeat();
    this.render();
  }

  setFog(fog) {
    this.fog = fog;
    this.render();
  }

  setFogEnabled(enabled) {
    this.fogEnabled = !!enabled;
    this.render();
  }

  setScout(cell, heading) {
    const prevCell = this.scoutCell;
    this.scoutCell = cell;
    this.heading = heading;

    if (this.grid && cell >= 0) {
      this.playerRoute.push(cell);

      // Spawn chalk trail particles
      if (prevCell >= 0 && prevCell !== cell) {
        const x = this.margin + (this.grid.colOf(prevCell) + 0.5) * this.cellPx;
        const y = this.margin + (this.grid.rowOf(prevCell) + 0.5) * this.cellPx;
        const dc = this.grid.colOf(cell) - this.grid.colOf(prevCell);
        const dr = this.grid.rowOf(cell) - this.grid.rowOf(prevCell);
        this.particles.spawn(x, y, dc, dr);
      }
    }
    this.render();
  }

  setPath(path) {
    this.path = path || [];
    this.render();
  }

  setEntities({ phantoms = [], relics = [] }) {
    this.phantoms = phantoms;
    this.relics = relics;
    this.render();
  }

  setDuelPlayers(p1, p2) {
    this.duelP1 = p1;
    this.duelP2 = p2;
    this.render();
  }

  clearHeat() {
    if (this.heatMap) this.heatMap.fill(0);
    this.maxHeat = 1;
    this.l1Ctx.clearRect(0, 0, this.l1Canvas.width, this.l1Canvas.height);
  }

  recordVisit(cell) {
    if (!this.grid || cell < 0 || cell >= this.grid.size) return;
    this.heatMap[cell]++;
    if (this.heatMap[cell] > this.maxHeat) {
      this.maxHeat = this.heatMap[cell];
    }
    this._drawHeatCell(cell);
  }

  resize() {
    if (!this.grid) return;
    const parent = this.canvas.parentElement;
    const pStyle = (parent && typeof window !== 'undefined' && window.getComputedStyle) ? window.getComputedStyle(parent) : null;
    const padX = pStyle ? (parseFloat(pStyle.paddingLeft) || 0) + (parseFloat(pStyle.paddingRight) || 0) : 32;
    const padY = pStyle ? (parseFloat(pStyle.paddingTop) || 0) + (parseFloat(pStyle.paddingBottom) || 0) : 32;

    const availW = Math.max(300, (parent ? parent.clientWidth : 800) - padX);
    const availH = Math.max(300, (parent ? parent.clientHeight : 600) - padY);

    const maxGridW = availW - this.margin * 2;
    const maxGridH = availH - this.margin * 2;

    const fitPx = Math.floor(Math.min(maxGridW / this.grid.cols, maxGridH / this.grid.rows));
    // High-visibility: ensure cell size is at least 18px so passages and walls are bold and clear!
    this.cellPx = Math.max(18, fitPx);
    this.wallThick = Math.max(2, Math.round(this.cellPx * 0.12));

    const totalW = this.grid.cols * this.cellPx + this.margin * 2;
    const totalH = this.grid.rows * this.cellPx + this.margin * 2;

    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    this.canvas.width = totalW * dpr;
    this.canvas.height = totalH * dpr;
    this.canvas.style.width = `${totalW}px`;
    this.canvas.style.height = `${totalH}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    // Resize offscreen layers
    this.l0Canvas.width = totalW * dpr;
    this.l0Canvas.height = totalH * dpr;
    this.l0Ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.l0Ctx.scale(dpr, dpr);

    this.l1Canvas.width = totalW * dpr;
    this.l1Canvas.height = totalH * dpr;
    this.l1Ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.l1Ctx.scale(dpr, dpr);
  }

  rebuildL0() {
    if (!this.grid) return;
    const ctx = this.l0Ctx;
    const totalW = this.grid.cols * this.cellPx + this.margin * 2;
    const totalH = this.grid.rows * this.cellPx + this.margin * 2;

    ctx.clearRect(0, 0, totalW, totalH);

    // 1. Background ground
    let bg = '#211811';
    if (this.theme === 'cyber') bg = '#0a0c1a';
    else if (this.theme === 'jungle') bg = '#071510';
    ctx.fillStyle = bg;
    ctx.fillRect(this.margin, this.margin, this.grid.cols * this.cellPx, this.grid.rows * this.cellPx);

    // 2. Terrain patterns
    for (let i = 0; i < this.grid.size; i++) {
      const t = this.grid.terrain[i];
      if (t !== 0) {
        const r = this.grid.rowOf(i);
        const c = this.grid.colOf(i);
        const x = this.margin + c * this.cellPx;
        const y = this.margin + r * this.cellPx;
        ctx.fillStyle = this.patterns.getPattern(ctx, t);
        ctx.fillRect(x, y, this.cellPx, this.cellPx);
      }
    }

    // 3. Elevation contours (dashed line where elevation changes and no wall)
    let contourCol = '#2d393c';
    if (this.theme === 'sheet') contourCol = '#bdb7a3';
    else if (this.theme === 'cyber') contourCol = '#1e293b';
    else if (this.theme === 'jungle') contourCol = '#164e3f';
    ctx.strokeStyle = contourCol;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    for (let r = 0; r < this.grid.rows; r++) {
      for (let c = 0; c < this.grid.cols; c++) {
        const i = r * this.grid.cols + c;
        const el = this.grid.elevation[i];
        const x = this.margin + c * this.cellPx;
        const y = this.margin + r * this.cellPx;

        // East boundary
        if (c < this.grid.cols - 1 && !this.grid.hasWall(i, Wall.E)) {
          const eastIdx = i + 1;
          if (this.grid.elevation[eastIdx] !== el) {
            ctx.moveTo(x + this.cellPx, y);
            ctx.lineTo(x + this.cellPx, y + this.cellPx);
          }
        }
        // South boundary
        if (r < this.grid.rows - 1 && !this.grid.hasWall(i, Wall.S)) {
          const southIdx = i + this.grid.cols;
          if (this.grid.elevation[southIdx] !== el) {
            ctx.moveTo(x, y + this.cellPx);
            ctx.lineTo(x + this.cellPx, y + this.cellPx);
          }
        }
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Start and End Markers
    let startCol = '#e5a93b';
    let endCol = '#c4572f';
    if (this.theme === 'sheet') { startCol = '#d97706'; endCol = '#c2410c'; }
    else if (this.theme === 'cyber') { startCol = '#00f5ff'; endCol = '#ff007f'; }
    else if (this.theme === 'jungle') { startCol = '#facc15'; endCol = '#f43f5e'; }
    this._drawMarker(ctx, this.grid.start, 'S', startCol);
    this._drawMarker(ctx, this.grid.end, 'E', endCol);

    // 5. Crisp pixel-snapped walls
    let wallCol = '#d8d2c0';
    if (this.theme === 'sheet') wallCol = '#24201c';
    else if (this.theme === 'cyber') wallCol = '#00f5ff';
    else if (this.theme === 'jungle') wallCol = '#34d399';
    ctx.strokeStyle = wallCol;
    ctx.lineWidth = this.wallThick;
    ctx.lineCap = 'square';
    ctx.beginPath();

    const m = this.margin;
    const cp = this.cellPx;

    for (let r = 0; r < this.grid.rows; r++) {
      for (let c = 0; c < this.grid.cols; c++) {
        const i = r * this.grid.cols + c;
        const x = m + c * cp;
        const y = m + r * cp;
        const w = this.grid.walls[i];

        if (w & Wall.N) {
          ctx.moveTo(x, y);
          ctx.lineTo(x + cp, y);
        }
        if (w & Wall.W) {
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + cp);
        }
        if (r === this.grid.rows - 1 && (w & Wall.S)) {
          ctx.moveTo(x, y + cp);
          ctx.lineTo(x + cp, y + cp);
        }
        if (c === this.grid.cols - 1 && (w & Wall.E)) {
          ctx.moveTo(x + cp, y);
          ctx.lineTo(x + cp, y + cp);
        }
      }
    }
    ctx.stroke();

    // 6. Double outer neatline border
    let neatCol = '#55645f';
    if (this.theme === 'sheet') neatCol = '#8c7553';
    else if (this.theme === 'cyber') neatCol = '#ec4899';
    else if (this.theme === 'jungle') neatCol = '#059669';
    ctx.strokeStyle = neatCol;
    ctx.lineWidth = 1;
    ctx.strokeRect(m - 3.5, m - 3.5, this.grid.cols * cp + 7, this.grid.rows * cp + 7);
  }

  _drawMarker(ctx, cell, letter, color) {
    if (!this.grid || cell < 0) return;
    const r = this.grid.rowOf(cell);
    const c = this.grid.colOf(cell);
    const x = this.margin + c * this.cellPx;
    const y = this.margin + r * this.cellPx;

    ctx.fillStyle = color;
    ctx.fillRect(x + 2, y + 2, this.cellPx - 4, this.cellPx - 4);

    if (this.cellPx >= 12) {
      ctx.fillStyle = '#0f1416';
      ctx.font = `bold ${Math.floor(this.cellPx * 0.55)}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letter, x + this.cellPx / 2, y + this.cellPx / 2);
    }
  }

  _drawHeatCell(cell) {
    if (!this.grid) return;
    const r = this.grid.rowOf(cell);
    const c = this.grid.colOf(cell);
    const x = this.margin + c * this.cellPx;
    const y = this.margin + r * this.cellPx;

    const v = this.heatMap[cell] / this.maxHeat;
    // 5-stop ramp
    let col = 'rgba(220,215,196,0.55)';
    if (this.theme === 'cyber') {
      col = 'rgba(35,45,90,0.55)';
      if (v > 0.8) col = 'rgba(255,0,127,0.7)';
      else if (v > 0.6) col = 'rgba(0,245,255,0.65)';
      else if (v > 0.4) col = 'rgba(99,102,241,0.55)';
      else if (v > 0.2) col = 'rgba(49,46,129,0.55)';
    } else if (this.theme === 'jungle') {
      col = 'rgba(12,36,27,0.55)';
      if (v > 0.8) col = 'rgba(244,63,94,0.7)';
      else if (v > 0.6) col = 'rgba(250,204,21,0.65)';
      else if (v > 0.4) col = 'rgba(52,211,153,0.55)';
      else if (v > 0.2) col = 'rgba(16,185,129,0.55)';
    } else {
      if (v > 0.8) col = 'rgba(196,87,47,0.55)';
      else if (v > 0.6) col = 'rgba(217,154,43,0.55)';
      else if (v > 0.4) col = 'rgba(201,181,101,0.55)';
      else if (v > 0.2) col = 'rgba(196,199,154,0.55)';
    }

    this.l1Ctx.fillStyle = col;
    this.l1Ctx.fillRect(x, y, this.cellPx, this.cellPx);
  }

  render() {
    if (!this.grid) return;
    const ctx = this.ctx;
    const totalW = this.grid.cols * this.cellPx + this.margin * 2;
    const totalH = this.grid.rows * this.cellPx + this.margin * 2;

    ctx.clearRect(0, 0, totalW, totalH);

    // 1. Draw L0: Cached maze floor & walls
    ctx.drawImage(this.l0Canvas, 0, 0);

    // 2. Draw L1: Heatmap
    ctx.drawImage(this.l1Canvas, 0, 0);

    // 3. Draw Paths: optimal route & player route
    this._drawPaths(ctx);

    // 4. Draw L3: Fog of War (dimming unseen areas, keeping visible areas clear)
    if (this.fog && this.fogEnabled) {
      this._drawFog(ctx);
    }

    // 5. Draw Exit Beacon (Always glowing with radiant beacon so player knows where to go!)
    this._drawExitBeacon(ctx);

    // 6. Draw Relics (items)
    this._drawRelics(ctx);

    // 7. Draw Phantoms
    this._drawPhantoms(ctx);

    // 8. Draw Players (Solo Scout or 2P Duel) - always on top with warm lantern light!
    if (this.duelP1 && this.duelP2) {
      this._drawDuel(ctx);
    } else {
      this._drawScout(ctx);
    }

    // 9. Draw Trail Particles
    let particleCol = 'rgba(230,226,216,0.7)';
    if (this.theme === 'sheet') particleCol = 'rgba(27,34,36,0.7)';
    else if (this.theme === 'cyber') particleCol = 'rgba(0,245,255,0.7)';
    else if (this.theme === 'jungle') particleCol = 'rgba(52,211,153,0.7)';
    this.particles.draw(ctx, particleCol);

    // 10. Draw Rulers & Scale Bar
    this._drawRulers(ctx);
  }

  _drawDuel(ctx) {
    if (!this.grid || !this.duelP1 || !this.duelP2) return;
    const m = this.margin;
    const cp = this.cellPx;

    const drawPlayer = (p, label, color) => {
      if (p.cell < 0) return;
      const x = m + (this.grid.colOf(p.cell) + 0.5) * cp;
      const y = m + (this.grid.rowOf(p.cell) + 0.5) * cp;
      const sz = Math.max(5, cp * 0.38);

      let angle = 0;
      if (p.heading === Wall.N) angle = -Math.PI / 2;
      else if (p.heading === Wall.E) angle = 0;
      else if (p.heading === Wall.S) angle = Math.PI / 2;
      else if (p.heading === Wall.W) angle = Math.PI;

      ctx.save();
      ctx.translate(x, y);

      // Glow halo
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, sz * 0.9, 0, Math.PI * 2);
      ctx.fill();

      // Heading indicator
      ctx.rotate(angle);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(sz * 0.75, 0);
      ctx.lineTo(-sz * 0.45, -sz * 0.45);
      ctx.lineTo(-sz * 0.15, 0);
      ctx.lineTo(-sz * 0.45, sz * 0.45);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    drawPlayer(this.duelP1, '1', this.duelP1.color || '#38bdf8');
    drawPlayer(this.duelP2, '2', this.duelP2.color || '#f43f5e');
  }

  _drawPaths(ctx) {
    const m = this.margin;
    const cp = this.cellPx;

    // 1. Player route (dashed bone line)
    if (this.playerRoute.length > 1) {
      ctx.save();
      ctx.strokeStyle = this.theme === 'cyber' ? 'rgba(0,245,255,0.5)' : (this.theme === 'jungle' ? 'rgba(52,211,153,0.5)' : 'rgba(217,119,6,0.5)');
      ctx.lineWidth = Math.max(2, cp * 0.2);
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let i = 0; i < this.playerRoute.length; i++) {
        const cell = this.playerRoute[i];
        const x = m + (this.grid.colOf(cell) + 0.5) * cp;
        const y = m + (this.grid.rowOf(cell) + 0.5) * cp;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 2. Final optimal path (solid brass line)
    if (this.path && this.path.length > 1) {
      ctx.save();
      ctx.strokeStyle = this.theme === 'cyber' ? '#00f5ff' : (this.theme === 'jungle' ? '#34d399' : '#f59e0b');
      ctx.lineWidth = Math.max(3, cp * 0.25);
      ctx.lineCap = 'square';
      ctx.lineJoin = 'miter';
      ctx.beginPath();
      for (let i = 0; i < this.path.length; i++) {
        const cell = this.path[i];
        const x = m + (this.grid.colOf(cell) + 0.5) * cp;
        const y = m + (this.grid.rowOf(cell) + 0.5) * cp;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawRelics(ctx) {
    if (!this.relics) return;
    const m = this.margin;
    const cp = this.cellPx;

    for (const r of this.relics) {
      // If fog is on, only draw relic if cell is VISIBLE
      if (this.fog && this.fog[r.cell] !== FogState.VISIBLE) continue;

      const x = m + (this.grid.colOf(r.cell) + 0.5) * cp;
      const y = m + (this.grid.rowOf(r.cell) + 0.5) * cp;
      const rad = Math.max(3, cp * 0.25);

      ctx.save();
      ctx.fillStyle = '#e5a93b';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;

      if (r.kind === RelicKind.RATION) {
        // Circle
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (r.kind === RelicKind.LANTERN_OIL) {
        // Diamond
        ctx.beginPath();
        ctx.moveTo(x, y - rad);
        ctx.lineTo(x + rad, y);
        ctx.lineTo(x, y + rad);
        ctx.lineTo(x - rad, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (r.kind === RelicKind.COMPASS) {
        // Star / cross
        ctx.beginPath();
        ctx.moveTo(x - rad, y);
        ctx.lineTo(x + rad, y);
        ctx.moveTo(x, y - rad);
        ctx.lineTo(x, y + rad);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawPhantoms(ctx) {
    if (!this.phantoms) return;
    const m = this.margin;
    const cp = this.cellPx;

    for (const p of this.phantoms) {
      if (!p.path || p.path.length === 0) continue;
      const cell = p.path[p.path.length - 1]; // current position
      // Only draw if visible
      if (this.fog && this.fog[cell] !== FogState.VISIBLE) continue;

      const x = m + (this.grid.colOf(cell) + 0.5) * cp;
      const y = m + (this.grid.rowOf(cell) + 0.5) * cp;
      const sz = Math.max(4, cp * 0.3);

      ctx.save();
      ctx.strokeStyle = p.colorSheet || '#f59e0b';
      ctx.fillStyle = this.theme === 'cyber' ? '#0a0c1a' : (this.theme === 'jungle' ? '#071510' : '#211811');
      ctx.lineWidth = 2;

      if (p.glyph === 'circle') {
        ctx.beginPath();
        ctx.arc(x, y, sz, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (p.glyph === 'square') {
        ctx.fillRect(x - sz, y - sz, sz * 2, sz * 2);
        ctx.strokeRect(x - sz, y - sz, sz * 2, sz * 2);
      } else if (p.glyph === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(x, y - sz);
        ctx.lineTo(x + sz, y + sz);
        ctx.lineTo(x - sz, y + sz);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (p.glyph === 'diamond') {
        ctx.beginPath();
        ctx.moveTo(x, y - sz);
        ctx.lineTo(x + sz, y);
        ctx.lineTo(x, y + sz);
        ctx.lineTo(x - sz, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Cross
        ctx.beginPath();
        ctx.moveTo(x - sz, y);
        ctx.lineTo(x + sz, y);
        ctx.moveTo(x, y - sz);
        ctx.lineTo(x, y + sz);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawExitBeacon(ctx) {
    if (!this.grid || this.grid.end < 0) return;
    const m = this.margin;
    const cp = this.cellPx;
    const r = this.grid.rowOf(this.grid.end);
    const c = this.grid.colOf(this.grid.end);
    const x = m + (c + 0.5) * cp;
    const y = m + (r + 0.5) * cp;
    const rad = Math.max(6, cp * 0.4);

    ctx.save();
    // Radiant golden beacon glow so destination is clearly visible across the map
    const grad = ctx.createRadialGradient(x, y, rad * 0.2, x, y, rad * 2.2);
    grad.addColorStop(0, 'rgba(250, 204, 21, 0.7)');
    grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.3)');
    grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, rad * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Golden Trophy Exit Emblem
    ctx.font = `bold ${Math.max(12, Math.floor(cp * 0.7))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏆', x, y);
    ctx.restore();
  }

  _drawScout(ctx) {
    if (this.scoutCell < 0 || !this.grid) return;
    const m = this.margin;
    const cp = this.cellPx;
    const x = m + (this.grid.colOf(this.scoutCell) + 0.5) * cp;
    const y = m + (this.grid.rowOf(this.scoutCell) + 0.5) * cp;
    const sz = Math.max(7, cp * 0.4);

    let angle = 0;
    if (this.heading === Wall.N) angle = -Math.PI / 2;
    else if (this.heading === Wall.E) angle = 0;
    else if (this.heading === Wall.S) angle = Math.PI / 2;
    else if (this.heading === Wall.W) angle = Math.PI;

    ctx.save();
    ctx.translate(x, y);

    // 1. Radiant warm golden lantern halo around player
    const glowRadius = Math.max(sz * 3, cp * 1.8);
    const glow = ctx.createRadialGradient(0, 0, sz * 0.2, 0, 0, glowRadius);
    glow.addColorStop(0, 'rgba(245, 158, 11, 0.65)');
    glow.addColorStop(0.5, 'rgba(245, 158, 11, 0.22)');
    glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // 2. High-contrast Explorer Compass Arrow
    ctx.rotate(angle);

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.beginPath();
    ctx.moveTo(sz * 1.25, 0);
    ctx.lineTo(-sz * 0.85, -sz * 0.75);
    ctx.lineTo(-sz * 0.35, 0);
    ctx.lineTo(-sz * 0.85, sz * 0.75);
    ctx.closePath();
    ctx.fill();

    // White foreground arrow
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(sz * 1.15, 0);
    ctx.lineTo(-sz * 0.8, -sz * 0.65);
    ctx.lineTo(-sz * 0.35, 0);
    ctx.lineTo(-sz * 0.8, sz * 0.65);
    ctx.closePath();
    ctx.fill();

    // Brass accent border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Glowing core amber beacon
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 0, sz * 0.32, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _drawFog(ctx) {
    const m = this.margin;
    const cp = this.cellPx;

    for (let r = 0; r < this.grid.rows; r++) {
      for (let c = 0; c < this.grid.cols; c++) {
        const i = r * this.grid.cols + c;
        const state = this.fog[i];
        const x = m + c * cp;
        const y = m + r * cp;

        if (state === FogState.UNSEEN) {
          // Translucent twilight overlay so maze walls are discernible like an ancient chart
          ctx.fillStyle = this.theme === 'cyber' ? 'rgba(10, 14, 26, 0.82)' : (this.theme === 'jungle' ? 'rgba(7, 21, 16, 0.82)' : 'rgba(185, 179, 159, 0.82)');
          ctx.fillRect(x, y, cp, cp);
          ctx.fillStyle = this.patterns.getPattern(ctx, 'fog_hatch');
          ctx.fillRect(x, y, cp, cp);
        } else if (state === FogState.REMEMBERED) {
          // Soft tint overlay for charted passages
          ctx.fillStyle = this.theme === 'cyber' ? 'rgba(24, 32, 66, 0.38)' : (this.theme === 'jungle' ? 'rgba(18, 56, 42, 0.38)' : 'rgba(211, 205, 187, 0.38)');
          ctx.fillRect(x, y, cp, cp);
        }
      }
    }
  }

  _drawRulers(ctx) {
    const m = this.margin;
    const cp = this.cellPx;

    ctx.save();
    ctx.fillStyle = this.theme === 'cyber' ? '#94a3b8' : (this.theme === 'jungle' ? '#a7f3d0' : '#5d5e53');
    ctx.strokeStyle = this.theme === 'cyber' ? '#232d5a' : (this.theme === 'jungle' ? '#1b4d3e' : '#9a9684');
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Top horizontal ruler
    ctx.beginPath();
    ctx.moveTo(m, m - 4);
    ctx.lineTo(m + this.grid.cols * cp, m - 4);
    ctx.stroke();

    for (let c = 0; c < this.grid.cols; c++) {
      const x = m + (c + 0.5) * cp;
      const isMajor = (c % 5 === 0);
      const isLabeled = (c % 10 === 0);

      ctx.beginPath();
      ctx.moveTo(x, m - 4);
      ctx.lineTo(x, isMajor ? m - 10 : m - 7);
      ctx.stroke();

      if (isLabeled && cp >= 8) {
        ctx.fillText(String(c), x, m - 16);
      }
    }

    // Left vertical ruler
    ctx.beginPath();
    ctx.moveTo(m - 4, m);
    ctx.lineTo(m - 4, m + this.grid.rows * cp);
    ctx.stroke();

    for (let r = 0; r < this.grid.rows; r++) {
      const y = m + (r + 0.5) * cp;
      const isMajor = (r % 5 === 0);
      const isLabeled = (r % 10 === 0);

      ctx.beginPath();
      ctx.moveTo(m - 4, y);
      ctx.lineTo(isMajor ? m - 10 : m - 7, y);
      ctx.stroke();

      if (isLabeled && cp >= 8) {
        ctx.fillText(String(r), m - 18, y);
      }
    }

    // Hover cursor line on rulers
    if (this.hoverCell >= 0 && this.hoverCell < this.grid.size) {
      const hr = this.grid.rowOf(this.hoverCell);
      const hc = this.grid.colOf(this.hoverCell);
      ctx.strokeStyle = '#e5a93b';
      ctx.lineWidth = 1.5;

      // Top tick
      const hx = m + (hc + 0.5) * cp;
      ctx.beginPath();
      ctx.moveTo(hx, m - 14);
      ctx.lineTo(hx, m - 4);
      ctx.stroke();

      // Left tick
      const hy = m + (hr + 0.5) * cp;
      ctx.beginPath();
      ctx.moveTo(m - 14, hy);
      ctx.lineTo(m - 4, hy);
      ctx.stroke();
    }

    // Scale bar in bottom right
    const sbX = m + this.grid.cols * cp - 60;
    const sbY = m + this.grid.rows * cp + 16;
    ctx.fillStyle = '#e5a93b';
    ctx.fillRect(sbX, sbY, 30, 4);
    ctx.fillStyle = isTerminal ? '#55645f' : '#6f6b5a';
    ctx.fillRect(sbX + 30, sbY, 30, 4);
    ctx.textAlign = 'right';
    ctx.fillText('10 CELLS', sbX + 60, sbY + 12);

    ctx.restore();
  }

  _bindPointerEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.grid) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - this.margin;
      const y = e.clientY - rect.top - this.margin;

      const c = Math.floor(x / this.cellPx);
      const r = Math.floor(y / this.cellPx);

      if (this.grid.inBounds(r, c)) {
        this.hoverCell = this.grid.index(r, c);
        this.canvas.dispatchEvent(new CustomEvent('cell-hover', {
          detail: { cell: this.hoverCell, r, c },
          bubbles: true,
        }));
      } else {
        this.hoverCell = -1;
      }
      this.render();
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoverCell = -1;
      this.render();
    });
  }

  /**
   * Exports the composite canvas as PNG blob with cartouche.
   * @param {number} scale 1 | 2 | 4
   * @param {object} cartoucheInfo
   * @returns {Promise<Blob>}
   */
  async exportPng(scale = 2, cartoucheInfo = {}) {
    const exportCanvas = document.createElement('canvas');
    const eCtx = exportCanvas.getContext('2d');

    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);
    const cartoucheH = 80;

    exportCanvas.width = w * scale;
    exportCanvas.height = (h + cartoucheH) * scale;
    eCtx.scale(scale, scale);

    // Draw background
    eCtx.fillStyle = this.theme === 'cyber' ? '#070913' : (this.theme === 'jungle' ? '#05130e' : '#211811');
    eCtx.fillRect(0, 0, w, h + cartoucheH);

    // Draw main canvas
    eCtx.drawImage(this.canvas, 0, 0, w, h);

    // Draw cartouche
    eCtx.strokeStyle = '#e5a93b';
    eCtx.lineWidth = 1;
    eCtx.strokeRect(16, h + 8, w - 32, cartoucheH - 16);

    eCtx.fillStyle = '#e5a93b';
    eCtx.font = 'bold 16px Fraunces, serif';
    eCtx.fillText(cartoucheInfo.title || 'EXPEDITION CARTOUCHE', 28, h + 32);

    eCtx.font = '11px "JetBrains Mono", monospace';
    eCtx.fillStyle = this.theme === 'sheet' ? '#f6ecdc' : '#f0fdf4';
    eCtx.fillText(`CODE: ${cartoucheInfo.code || ''}`, 28, h + 52);

    return new Promise(resolve => exportCanvas.toBlob(resolve, 'image/png'));
  }
}
