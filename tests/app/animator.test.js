import test from 'node:test';
import assert from 'node:assert/strict';
import { Animator, ANIMATOR_STATES } from '../../src/app/animator.js';
import { Step } from '../../src/core/step.js';
import { Cell } from '../../src/core/cell.js';

test('Animator - initial state is idle with 0 progress', () => {
  const animator = new Animator();
  assert.equal(animator.state, ANIMATOR_STATES.IDLE);
  assert.equal(animator.isRunning, false);
  assert.equal(animator.isPaused, false);
  assert.equal(animator.progress, 0);
});

test('Animator - play empty steps completes immediately', (t, done) => {
  const animator = new Animator();
  animator.play([], () => {}, () => {
    assert.equal(animator.state, ANIMATOR_STATES.COMPLETED);
    done();
  });
});

test('Animator - instant speed (100) processes all steps in one tick', (t, done) => {
  const animator = new Animator({ speed: 100 });
  const cells = [new Cell(0, 0), new Cell(0, 1), new Cell(0, 2)];
  const steps = cells.map((c) => Step.visit(c));

  const executed = [];
  animator.play(
    steps,
    (step) => executed.push(step),
    () => {
      assert.equal(executed.length, 3);
      assert.equal(animator.progress, 1);
      assert.equal(animator.state, ANIMATOR_STATES.COMPLETED);
      done();
    }
  );
});

test('Animator - pause, step, and resume controls', (t, done) => {
  const animator = new Animator({ speed: 5 }); // Slow speed
  const cells = [new Cell(0, 0), new Cell(0, 1), new Cell(0, 2), new Cell(0, 3)];
  const steps = cells.map((c) => Step.visit(c));

  let count = 0;
  animator.play(steps, () => {
    count++;
  });

  // Pause immediately
  animator.pause();
  assert.equal(animator.state, ANIMATOR_STATES.PAUSED);
  assert.equal(animator.isPaused, true);

  const prevCount = count;
  // Step manually while paused
  const stepped = animator.step();
  assert.equal(stepped, true);
  assert.equal(count, prevCount + 1);

  // Resume to instant finish
  animator.setSpeed(100);
  animator.resume();

  setTimeout(() => {
    assert.equal(animator.state, ANIMATOR_STATES.COMPLETED);
    assert.equal(count, 4);
    done();
  }, 50);
});

test('Animator - cancel resets state and stops further ticks', () => {
  const animator = new Animator({ speed: 10 });
  const steps = [Step.visit(new Cell(0, 0)), Step.visit(new Cell(0, 1))];

  animator.play(steps, () => {});
  animator.cancel();

  assert.equal(animator.state, ANIMATOR_STATES.IDLE);
  assert.equal(animator.isRunning, false);
  assert.equal(animator.progress, 0);
});
