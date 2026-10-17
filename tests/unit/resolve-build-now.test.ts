import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveBuildNow } from '../../src/utils/career-rpg/resolve-build-now.ts';

describe('resolveBuildNow', () => {
  const current = new Date('2026-10-17T08:00:00Z');

  it('uses the current time when unset or empty', () => {
    assert.equal(resolveBuildNow(undefined, current), current);
    assert.equal(resolveBuildNow('', current), current);
  });

  it('pins a YYYY-MM-DD value to the end of that UTC day', () => {
    assert.equal(resolveBuildNow('2026-10-17').toISOString(), '2026-10-17T23:59:59.999Z');
  });

  it('rejects other formats and impossible dates', () => {
    assert.throws(() => resolveBuildNow('2026-10-17T00:00:00Z'), /must be YYYY-MM-DD/);
    assert.throws(() => resolveBuildNow('17/10/2026'), /must be YYYY-MM-DD/);
    assert.throws(() => resolveBuildNow('2026-02-30'), /not a real date/);
    assert.throws(() => resolveBuildNow('2026-13-01'), /not a real date/);
  });
});
