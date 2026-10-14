/**
 * @file benchmark_runner.js
 * Benchmark runner measuring algorithm performance across grid sizes.
 * Collects median time, IQR, cells expanded, frontier peak, path hops, and cost.
 */

import { Grid } from '../core/grid.js';
import { Rng } from '../structures/rng.js';
import { getGenerator } from '../core/generators/index.js';
import { getSolver } from '../core/solvers/index.js';
import { braid } from '../core/braid.js';
import { assignTerrain } from '../core/terrain.js';
import { drain } from '../core/iter.js';

/**
 * Runs a benchmark suite across sizes and solvers.
 * @param {object} params
 * @param {number[]} params.sizes e.g. [20, 40, 60]
 * @param {string[]} params.solvers e.g. ['dfs', 'bfs', 'dij', 'ast']
 * @param {string} [params.generator='bkt']
 * @param {number} [params.trials=5]
 * @param {number} [params.braidPct=20]
 * @param {number} [params.terrainPct=15]
 * @param {(progress: { current: number, total: number, solver: string, size: number }) => void} [onProgress]
 * @returns {Promise<object>}
 */
export async function runBenchmark({
  sizes = [20, 40, 60],
  solvers = ['dfs', 'bfs', 'dij', 'ast', 'wfl'],
  generator = 'bkt',
  trials = 5,
  braidPct = 20,
  terrainPct = 15,
}, onProgress) {
  const total = sizes.length * solvers.length * trials;
  let current = 0;
  const results = {};

  for (const solverId of solvers) {
    results[solverId] = {};
    for (const size of sizes) {
      results[solverId][size] = {
        times: [],
        expanded: [],
        hops: [],
        cost: [],
        frontierPeak: [],
      };
    }
  }

  const gen = getGenerator(generator);

  for (const size of sizes) {
    for (let trial = 0; trial < trials; trial++) {
      const seed = `bench_${size}_${trial}`;
      const rng = new Rng(seed);
      const grid = new Grid(size, size, true);

      // Build maze
      drain(gen.generate(grid, rng));
      if (braidPct > 0) braid(grid, braidPct, rng);
      if (terrainPct > 0) assignTerrain(grid, terrainPct, rng);

      for (const solverId of solvers) {
        if (onProgress) {
          onProgress({ current: ++current, total, solver: solverId, size });
        }

        const solver = getSolver(solverId);

        // Batched timing: repeat until at least 5 ms elapsed
        let reps = 0;
        const t0 = performance.now();
        let res;
        do {
          res = drain(solver.solve(grid, { weighted: true }));
          reps++;
        } while (performance.now() - t0 < 5 && reps < 50);

        const elapsed = (performance.now() - t0) / reps;

        const entry = results[solverId][size];
        entry.times.push(elapsed);
        entry.expanded.push(res.expanded);
        entry.hops.push(res.hops);
        entry.cost.push(res.cost);
        entry.frontierPeak.push(res.frontierPeak);

        // Yield to prevent locking UI
        await new Promise(r => setTimeout(r, 0));
      }
    }
  }

  // Compute summary stats (median, IQR)
  const summary = {};
  for (const sId of solvers) {
    summary[sId] = {};
    for (const size of sizes) {
      const e = results[sId][size];
      e.times.sort((a, b) => a - b);
      const mid = Math.floor(e.times.length / 2);
      const medianTime = e.times.length % 2 !== 0 ? e.times[mid] : (e.times[mid - 1] + e.times[mid]) / 2;

      const q1 = e.times[Math.floor(e.times.length * 0.25)];
      const q3 = e.times[Math.floor(e.times.length * 0.75)];
      const iqr = q3 - q1;

      const avgExp = Math.round(e.expanded.reduce((a, b) => a + b, 0) / e.expanded.length);
      const avgHops = Math.round(e.hops.reduce((a, b) => a + b, 0) / e.hops.length);
      const avgCost = Math.round(e.cost.reduce((a, b) => a + b, 0) / e.cost.length);
      const avgPeak = Math.round(e.frontierPeak.reduce((a, b) => a + b, 0) / e.frontierPeak.length);

      summary[sId][size] = {
        medianTimeMs: Math.round(medianTime * 100) / 100,
        iqrMs: Math.round(iqr * 100) / 100,
        avgExpanded: avgExp,
        avgHops,
        avgCost,
        avgFrontierPeak: avgPeak,
      };
    }
  }

  return {
    params: { sizes, solvers, generator, trials, braidPct, terrainPct },
    raw: results,
    summary,
  };
}
