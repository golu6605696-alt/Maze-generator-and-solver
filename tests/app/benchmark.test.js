import test from 'node:test';
import assert from 'node:assert/strict';
import { runBenchmark } from '../../src/app/benchmark_runner.js';

test('runBenchmark - executes suite and calculates median/iqr metrics', async () => {
  const res = await runBenchmark({
    sizes: [10],
    solvers: ['bfs', 'ast'],
    generator: 'bkt',
    trials: 2,
  });

  assert.ok(res.summary);
  assert.ok(res.summary.bfs);
  assert.ok(res.summary.ast);
  assert.ok(res.summary.bfs[10]);
  assert.ok(res.summary.ast[10]);

  const bfsMetrics = res.summary.bfs[10];
  assert.ok(bfsMetrics.medianTimeMs >= 0);
  assert.ok(bfsMetrics.avgExpanded > 0);
  assert.ok(bfsMetrics.avgHops > 0);
});
