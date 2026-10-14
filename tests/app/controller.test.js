import test from 'node:test';
import assert from 'node:assert/strict';
import { ExpeditionController, ExpeditionState } from '../../src/app/expedition_controller.js';

test('ExpeditionController - load initializes briefing and parameters', () => {
  const ctrl = new ExpeditionController({});
  ctrl.load('v1/15x15/bkt/CTRL_TEST/b15/t10/srv');

  assert.equal(ctrl.state, ExpeditionState.BRIEFING);
  assert.equal(ctrl.grid.rows, 15);
  assert.equal(ctrl.grid.cols, 15);
  assert.ok(ctrl.budget > 0);
  assert.equal(ctrl.spent, 0);
  assert.equal(ctrl.scoutCell, ctrl.grid.start);
  assert.ok(ctrl.phantoms.length > 0);
});

test('ExpeditionController - move spends stamina and tracks bumps', () => {
  const ctrl = new ExpeditionController({});
  ctrl.load('v1/15x15/bkt/CTRL_TEST_2/b0/t0/srv');
  ctrl.start();

  assert.equal(ctrl.state, ExpeditionState.PLAYING);

  // Attempt bump into north border wall (at row 0)
  ctrl.move(1, 'N');
  assert.equal(ctrl.bumps, 1);
  assert.equal(ctrl.spent, 0); // bumps cost 0
  ctrl.destroy();
});
