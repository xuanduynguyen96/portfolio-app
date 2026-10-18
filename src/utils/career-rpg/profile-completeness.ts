import { PLACEHOLDER_MARKER, xpRules, type XpRules } from '../../data/xp-rules.ts';
import type { Completeness, CompletenessItem, ProfileInput, ScoredQuest } from './career-types.ts';
import { countWords } from './count-words.ts';

const DAY_MS = 86_400_000;

export interface CompletenessInput {
  profile: ProfileInput;
  quests: readonly ScoredQuest[];
  /** GitHub snapshot `asOf` (YYYY-MM-DD). */
  snapshotAsOf: string;
  now: Date;
  /** Source files still containing the placeholder marker. */
  placeholderFiles: number;
  currentStreak: number;
}

/** Number of raw source files (path -> text) that still contain the placeholder marker. */
export function countPlaceholderFiles(rawSources: Readonly<Record<string, string>>): number {
  return Object.values(rawSources).filter((source) => source.includes(PLACEHOLDER_MARKER)).length;
}

function isRealEmail(email: string, placeholderDomains: readonly string[]): boolean {
  const match = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/.exec(email.trim());
  if (!match) return false;
  const domain = match[1].toLowerCase();
  return !placeholderDomains.some((bad) => domain === bad || domain.endsWith(`.${bad}`));
}

/** Checklist of what still separates the profile from "done"; percent = passed / total. */
export function evaluateCompleteness(input: CompletenessInput, rules: XpRules = xpRules): Completeness {
  const { profile, quests } = input;
  const { minBioWords, placeholderEmailDomains, maxSnapshotAgeDays } = rules.completeness;
  const snapshotAgeDays = (input.now.getTime() - Date.parse(`${input.snapshotAsOf}T00:00:00Z`)) / DAY_MS;
  const boss = quests.find((quest) => quest.isBoss);
  const items: CompletenessItem[] = [
    {
      id: 'no-placeholders',
      label: `No placeholder content left (${input.placeholderFiles} files)`,
      passed: input.placeholderFiles === 0,
    },
    {
      id: 'real-email',
      label: 'Real contact email',
      passed: isRealEmail(profile.email, placeholderEmailDomains),
    },
    {
      id: 'bio-length',
      label: `Bio of at least ${minBioWords} words`,
      passed: countWords(profile.bio.join('\n\n')) >= minBioWords,
    },
    {
      id: 'availability',
      label: 'Availability note set',
      passed: profile.availability.note.trim().length > 0,
    },
    { id: 'socials', label: 'At least one social link', passed: profile.socials.length > 0 },
    {
      id: 'snapshot-fresh',
      label: `GitHub data refreshed in the last ${maxSnapshotAgeDays} days`,
      passed: snapshotAgeDays <= maxSnapshotAgeDays,
    },
    {
      id: 'quest-descriptions',
      label: 'Every project repo has a GitHub description',
      passed: quests.every((quest) => quest.signals.description),
    },
    {
      id: 'quest-topics',
      label: 'Every project repo has GitHub topics',
      passed: quests.every((quest) => quest.signals.topics),
    },
    {
      id: 'boss-case-study',
      label: 'Boss project has a written case study',
      passed: boss?.status === 'case-study',
    },
    {
      id: 'streak-alive',
      label: 'GitHub activity this week or last',
      passed: input.currentStreak > 0,
    },
  ];
  const passed = items.filter((item) => item.passed).length;
  return {
    percent: Math.round((100 * passed) / items.length),
    items,
    missing: items.filter((item) => !item.passed),
  };
}
