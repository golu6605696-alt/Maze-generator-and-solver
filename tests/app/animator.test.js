import test from 'node:test';
import assert from 'node:assert/strict';
import { PlaybackTicker, PlaybackState } from '../../src/app/playback_ticker.js';

test('PlaybackTicker - starts in STOPPED state and responds to step()', () => {
  const steps = [1, 2, 3];
  let doneVal = null;
  const executed = [];

  const ticker = new PlaybackTicker({
    getIterator: function* () {
      for (const s of steps) yield s;
      return 'FIN';
    },
    onStep: (e) => executed.push(e),
    onDone: (val) => { doneVal = val; },
  });

  assert.equal(ticker.state, PlaybackState.STOPPED);

  ticker.step();
  assert.equal(executed.length, 1);
  assert.equal(executed[0], 1);
  assert.equal(ticker.state, PlaybackState.PAUSED);

  ticker.step();
  assert.equal(executed.length, 2);
  assert.equal(executed[1], 2);

  ticker.step();
  assert.equal(executed.length, 3);
  assert.equal(executed[2], 3);

  // Next step completes
  ticker.step();
  assert.equal(ticker.state, PlaybackState.DONE);
  assert.equal(doneVal, 'FIN');
});
