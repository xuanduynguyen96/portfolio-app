import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatClock, remainingSeconds } from '../../src/utils/career-rpg/countdown-clock.ts';

describe('countdown clock', () => {
  it('counts whole seconds down from the total', () => {
    assert.equal(remainingSeconds(60, 0), 60);
    assert.equal(remainingSeconds(60, 999), 60);
    assert.equal(remainingSeconds(60, 1000), 59);
    assert.equal(remainingSeconds(60, 59_999), 1);
  });

  it('stops at zero and ignores negative elapsed time', () => {
    assert.equal(remainingSeconds(60, 60_000), 0);
    assert.equal(remainingSeconds(60, 3_600_000), 0);
    assert.equal(remainingSeconds(60, -5_000), 60);
  });

  it('formats mm:ss and shows GG when time is up', () => {
    assert.deepEqual([60, 59, 10, 1, 0, -1, 125].map(formatClock), ['01:00', '00:59', '00:10', '00:01', 'GG', 'GG', '02:05']);
  });
});
