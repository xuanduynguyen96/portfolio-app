import { xpRules, type XpRules } from '../../data/xp-rules.ts';
import type { ChangelogInput, RuleIssue, StreakInfo } from './career-types.ts';
import { countWords } from './count-words.ts';

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
 * Consecutive ISO weeks (UTC) with at least one entry whose body meets the word minimum.
 * The current week is still open: an empty current week doesn't break the streak yet.
 * Computed at build time, so it only refreshes when the site is rebuilt.
 */
export function computeStreak(
  entries: readonly ChangelogInput[],
  now: Date,
  rules: XpRules = xpRules,
): StreakInfo {
  const qualifying = entries.filter(
    (entry) =>
      entry.date.getTime() <= latestAllowed(now, rules) && countWords(entry.body) >= rules.streak.minBodyWords,
  );
  const weeks = new Set(qualifying.map((entry) => weekStartUtc(entry.date)));

  let cursor = weekStartUtc(now);
  if (!weeks.has(cursor)) cursor -= WEEK_MS;
  let current = 0;
  while (weeks.has(cursor)) {
    current++;
    cursor -= WEEK_MS;
  }

  let longest = 0;
  let run = 0;
  let previous: number | undefined;
  for (const week of [...weeks].sort((a, b) => a - b)) {
    run = previous !== undefined && week - previous === WEEK_MS ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = week;
  }

  const lastEntryTime = Math.max(...qualifying.map((entry) => entry.date.getTime()));
  return {
    current,
    longest,
    lastEntryDate: qualifying.length > 0 ? new Date(lastEntryTime) : null,
  };
}
