/**
 * @file renderer.js
 * High-performance HTML5 Canvas renderer for maze grid, walls, traversal states,
 * and solution path overlays with device pixel ratio scaling and dark/light theming.
 *
 * Complexity: O(V) full render where V = rows * cols, O(1) single-cell incremental redraw.
 */

import { WALL_N, WALL_E, WALL_S, WALL_W } from '../core/cell.js';

export const THEMES = Object.freeze({
  DARK: {
    background: '#12131C',
    gridBackground: '#181926',
    wall: '#383A59',
    wallAccent: '#4F527D',
    unvisited: '#181926',
    carveHead: '#FF8A3D',
    carveVisited: '#222B45',
    frontier: '#FFC857',
    solverVisited: '#1E4748',
    solverHead: '#FF8A3D',
    solutionPath: '#22C55E',
    solutionGlow: 'rgba(34, 197, 94, 0.4)',
    start: '#3B82F6',
    end: '#EF4444',
    text: '#F8F9FA',
  },
  LIGHT: {
    background: '#F8FAFC',
    gridBackground: '#FFFFFF',
    wall: '#334155',
    wallAccent: '#64748B',
    unvisited: '#FFFFFF',
    carveHead: '#FF8A3D',
    carveVisited: '#E0F2FE',
    frontier: '#F59E0B',
    solverVisited: '#99F6E4',
    solverHead: '#F97316',
    solutionPath: '#16A34A',
    solutionGlow: 'rgba(22, 163, 74, 0.3)',
    start: '#2563EB',
    end: '#DC2626',
    text: '#FFFFFF',
  },
});

