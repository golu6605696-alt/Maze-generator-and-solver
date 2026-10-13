import test from 'node:test';
import assert from 'node:assert/strict';
import { Step, STEP_TYPES } from '../../src/core/step.js';
import { Cell } from '../../src/core/cell.js';

test('Step - validates valid step types', () => {
  const cell = new Cell(1, 2);
  for (const type of Object.values(STEP_TYPES)) {
    const step = new Step(type, cell, { info: 'test' });
    assert.equal(step.type, type);
    assert.equal(step.cell, cell);
    assert.deepEqual(step.extra, { info: 'test' });
  }
});

test('Step - rejects invalid step types and invalid cell coordinates', () => {
  const cell = new Cell(0, 0);
  assert.throws(() => new Step('INVALID_ACTION', cell), TypeError);
  assert.throws(() => new Step(STEP_TYPES.VISIT, null), TypeError);
  assert.throws(() => new Step(STEP_TYPES.VISIT, { row: 'zero', col: 0 }), TypeError);
});

test('Step - factory helpers create correct instances', () => {
  const cell = { row: 3, col: 4 };

  const carve = Step.carve(cell, 'East');
  assert.equal(carve.type, STEP_TYPES.CARVE);
  assert.equal(carve.extra, 'East');

  const visit = Step.visit(cell);
  assert.equal(visit.type, STEP_TYPES.VISIT);

  const frontier = Step.frontier(cell);
  assert.equal(frontier.type, STEP_TYPES.FRONTIER);

  const backtrack = Step.backtrack(cell);
  assert.equal(backtrack.type, STEP_TYPES.BACKTRACK);

  const path = Step.path(cell);
  assert.equal(path.type, STEP_TYPES.PATH);

  const wallAdded = Step.wallAdded(cell);
  assert.equal(wallAdded.type, STEP_TYPES.WALL_ADDED);
});

test('Step - toJSON produces serialized object', () => {
  const cell = new Cell(2, 5);
  const step = Step.carve(cell, { direction: 2 });
  const json = step.toJSON();

  assert.deepEqual(json, {
    type: STEP_TYPES.CARVE,
    cell: { row: 2, col: 5 },
    extra: { direction: 2 },
  });
});
