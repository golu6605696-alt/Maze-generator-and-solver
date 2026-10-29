/**
 * @file patterns.js
 * Procedural tileable canvas patterns for terrain and fog.
 * Supports: 'sheet', 'cyber', 'jungle'.
 */

import { TerrainType } from '../../core/constants.js';

export class PatternManager {
  /**
   * @param {string} theme
   */
  constructor(theme = 'sheet') {
    this._theme = theme;
    this._patterns = new Map();
  }

  setTheme(theme) {
    this._theme = theme;
    this._patterns.clear();
  }

  /**
   * Gets or creates a canvas pattern for the given terrain or fog type.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number|string} type TerrainType or 'fog_hatch'
   * @returns {CanvasPattern|string}
   */
  getPattern(ctx, type) {
    const key = `${this._theme}_${type}`;
    if (this._patterns.has(key)) {
      return this._patterns.get(key);
    }

    const patternCanvas = document.createElement('canvas');
    const pCtx = patternCanvas.getContext('2d');
    const theme = this._theme;

    if (type === 'fog_hatch') {
      // 45-degree hatch lines every 4 px
      patternCanvas.width = 8;
      patternCanvas.height = 8;
      if (theme === 'cyber') pCtx.strokeStyle = 'rgba(0,245,255,0.18)';
      else if (theme === 'jungle') pCtx.strokeStyle = 'rgba(52,211,153,0.15)';
      else pCtx.strokeStyle = 'rgba(27,34,36,0.15)'; // sheet

      pCtx.lineWidth = 1;
      pCtx.beginPath();
      pCtx.moveTo(0, 8);
      pCtx.lineTo(8, 0);
      pCtx.moveTo(-4, 4);
      pCtx.lineTo(4, -4);
      pCtx.moveTo(4, 12);
      pCtx.lineTo(12, 4);
      pCtx.stroke();
    } else if (type === TerrainType.BRIDGE) {
      // Plank lines
      patternCanvas.width = 8;
      patternCanvas.height = 8;
      if (theme === 'cyber') {
        pCtx.fillStyle = '#1e1b4b';
        pCtx.fillRect(0, 0, 8, 8);
        pCtx.strokeStyle = '#6366f1';
      } else if (theme === 'jungle') {
        pCtx.fillStyle = '#5c4033';
        pCtx.fillRect(0, 0, 8, 8);
        pCtx.strokeStyle = '#38220f';
      } else { // sheet
        pCtx.fillStyle = '#b79d72';
        pCtx.fillRect(0, 0, 8, 8);
        pCtx.strokeStyle = '#8c7553';
      }
      pCtx.lineWidth = 1;
      pCtx.beginPath();
      pCtx.moveTo(0, 4);
      pCtx.lineTo(8, 4);
      pCtx.moveTo(0, 8);
      pCtx.lineTo(8, 8);
      pCtx.stroke();
    } else if (type === TerrainType.MUD) {
      // Stipple dots
      patternCanvas.width = 6;
      patternCanvas.height = 6;
      if (theme === 'cyber') {
        pCtx.fillStyle = '#4a044e';
        pCtx.fillRect(0, 0, 6, 6);
        pCtx.fillStyle = '#c026d3';
      } else if (theme === 'jungle') {
        pCtx.fillStyle = '#1e3a1e';
        pCtx.fillRect(0, 0, 6, 6);
        pCtx.fillStyle = '#0f220f';
      } else { // sheet
        pCtx.fillStyle = '#a89f77';
        pCtx.fillRect(0, 0, 6, 6);
        pCtx.fillStyle = '#6f694e';
      }
      pCtx.fillRect(1, 1, 1, 1);
      pCtx.fillRect(4, 4, 1, 1);
    } else if (type === TerrainType.RUINS) {
      // Broken cross-hatch with gaps
      patternCanvas.width = 8;
      patternCanvas.height = 8;
      if (theme === 'cyber') {
        pCtx.fillStyle = '#1e293b';
        pCtx.fillRect(0, 0, 8, 8);
        pCtx.strokeStyle = '#38bdf8';
      } else if (theme === 'jungle') {
        pCtx.fillStyle = '#2d372e';
        pCtx.fillRect(0, 0, 8, 8);
        pCtx.strokeStyle = '#1b231c';
      } else { // sheet
        pCtx.fillStyle = '#a38b78';
        pCtx.fillRect(0, 0, 8, 8);
        pCtx.strokeStyle = '#6b584b';
      }
      pCtx.lineWidth = 1;
      pCtx.beginPath();
      pCtx.moveTo(0, 0);
      pCtx.lineTo(4, 4);
      pCtx.moveTo(4, 8);
      pCtx.lineTo(8, 4);
      pCtx.stroke();
    } else if (type === 6) { // RUBBLE
      // Dense cross-hatch, no gaps
      patternCanvas.width = 6;
      patternCanvas.height = 6;
      if (theme === 'cyber') {
        pCtx.fillStyle = '#312e81';
        pCtx.fillRect(0, 0, 6, 6);
        pCtx.strokeStyle = '#ec4899';
      } else if (theme === 'jungle') {
        pCtx.fillStyle = '#1f2923';
        pCtx.fillRect(0, 0, 6, 6);
        pCtx.strokeStyle = '#111814';
      } else { // sheet
        pCtx.fillStyle = '#a38b78';
        pCtx.fillRect(0, 0, 6, 6);
        pCtx.strokeStyle = '#4e3f35';
      }
      pCtx.lineWidth = 1;
      pCtx.beginPath();
      pCtx.moveTo(0, 0);
      pCtx.lineTo(6, 6);
      pCtx.moveTo(0, 6);
      pCtx.lineTo(6, 0);
      pCtx.stroke();
    }

    const pattern = ctx.createPattern(patternCanvas, 'repeat');
    this._patterns.set(key, pattern);
    return pattern;
  }
}