export class CanvasRenderer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} [options={}]
   * @param {string} [options.theme='dark'] - 'dark' | 'light'
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext ? canvas.getContext('2d') : null;
    this.theme = options.theme === 'light' ? 'light' : 'dark';
    this.grid = null;

    // Overlays tracked by 1D cell index
    this._cellTypes = new Map(); // index => type
    this._currentHead = null;
    this._cellSize = 20;
    this._originX = 0;
    this._originY = 0;
  }

  get colors() {
    return this.theme === 'light' ? THEMES.LIGHT : THEMES.DARK;
  }

  /**
   * Updates grid reference and clears visual overlays.
   *
   * @param {import('../core/grid.js').Grid} grid
   */
  setGrid(grid) {
    this.grid = grid;
    this._cellTypes.clear();
    this._currentHead = null;
    this.resize();
  }

  /**
   * Sets current theme ('dark' or 'light') and redraws.
   *
   * @param {string} theme
   */
  setTheme(theme) {
    this.theme = theme === 'light' ? 'light' : 'dark';
    this.render();
  }

  /**
   * Adjusts canvas resolution to match container and device pixel ratio.
   */
  resize() {
    if (!this.canvas || !this.ctx || !this.grid) return;

    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width > 0 ? rect.width : (this.canvas.width || 600);
    const height = rect.height > 0 ? rect.height : (this.canvas.height || 600);

    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);

    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);

    const padding = 16;
    const availWidth = Math.max(10, width - padding * 2);
    const availHeight = Math.max(10, height - padding * 2);

    this._cellSize = Math.max(2, Math.min(availWidth / this.grid.cols, availHeight / this.grid.rows));
    this._originX = Math.floor((width - this.grid.cols * this._cellSize) / 2);
    this._originY = Math.floor((height - this.grid.rows * this._cellSize) / 2);

    this.render();
  }

  /**
   * Records visual state for a cell (VISIT, FRONTIER, PATH, CARVE, etc.).
   *
   * @param {number} row
   * @param {number} col
   * @param {string} type
   */
  setCellState(row, col, type) {
    if (!this.grid) return;
    const idx = this.grid.cellIndex(row, col);
    this._cellTypes.set(idx, type);
  }

  /**
   * Sets the active pointer/head cell.
   *
   * @param {number|null} row
   * @param {number|null} col
   */
  setCurrentHead(row, col) {
    this._currentHead = row !== null && col !== null ? { row, col } : null;
  }

  /**
   * Clears solver/path overlays while retaining walls.
   */
  clearOverlays() {
    this._cellTypes.clear();
    this._currentHead = null;
    this.render();
  }

  /**
   * Renders the complete maze view onto the canvas.
   */
  render() {
    if (!this.ctx || !this.grid) return;

    const { ctx, grid, colors } = this;
    const width = this.canvas.clientWidth || (this.canvas.width / (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1));
    const height = this.canvas.clientHeight || (this.canvas.height / (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1));

    // 1. Clear background
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);

    // 2. Draw cell interiors
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        this._drawCellFill(r, c);
      }
    }

    // 3. Draw active head marker
    if (this._currentHead) {
      this._drawCellHead(this._currentHead.row, this._currentHead.col);
    }

    // 4. Draw walls
    this._drawWalls();

    // 5. Draw Start & End badges
    this._drawMarker(grid.start.row, grid.start.col, 'S', colors.start);
    this._drawMarker(grid.end.row, grid.end.col, 'E', colors.end);
  }

  /**
   * Draws a single cell's background fill based on its state.
   * @private
   */
  _drawCellFill(row, col) {
    const { ctx, grid, colors, _cellSize: size, _originX: ox, _originY: oy } = this;
    const cell = grid.getCell(row, col);
    const idx = grid.cellIndex(row, col);
    const type = this._cellTypes.get(idx);

    let fill = colors.unvisited;
    if (type === 'PATH') {
      fill = colors.solutionPath;
    } else if (type === 'VISIT') {
      fill = colors.solverVisited;
    } else if (type === 'FRONTIER') {
      fill = colors.frontier;
    } else if (type === 'CARVE') {
      fill = colors.carveVisited;
    } else if (cell.weight > 1) {
      fill = this.theme === 'light'
        ? (cell.weight >= 5 ? '#FCD34D' : cell.weight >= 3 ? '#FDE68A' : '#FEF3C7')
        : (cell.weight >= 5 ? '#4A3412' : cell.weight >= 3 ? '#382810' : '#291F0C');
    }

    const x = ox + col * size;
    const y = oy + row * size;

    ctx.fillStyle = fill;
    ctx.fillRect(x, y, size, size);

    if (cell.weight > 1 && size >= 16 && type !== 'PATH') {
      ctx.fillStyle = this.theme === 'light' ? '#78350F' : '#FBBF24';
      ctx.font = `bold ${Math.max(8, Math.floor(size * 0.4))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`x${cell.weight}`, x + size / 2, y + size / 2);
    }
  }

  /**
   * Translates viewport canvas coordinates to cell and wall direction.
   *
   * @param {number} canvasX
   * @param {number} canvasY
   * @returns {{row: number, col: number, cell: import('../core/cell.js').Cell, wallDir: number|null, isNearBorder: boolean}|null}
   */
  cellAtPoint(canvasX, canvasY) {
    if (!this.grid) return null;
    const { _cellSize: size, _originX: ox, _originY: oy, grid } = this;

    const col = Math.floor((canvasX - ox) / size);
    const row = Math.floor((canvasY - oy) / size);

    if (!grid.inBounds(row, col)) {
      return null;
    }

    const cellX = (canvasX - ox) - col * size;
    const cellY = (canvasY - oy) - row * size;
    const borderThreshold = Math.max(3, size * 0.28);

    let wallDir = null;
    if (cellY <= borderThreshold) {
      wallDir = WALL_N;
    } else if (cellX >= size - borderThreshold) {
      wallDir = WALL_E;
    } else if (cellY >= size - borderThreshold) {
      wallDir = WALL_S;
    } else if (cellX <= borderThreshold) {
      wallDir = WALL_W;
    }

    return {
      row,
      col,
      cell: grid.getCell(row, col),
      wallDir,
      isNearBorder: wallDir !== null,
    };
  }

  /**
   * Toggles the wall between (row, col) and adjacent neighbor.
   *
   * @param {number} row
   * @param {number} col
   * @param {number} direction
   * @returns {boolean}
   */
  toggleWall(row, col, direction) {
    if (!this.grid || !this.grid.inBounds(row, col)) return false;
    const cell = this.grid.getCell(row, col);
    const deltas = {
      [WALL_N]: [-1, 0],
      [WALL_E]: [0, 1],
      [WALL_S]: [1, 0],
      [WALL_W]: [0, -1],
    };
    const delta = deltas[direction];
    if (!delta) return false;

    const [nRow, nCol] = [row + delta[0], col + delta[1]];
    if (!this.grid.inBounds(nRow, nCol)) return false; // Perimeter wall remains intact

    const neighbor = this.grid.getCell(nRow, nCol);
    if (cell.hasWall(direction)) {
      this.grid.removeWall(cell, neighbor);
    } else {
      this.grid.addWall(cell, neighbor);
    }
    this.render();
    return true;
  }

  /**
   * Cycles cell terrain weight: 1 -> 2 -> 3 -> 5 -> 1.
   *
   * @param {number} row
   * @param {number} col
   */
  cycleWeight(row, col) {
    if (!this.grid || !this.grid.inBounds(row, col)) return;
    const cell = this.grid.getCell(row, col);
    const weights = [1, 2, 3, 5];
    const currIdx = weights.indexOf(cell.weight);
    const nextWeight = weights[(currIdx + 1) % weights.length];
    cell.setWeight(nextWeight);
    this.render();
  }


  /**
   * Highlights the current search or carve pointer.
   * @private
   */
  _drawCellHead(row, col) {
    const { ctx, colors, _cellSize: size, _originX: ox, _originY: oy } = this;
    const x = ox + col * size;
    const y = oy + row * size;

    ctx.fillStyle = colors.carveHead;
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  }

  /**
   * Draws all internal and perimeter walls as clean lines.
   * @private
   */
  _drawWalls() {
    const { ctx, grid, colors, _cellSize: size, _originX: ox, _originY: oy } = this;

    const lineWidth = Math.max(1, Math.min(3, Math.floor(size * 0.1)));
    ctx.strokeStyle = colors.wall;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'square';

    ctx.beginPath();

    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const cell = grid.getCell(r, c);
        const x = ox + c * size;
        const y = oy + r * size;

        // North wall (drawn if cell has wall, or perimeter)
        if (cell.hasWall(WALL_N)) {
          ctx.moveTo(x, y);
          ctx.lineTo(x + size, y);
        }
        // East wall
        if (cell.hasWall(WALL_E)) {
          ctx.moveTo(x + size, y);
          ctx.lineTo(x + size, y + size);
        }
        // South wall
        if (cell.hasWall(WALL_S)) {
          ctx.moveTo(x, y + size);
          ctx.lineTo(x + size, y + size);
        }
        // West wall
        if (cell.hasWall(WALL_W)) {
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + size);
        }
      }
    }

    ctx.stroke();
  }

  /**
   * Draws a badge with letter marker (S / E) for start and end cells.
   * @private
   */
  _drawMarker(row, col, text, color) {
    const { ctx, _cellSize: size, _originX: ox, _originY: oy } = this;
    const cx = ox + col * size + size / 2;
    const cy = oy + row * size + size / 2;
    const radius = Math.max(3, (size / 2) * 0.7);

    // Marker circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Letter label if cell is large enough
    if (size >= 14) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.max(9, Math.floor(size * 0.55))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, cx, cy);
    }
  }
}
