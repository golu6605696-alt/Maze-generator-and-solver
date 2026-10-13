/**
 * @file reconstruct.js
 * Backtracks from target cell to source cell using a parent mapping to reconstruct the solution path.
 *
 * Complexity: O(L) time and space, where L is the path length.
 */

/**
 * Reconstructs the solution path from the parent map by walking backwards from end to start.
 *
 * @param {Array<import('../cell.js').Cell|null>} parentMap - Parent cell for each cell index
 * @param {import('../cell.js').Cell} start - Starting cell
 * @param {import('../cell.js').Cell} end - Destination cell
 * @param {import('../grid.js').Grid} grid - Maze grid
 * @returns {import('../cell.js').Cell[]} Array of cells from start to end (inclusive), or empty array if unreachable
 */
export function reconstructPath(parentMap, start, end, grid) {
  if (!parentMap || !start || !end || !grid) {
    return [];
  }

  const startIdx = grid.cellIndex(start.row, start.col);
  const endIdx = grid.cellIndex(end.row, end.col);

  // Identity path if start and end are the same cell
  if (startIdx === endIdx) {
    return [start];
  }

  // If destination was never reached
  if (!parentMap[endIdx]) {
    return [];
  }

  const path = [];
  let curr = end;

  while (curr !== null) {
    path.push(curr);
    if (curr.row === start.row && curr.col === start.col) {
      break;
    }
    const currIdx = grid.cellIndex(curr.row, curr.col);
    curr = parentMap[currIdx];
  }

  // Ensure path starts at the desired start cell
  const root = path[path.length - 1];
  if (!root || root.row !== start.row || root.col !== start.col) {
    return [];
  }

  path.reverse();
  return path;
}
