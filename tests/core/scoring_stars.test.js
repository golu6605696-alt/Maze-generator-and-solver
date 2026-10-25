import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePerformanceStars } from '../../src/core/scoring.js';

test('calculatePerformanceStars - awards 3 stars for efficient navigation and fast time', () => {
  // Easy maze, optimal = 30 steps, player finishes in 32 steps in 15 seconds
  const result = calculatePerformanceStars({
    steps: 32,
    elapsedSec: 15,
    optimalSteps: 30,
    difficulty: 'easy',
  });

  assert.equal(result.stars, 3, 'Should award 3 stars for near-optimal run');
  assert.equal(result.starStr, '⭐⭐⭐');
  assert.ok(result.reason.includes('Flawless') || result.reason.includes('Master'));
  assert.ok(result.parTime > 0);
  assert.ok(result.stepRatio <= 1.35);
});

test('calculatePerformanceStars - awards 2 stars for moderate wandering', () => {
  // Medium maze, optimal = 30 steps, player takes 50 steps in 35 seconds
  const result = calculatePerformanceStars({
    steps: 50,
    elapsedSec: 35,
    optimalSteps: 30,
    difficulty: 'medium',
  });

  assert.equal(result.stars, 2, 'Should award 2 stars for moderate wandering');
  assert.equal(result.starStr, '⭐⭐☆');
});

test('calculatePerformanceStars - awards 1 star minimum for finishing long/slow maze', () => {
  // Hard maze, optimal = 30 steps, player takes 120 steps in 90 seconds
  const result = calculatePerformanceStars({
    steps: 120,
    elapsedSec: 90,
    optimalSteps: 30,
    difficulty: 'hard',
  });

  assert.equal(result.stars, 1, 'Should award 1 star for slow/long completion');
  assert.equal(result.starStr, '⭐☆☆');
});

test('calculatePerformanceStars - handles edge cases gracefully (zero or missing values)', () => {
  const r1 = calculatePerformanceStars({ steps: 0, elapsedSec: 0 });
  assert.ok([1, 2, 3].includes(r1.stars));

  const r2 = calculatePerformanceStars({ steps: 50, elapsedSec: 100, optimalSteps: 0 });
  assert.equal(r2.stars, 1);
});
