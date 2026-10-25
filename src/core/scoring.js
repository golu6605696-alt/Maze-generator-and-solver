/**
 * @file scoring.js
 * Expedition scoring and grade calculations.
 * Defined in RULES.md section 2.2.
 */

import { TPAR_PER_CELL, DIFFICULTIES } from './constants.js';

/**
 * Computes the score, factors, and grade for an Expedition run.
 * @param {object} params
 * @param {number} params.optCost Optimal reference cost (Dijkstra)
 * @param {number} params.playerCost Total stamina spent
 * @param {number} params.L Optimal path length (cells count, start and end included)
 * @param {number} params.D Distinct cells entered (including start)
 * @param {number} params.Rv Number of moves into already-visited cells
 * @param {number} params.t Active wall-clock seconds
 * @param {string} [params.difficulty='srv']
 * @param {number} [params.relicsCollected=0]
 * @param {number} [params.phantomsBeaten=0]
 * @param {boolean} [params.isZen=false]
 * @returns {object}
 */
export function computeScore({
  optCost,
  playerCost,
  L,
  D,
  Rv,
  t,
  difficulty = 'srv',
  relicsCollected = 0,
  phantomsBeaten = 0,
  isZen = false,
}) {
  const diffSpec = DIFFICULTIES[difficulty] || { mult: 1.0 };
  let M = diffSpec.mult;

  // 1. Efficiency factor E in [0, 1]
  const E = playerCost > 0 ? Math.min(1, Math.max(0, optCost / playerCost)) : 1;

  // 2. Time factor T in [0.20, 1]
  const tPar = TPAR_PER_CELL * L;
  let T = 1;
  if (!isZen) {
    T = t > 0 ? Math.min(1, Math.max(0.20, tPar / t)) : 1;
  } else {
    M *= 0.9;
  }

  // 3. Exploration factor X in [0, 1]
  const W = Math.max(0, D - L) + Rv;
  const X = L > 0 ? Math.min(1, Math.max(0, 1 - W / (2 * L))) : 1;

  // 4. Base score in [0, 1000]
  const base = Math.round(1000 * (0.50 * E + 0.25 * T + 0.25 * X));

  // 5. Total score with multiplier and bonuses
  const total = Math.round(base * M) + 40 * relicsCollected + 100 * phantomsBeaten;

  // 6. Grade from base score
  let grade = 'D';
  if (base >= 920) grade = 'S';
  else if (base >= 800) grade = 'A';
  else if (base >= 650) grade = 'B';
  else if (base >= 500) grade = 'C';

  return {
    base,
    total,
    grade,
    E: Math.round(E * 1000) / 1000,
    T: Math.round(T * 1000) / 1000,
    X: Math.round(X * 1000) / 1000,
    W,
    optCost,
    playerCost,
    L,
    D,
    Rv,
    t: Math.round(t * 10) / 10,
    tPar: Math.round(tPar * 10) / 10,
    mult: M,
    relicsCollected,
    phantomsBeaten,
    isZen,
  };
}

/**
 * Calculates 1, 2, or 3 stars performance rating based on steps taken, elapsed time,
 * optimal path length, and maze difficulty.
 *
 * @param {object} params
 * @param {number} params.steps Player steps taken
 * @param {number} params.elapsedSec Time taken in seconds
 * @param {number} [params.optimalSteps=25] Minimum steps to reach exit (BFS length)
 * @param {string} [params.difficulty='easy'] Difficulty ('easy', 'medium', 'hard')
 * @returns {{ stars: 1|2|3, parTime: number, optimalSteps: number, reason: string, starStr: string }}
 */
export function calculatePerformanceStars({
  steps,
  elapsedSec,
  optimalSteps = 25,
  difficulty = 'easy',
}) {
  const opt = Math.max(1, optimalSteps);
  const diffMultiplier = difficulty === 'hard' ? 1.4 : (difficulty === 'medium' ? 1.15 : 1.0);

  // Par time (seconds): baseline ~0.75s per optimal cell * difficulty multiplier
  const parTime = Math.max(10, Math.round(opt * 0.75 * diffMultiplier));

  const stepRatio = steps / opt;
  const timeRatio = elapsedSec / parTime;

  let stars = 1;
  let reason = 'Maze Conquered!';

  // 3 Stars: Efficient steps AND quick time (or near-optimal on either)
  if (
    (stepRatio <= 1.35 && timeRatio <= 1.35) ||
    (steps <= opt + 4 && timeRatio <= 1.8) ||
    (timeRatio <= 0.8 && stepRatio <= 1.6)
  ) {
    stars = 3;
    reason = 'Flawless Master Run!';
  } else if (
    (stepRatio <= 2.2 && timeRatio <= 2.2) ||
    (stepRatio <= 1.65) ||
    (timeRatio <= 1.35)
  ) {
    stars = 2;
    reason = 'Great Exploration!';
  } else {
    stars = 1;
    reason = 'Maze Conquered!';
  }

  const starStr = stars === 3 ? '⭐⭐⭐' : (stars === 2 ? '⭐⭐☆' : '⭐☆☆');

  return {
    stars,
    parTime,
    optimalSteps: opt,
    reason,
    starStr,
    stepRatio: Math.round(stepRatio * 100) / 100,
    timeRatio: Math.round(timeRatio * 100) / 100,
  };
}
