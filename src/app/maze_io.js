/**
 * @file maze_io.js
 * Serialization and persistence manager for saving and loading mazes in JSON format.
 * Validates file structure, schema versions, and grid boundaries.
 *
 * Complexity: O(V) time and space for V cells.
 */

import { Grid } from '../core/grid.js';

export class MazeIO {
  /**
   * Serializes a Grid to formatted JSON string matching the ARCHITECTURE.md format.
   *
   * @param {Grid} grid
   * @param {number|string} [seed=null]
   * @returns {string}
   */
  static serialize(grid, seed = null) {
    if (!grid || !(grid instanceof Grid)) {
      throw new TypeError('MazeIO.serialize expects a valid Grid instance');
    }
    const data = grid.toJSON(seed !== '' ? seed : null);
    return JSON.stringify(data, null, 2);
  }

  /**
   * Deserializes a JSON string into a Grid instance.
   *
   * @param {string|object} jsonInput
   * @returns {Grid}
   */
  static deserialize(jsonInput) {
    const data = typeof jsonInput === 'string' ? JSON.parse(jsonInput) : jsonInput;

    if (!data || typeof data !== 'object') {
      throw new TypeError('Invalid maze data: payload must be an object');
    }
    if (data.version !== 1) {
      throw new Error(`Unsupported maze format version: ${data.version}. Expected version 1.`);
    }
    if (!Number.isInteger(data.rows) || !Number.isInteger(data.cols)) {
      throw new TypeError('Invalid dimensions: rows and cols must be integers');
    }
    if (!Array.isArray(data.cells) || data.cells.length !== data.rows * data.cols) {
      throw new RangeError(`Cells payload length (${data.cells?.length}) does not match dimensions (${data.rows}x${data.cols})`);
    }

    return Grid.fromJSON(data);
  }

  /**
   * Triggers a browser download of the maze JSON file.
   *
   * @param {Grid} grid
   * @param {number|string} [seed=null]
   * @param {string} [filename='maze.json']
   */
  static download(grid, seed = null, filename = 'maze.json') {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const json = MazeIO.serialize(grid, seed);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Reads a File object asynchronously and reconstructs a Grid.
   *
   * @param {File} file
   * @returns {Promise<Grid>}
   */
  static async upload(file) {
    if (!file) throw new Error('No file provided');
    const text = await file.text();
    return MazeIO.deserialize(text);
  }
}
