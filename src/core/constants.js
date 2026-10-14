/**
 * @file constants.js
 * Central named constants for Expedition Cartographer.
 * Defined in PRD.md, RULES.md, and ARCHITECTURE.md.
 */

export const Wall = Object.freeze({
  N: 1,
  E: 2,
  S: 4,
  W: 8,
  ALL: 15,
});

/** Canonical order for neighbors: N, E, S, W */
export const DIRS = Object.freeze([Wall.N, Wall.E, Wall.S, Wall.W]);
export const DR = Object.freeze([-1, 0, 1, 0]);
export const DC = Object.freeze([0, 1, 0, -1]);

export const OPPOSITE = Object.freeze({
  [Wall.N]: Wall.S,
  [Wall.E]: Wall.W,
  [Wall.S]: Wall.N,
  [Wall.W]: Wall.E,
});

export const DIR_NAMES = Object.freeze({
  [Wall.N]: 'N',
  [Wall.E]: 'E',
  [Wall.S]: 'S',
  [Wall.W]: 'W',
});

export const NAME_TO_DIR = Object.freeze({
  N: Wall.N,
  E: Wall.E,
  S: Wall.S,
  W: Wall.W,
});

export const TerrainType = Object.freeze({
  PLAIN: 0,
  BRIDGE: 1,
  MUD: 2,
  RUINS: 3,
});

export const TERRAIN = Object.freeze({
  [TerrainType.PLAIN]:  Object.freeze({ id: 0, key: 'plain',  cost: 1 }),
  [TerrainType.BRIDGE]: Object.freeze({ id: 1, key: 'bridge', cost: 2 }),
  [TerrainType.MUD]:    Object.freeze({ id: 2, key: 'mud',    cost: 3 }),
  [TerrainType.RUINS]:  Object.freeze({ id: 3, key: 'ruins',  cost: 4, rubbleCost: 6 }),
});

export const RUBBLE_COST = 6;
export const MIN_WEIGHT = 1;

export const FogState = Object.freeze({
  UNSEEN: 0,
  REMEMBERED: 1,
  VISIBLE: 2,
});

export const DIFFICULTIES = Object.freeze({
  scn: Object.freeze({
    code: 'scn',
    name: 'Scout',
    rows: 21,
    cols: 21,
    radius: 6,
    slack: 2.50,
    braidPct: 15,
    terrainPct: 10,
    phantoms: ['hound'],
    mult: 0.8,
  }),
  srv: Object.freeze({
    code: 'srv',
    name: 'Surveyor',
    rows: 31,
    cols: 31,
    radius: 5,
    slack: 1.75,
    braidPct: 20,
    terrainPct: 15,
    phantoms: ['hound', 'surveyor'],
    mult: 1.0,
  }),
  pth: Object.freeze({
    code: 'pth',
    name: 'Pathfinder',
    rows: 45,
    cols: 45,
    radius: 4,
    slack: 1.35,
    braidPct: 25,
    terrainPct: 20,
    phantoms: ['hound', 'surveyor', 'pathfinder'],
    mult: 1.2,
  }),
  nmr: Object.freeze({
    code: 'nmr',
    name: 'Nightmare',
    rows: 61,
    cols: 61,
    radius: 3,
    slack: 1.15,
    braidPct: 30,
    terrainPct: 25,
    phantoms: ['hound', 'wallhugger', 'surveyor', 'pathfinder', 'auditor'],
    mult: 1.5,
  }),
});

export const RelicKind = Object.freeze({
  RATION: 'ration',
  LANTERN_OIL: 'lantern_oil',
  COMPASS: 'compass',
});

export const RELIC_SPECS = Object.freeze({
  [RelicKind.RATION]: Object.freeze({
    name: 'Ration',
    desc: '+6 stamina budget',
    score: 40,
    bonusStamina: 6,
  }),
  [RelicKind.LANTERN_OIL]: Object.freeze({
    name: 'Lantern Oil',
    desc: '+2 lantern radius for 25 moves',
    score: 40,
    radiusBonus: 2,
    moves: 25,
  }),
  [RelicKind.COMPASS]: Object.freeze({
    name: 'Compass',
    desc: 'Shows exit bearing & distance for 15 moves',
    score: 40,
    moves: 15,
  }),
});

export const SURVEY_RATE = 0.25; // ticks per expanded cell for surveyor phantoms
export const TPAR_PER_CELL = 0.45; // wall-clock par seconds per cell
export const FRAME_BUDGET_MS = 6;
export const SPEED_DETENTS = Object.freeze([1, 2, 5, 10, 30, 100, 300, 1000, Infinity]);
