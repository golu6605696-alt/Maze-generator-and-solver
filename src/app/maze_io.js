/**
 * @file maze_io.js
 * Serialization, deserialization, and schema v1->v2 migration for mazes and runs.
 */

import { Grid } from '../core/grid.js';
import { validate } from '../core/validate.js';

/**
 * Serializes a Grid into Maze JSON v2 format.
 * @param {Grid} grid
 * @param {object} [extra]
 * @returns {string} JSON string
 */
export function exportMazeJson(grid, extra = {}) {
  const data = {
    format: 'expedition-maze',
    version: 2,
    code: extra.code || '',
    rows: grid.rows,
    cols: grid.cols,
    start: grid.start,
    end: grid.end,
    walls: Array.from(grid.walls),
    terrain: Array.from(grid.terrain),
    elevation: Array.from(grid.elevation),
    relics: extra.relics || [],
    edited: extra.edited || false,
    fingerprint: grid.fingerprint().toString(16),
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Parses and validates Maze JSON (v2 or migrates v1).
 * @param {string|object} input
 * @returns {{ grid: Grid, relics: Array, code: string, edited: boolean }}
 */
export function importMazeJson(input) {
  const data = typeof input === 'string' ? JSON.parse(input) : input;

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid maze JSON data');
  }

  // Schema v2
  if (data.version === 2 || data.format === 'expedition-maze') {
    const grid = new Grid(data.rows, data.cols, false);
    grid.start = data.start;
    grid.end = data.end;

    grid.walls.set(data.walls);
    if (data.terrain) grid.terrain.set(data.terrain);
    if (data.elevation) grid.elevation.set(data.elevation);

    const val = validate(grid);
    if (!val.symmetric || !val.bordersClosed) {
      throw new Error('Imported maze fails graph integrity (unsymmetric walls or leaking borders)');
    }

    return {
      grid,
      relics: data.relics || [],
      code: data.code || '',
      edited: data.edited || false,
    };
  }

  // Legacy v1 migration
  if (data.cells && Array.isArray(data.cells)) {
    const rows = data.rows || Math.sqrt(data.cells.length);
    const cols = data.cols || rows;
    const grid = new Grid(rows, cols, false);
    grid.start = data.start !== undefined ? data.start : 0;
    grid.end = data.end !== undefined ? data.end : grid.size - 1;

    for (let i = 0; i < data.cells.length; i++) {
      const c = data.cells[i];
      grid.walls[i] = c.w !== undefined ? c.w : (c.walls !== undefined ? c.walls : 15);
      grid.terrain[i] = c.terrain !== undefined ? c.terrain : 0;
    }

    return {
      grid,
      relics: [],
      code: '',
      edited: true,
    };
  }

  throw new Error(`Unsupported maze file version or format: ${data.version || 'unknown'}`);
}

/**
 * Serializes an Expedition Run into Run JSON format.
 * @param {object} run
 * @returns {string}
 */
export function exportRunJson(run) {
  const data = {
    format: 'expedition-run',
    version: 1,
    code: run.code,
    moves: run.moves,
    score: run.score,
    phantoms: run.phantoms || [],
  };
  return JSON.stringify(data, null, 2);
}
