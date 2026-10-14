/**
 * @file index.js
 * Generator registry and factory exports.
 */

import { BacktrackerGenerator } from './backtracker.js';
import { PrimGenerator } from './prim.js';
import { KruskalGenerator } from './kruskal.js';
import { WilsonGenerator } from './wilson.js';
import { DivisionGenerator } from './division.js';

export {
  BacktrackerGenerator,
  PrimGenerator,
  KruskalGenerator,
  WilsonGenerator,
  DivisionGenerator,
};

export const GENERATORS = Object.freeze({
  bkt: new BacktrackerGenerator(),
  prm: new PrimGenerator(),
  krk: new KruskalGenerator(),
  wil: new WilsonGenerator(),
  div: new DivisionGenerator(),
});

/**
 * Retrieves a generator instance by id.
 * @param {string} id
 * @returns {import('../types.js').MazeGenerator}
 */
export function getGenerator(id) {
  const gen = GENERATORS[id];
  if (!gen) {
    throw new Error(`Unknown generator id: ${id}`);
  }
  return gen;
}
