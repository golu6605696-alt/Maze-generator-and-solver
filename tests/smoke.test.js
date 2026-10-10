import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Environment & Test Runner Smoke Test', () => {
  it('verifies node test runner and assert work as expected', () => {
    assert.equal(1 + 1, 2);
    assert.deepEqual({ a: 1 }, { a: 1 });
  });
});
