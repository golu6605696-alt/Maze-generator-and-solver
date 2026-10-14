/**
 * @file phantoms.js
 * Phantom timeline and finish tick computation.
 * Defined in RULES.md section 2.3.
 */

import { SURVEY_RATE } from './constants.js';
import { SOLVERS, runSolver } from './solvers/index.js';

export const PHANTOM_DEFS = Object.freeze({
  hound: Object.freeze({
    id: 'hound',
    solverId: 'dfs',
    name: 'The Hound',
    type: 'walker',
    glyph: 'circle',
    colorTerminal: '#c4572f',
    colorSheet: '#a8431f',
  }),
  wallhugger: Object.freeze({
    id: 'wallhugger',
    solverId: 'wfl',
    name: 'The Wallhugger',
    type: 'walker',
    glyph: 'square',
    colorTerminal: '#9c8f6a',
    colorSheet: '#6e6445',
  }),
  surveyor: Object.freeze({
    id: 'surveyor',
    solverId: 'bfs',
    name: 'The Surveyor',
    type: 'surveyor',
    glyph: 'triangle',
    colorTerminal: '#7fa070',
    colorSheet: '#4f7345',
  }),
  pathfinder: Object.freeze({
    id: 'pathfinder',
    solverId: 'ast',
    name: 'The Pathfinder',
    type: 'surveyor',
    glyph: 'diamond',
    colorTerminal: '#e5a93b',
    colorSheet: '#a8741a',
  }),
  auditor: Object.freeze({
    id: 'auditor',
    solverId: 'dij',
    name: 'The Auditor',
    type: 'surveyor',
    glyph: 'cross',
    colorTerminal: '#8398a6',
    colorSheet: '#546a78',
  }),
});

/**
 * Builds phantom execution profiles and finish ticks for a maze.
 * @param {import('./grid.js').Grid} grid
 * @param {string[]} phantomIds Array of phantom ids, e.g. ['hound', 'surveyor']
 * @returns {Array<object>}
 */
export function buildPhantoms(grid, phantomIds) {
  const phantoms = [];

  for (const pid of phantomIds) {
    const def = PHANTOM_DEFS[pid];
    if (!def) continue;

    const solver = SOLVERS[def.solverId];
    if (!solver) continue;

    const res = runSolver(solver, grid, { weighted: true });

    let finishTick = Infinity;
    let status = 'LOST';
    let timeline = [];

    if (def.type === 'walker') {
      if (res.found) {
        status = 'ACTIVE';
        // Trace walk finish tick is cost of entire path or walk
        finishTick = res.cost;
        timeline = res.path;
      }
    } else {
      // Surveyor phantom
      if (res.found) {
        status = 'ACTIVE';
        const surveyDelay = Math.ceil(SURVEY_RATE * res.expanded);
        finishTick = surveyDelay + res.cost;
        timeline = res.path;
      }
    }

    phantoms.push({
      id: def.id,
      name: def.name,
      solverId: def.solverId,
      glyph: def.glyph,
      type: def.type,
      colorTerminal: def.colorTerminal,
      colorSheet: def.colorSheet,
      found: res.found,
      status,
      finishTick,
      hops: res.hops,
      cost: res.cost,
      expanded: res.expanded,
      path: res.path,
    });
  }

  return phantoms;
}
