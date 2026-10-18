import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { xpRules } from '../../src/data/xp-rules.ts';
import {
  computeContributionStreak,
  computeWeekStreak,
  validateChangelog,
  weekStartUtc,
} from '../../src/utils/career-rpg/consistency-streak.ts';
import { entry, NOW } from './career-fixtures.ts';

/** Monday dates -> week starts (ms). */
const weeks = (...mondays: string[]) => mondays.map((day) => Date.parse(`${day}T00:00:00Z`));

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

describe('computeWeekStreak', () => {
  it('counts consecutive weeks ending this week', () => {
    const streak = computeWeekStreak(weeks('2026-10-12', '2026-10-05', '2026-09-28'), NOW);
    assert.deepEqual({ current: streak.current, longest: streak.longest }, { current: 3, longest: 3 });
    assert.equal(streak.lastActiveWeek?.toISOString().slice(0, 10), '2026-10-12');
  });

  it('resets on a gap week', () => {
    assert.equal(computeWeekStreak(weeks('2026-10-12', '2026-09-28'), NOW).current, 1);
  });

  it('gives the open current week grace', () => {
    assert.equal(computeWeekStreak(weeks('2026-10-05', '2026-09-28'), NOW).current, 2);
  });

  it('breaks when neither this nor last week is active', () => {
    const streak = computeWeekStreak(weeks('2026-09-28'), NOW);
    assert.equal(streak.current, 0);
    assert.equal(streak.longest, 1);
  });

  it('counts a repeated week once and ignores weeks after now', () => {
    const streak = computeWeekStreak(weeks('2026-10-12', '2026-10-12', '2026-10-19'), NOW);
    assert.deepEqual(streak, { current: 1, longest: 1, lastActiveWeek: new Date('2026-10-12T00:00:00Z') });
  });

  it('spans the year boundary', () => {
    assert.equal(computeWeekStreak(weeks('2026-12-28', '2027-01-04'), new Date('2027-01-06T12:00:00Z')).current, 2);
  });

  it('tracks the longest run separately from the current one', () => {
    const streak = computeWeekStreak(weeks('2026-06-01', '2026-06-08', '2026-06-15', '2026-10-12'), NOW);
    assert.equal(streak.current, 1);
    assert.equal(streak.longest, 3);
  });

  it('returns an empty streak for no weeks', () => {
    assert.deepEqual(computeWeekStreak([], NOW), { current: 0, longest: 0, lastActiveWeek: null });
  });
});

describe('computeContributionStreak', () => {
  it('uses snapshot weeks with enough contributions', () => {
    const rules = { ...xpRules, streak: { ...xpRules.streak, minWeeklyContributions: 2 } };
    const streak = computeContributionStreak(
      [{ start: '2026-09-28', count: 5 }, { start: '2026-10-05', count: 1 }, { start: '2026-10-12', count: 3 }],
      NOW,
      rules,
    );
    assert.equal(streak.current, 1, 'the 1-contribution week breaks the run');
    assert.equal(streak.longest, 1);
    assert.equal(computeContributionStreak([{ start: '2026-10-05', count: 1 }], NOW).current, 1);
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
