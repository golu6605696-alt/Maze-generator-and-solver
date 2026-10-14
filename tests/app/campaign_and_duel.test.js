import test from 'node:test';
import assert from 'node:assert/strict';
import { CampaignStore, CAMPAIGN_WORLDS } from '../../src/app/campaign_store.js';
import { DuelController, DuelState } from '../../src/app/duel_controller.js';
import { Wall } from '../../src/core/constants.js';

test('CampaignStore - initializes with 5 worlds and 15 levels', () => {
  const store = new CampaignStore();
  assert.equal(CAMPAIGN_WORLDS.length, 5);
  assert.equal(store.totalLevels, 15);

  // Level 1 should be unlocked by default
  assert.equal(store.isUnlocked(1), true);
  // Level 2 should be locked by default (if no previous localStorage)
  // Total completed starts at 0 or matches store
  assert.equal(typeof store.completedCount, 'number');
  assert.equal(typeof store.totalStars, 'number');
});

test('CampaignStore - recordLevelCompletion unlocks next level and saves stars', () => {
  const store = new CampaignStore();
  store.reset();
  assert.equal(store.isUnlocked(1), true);
  assert.equal(store.isUnlocked(2), false);

  const record = store.recordLevelCompletion(1, 850, 15);
  assert.equal(record.stars, 3);
  assert.equal(record.highScore, 850);
  assert.equal(store.isUnlocked(2), true);
  assert.equal(store.completedCount >= 1, true);
  assert.equal(store.totalStars >= 3, true);
});

test('DuelController - initializes, loads map, and starts race', () => {
  let updates = 0;
  const duel = new DuelController({
    onUpdate: () => { updates++; },
    onSound: () => {},
  });

  duel.load('v1/15x15/bkt/TESTDUEL/b20/t10/srv');
  assert.equal(duel.state, DuelState.READY);
  assert.equal(duel.p1.cell, duel.grid.start);
  assert.equal(duel.p2.cell, duel.grid.start);
  assert.equal(duel.winner, null);

  duel.start();
  assert.equal(duel.state, DuelState.RACING);
  assert.equal(updates > 0, true);
  duel.destroy();
});

test('DuelController - supports independent P1 (WASD) and P2 (Arrow) movement', () => {
  const duel = new DuelController({
    onUpdate: () => {},
    onSound: () => {},
  });

  duel.load('v1/15x15/bkt/TESTDUEL2/b20/t10/srv');
  duel.start();

  // Try moving both players in valid or wall directions
  duel.moveP1(Wall.E);
  duel.moveP2(Wall.S);

  // Steps or bumps must have registered
  assert.equal(duel.p1.steps + duel.p1.bumps > 0, true);
  assert.equal(duel.p2.steps + duel.p2.bumps > 0, true);

  duel.destroy();
  assert.equal(duel._timerInterval, null);
});
