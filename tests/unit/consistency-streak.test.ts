import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  computeStreak,
  validateChangelog,
  weekStartUtc,
} from '../../src/utils/career-rpg/consistency-streak.ts';
import { entry, NOW } from './career-fixtures.ts';

const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

describe('weekStartUtc', () => {
  it('returns Monday 00:00 UTC of the ISO week', () => {
    assert.equal(iso(weekStartUtc(NOW)), '2026-10-12'); // Saturday -> Monday
    assert.equal(iso(weekStartUtc(new Date('2026-10-12T00:00:00Z'))), '2026-10-12');
  });

  it('puts Sunday in the previous week (Sunday/Monday boundary)', () => {
    assert.equal(iso(weekStartUtc(new Date('2026-10-11T23:59:59Z'))), '2026-10-05');
  });

  it('crosses the year boundary', () => {
    assert.equal(iso(weekStartUtc(new Date('2027-01-01T08:00:00Z'))), '2026-12-28');
  });
});

describe('computeStreak', () => {
  it('counts consecutive weeks ending this week', () => {
    const streak = computeStreak([entry('a', '2026-10-14'), entry('b', '2026-10-07'), entry('c', '2026-09-30')], NOW);
    assert.deepEqual({ current: streak.current, longest: streak.longest }, { current: 3, longest: 3 });
    assert.equal(streak.lastEntryDate?.toISOString().slice(0, 10), '2026-10-14');
  });

  it('resets on a gap week', () => {
    assert.equal(computeStreak([entry('a', '2026-10-14'), entry('c', '2026-09-30')], NOW).current, 1);
  });

  it('gives the open current week grace', () => {
    assert.equal(computeStreak([entry('b', '2026-10-07'), entry('c', '2026-09-30')], NOW).current, 2);
  });

  it('breaks when neither this nor last week has an entry', () => {
    const streak = computeStreak([entry('c', '2026-09-30')], NOW);
    assert.equal(streak.current, 0);
    assert.equal(streak.longest, 1);
  });

  it('counts two entries in one week once', () => {
    const streak = computeStreak([entry('a', '2026-10-12'), entry('b', '2026-10-16')], NOW);
    assert.equal(streak.current, 1);
    assert.equal(streak.longest, 1);
  });

  it('spans the year boundary', () => {
    const now = new Date('2027-01-06T12:00:00Z');
    assert.equal(computeStreak([entry('a', '2026-12-31'), entry('b', '2027-01-04')], now).current, 2);
  });

  it('tracks the longest run separately from the current one', () => {
    const streak = computeStreak(
      [entry('x', '2026-06-01'), entry('y', '2026-06-08'), entry('z', '2026-06-15'), entry('now', '2026-10-15')],
      NOW,
    );
    assert.equal(streak.current, 1);
    assert.equal(streak.longest, 3);
  });

  it('ignores entries with too-short bodies and future entries', () => {
    const streak = computeStreak([entry('short', '2026-10-14', 39), entry('future', '2026-10-19')], NOW);
    assert.deepEqual(streak, { current: 0, longest: 0, lastEntryDate: null });
  });

  it('returns an empty streak for no entries', () => {
    assert.deepEqual(computeStreak([], NOW), { current: 0, longest: 0, lastEntryDate: null });
  });
});

describe('validateChangelog', () => {
  it('rejects anything past the tolerance window', () => {
    const justOver = { id: 'over', date: new Date('2026-10-18T12:00:00.001Z'), summary: 's', body: '' };
    assert.equal(validateChangelog([justOver], NOW).length, 1);
  });

  it('flags future and invalid dates, accepts today and tomorrow within tolerance', () => {
    const issues = validateChangelog(
      [
        entry('today', '2026-10-17'),
        // NOW is 2026-10-17T12:00Z; entries are noon UTC, so +24h is exactly the limit.
        entry('tomorrow', '2026-10-18'),
        entry('future', '2026-10-19'),
        { id: 'broken', date: new Date('nope'), summary: 's', body: '' },
      ],
      NOW,
    );
    assert.deepEqual(
      issues.map((item) => `${item.id}: ${item.problem}`),
      ['future: date is in the future', 'broken: invalid date'],
    );
  });
});
