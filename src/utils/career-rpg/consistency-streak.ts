import { xpRules, type XpRules } from '../../data/xp-rules.ts';
import type { ChangelogInput, RuleIssue, StreakInfo } from './career-types.ts';

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

/** Monday 00:00 UTC of the ISO week containing `date` (epoch ms). */
export function weekStartUtc(date: Date): number {
  const midnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return midnight - ((date.getUTCDay() + 6) % 7) * DAY_MS;
}

/** Latest entry time that still counts: build time + tolerance for authors ahead of UTC. */
function latestAllowed(now: Date, rules: XpRules): number {
  return now.getTime() + rules.streak.futureToleranceHours * 3_600_000;
}

/** Entries dated after the build date (beyond the tolerance) can't count and are likely typos. */
export function validateChangelog(
  entries: readonly ChangelogInput[],
  now: Date,
  rules: XpRules = xpRules,
): RuleIssue[] {
  return entries
    .filter((entry) => Number.isNaN(entry.date.getTime()) || entry.date.getTime() > latestAllowed(now, rules))
    .map((entry) => ({
      source: 'changelog',
      id: entry.id,
      problem: Number.isNaN(entry.date.getTime()) ? 'invalid date' : 'date is in the future',
    }));
}

/**
 * Consecutive ISO weeks in `weekStarts` (Monday 00:00 UTC, epoch ms). The current week is still
 * open: an empty current week doesn't break the streak yet. Weeks after `now` are ignored.
 */
export function computeWeekStreak(weekStarts: readonly number[], now: Date): StreakInfo {
  const thisWeek = weekStartUtc(now);
  const weeks = new Set(weekStarts.filter((week) => week <= thisWeek));

  let cursor = thisWeek;
  if (!weeks.has(cursor)) cursor -= WEEK_MS;
  let current = 0;
  while (weeks.has(cursor)) {
    current++;
    cursor -= WEEK_MS;
  }

  let longest = 0;
  let run = 0;
  let previous: number | undefined;
  const sorted = [...weeks].sort((a, b) => a - b);
  for (const week of sorted) {
    run = previous !== undefined && week - previous === WEEK_MS ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = week;
  }

  return { current, longest, lastActiveWeek: sorted.length > 0 ? new Date(sorted[sorted.length - 1]) : null };
}

/** Streak of ISO weeks with enough public GitHub contributions (from the snapshot). Computed at build time. */
export function computeContributionStreak(
  weeks: readonly { start: string; count: number }[],
  now: Date,
  rules: XpRules = xpRules,
): StreakInfo {
  const active = weeks.filter((week) => week.count >= rules.streak.minWeeklyContributions);
  return computeWeekStreak(active.map((week) => weekStartUtc(new Date(`${week.start}T00:00:00Z`))), now);
}
