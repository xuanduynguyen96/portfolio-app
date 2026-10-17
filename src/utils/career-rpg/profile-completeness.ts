import { PLACEHOLDER_MARKER, xpRules, type XpRules } from '../../data/xp-rules.ts';
import type {
  Completeness,
  CompletenessItem,
  ProfileInput,
  ScoredQuest,
  SkillTreeNode,
} from './career-types.ts';
import { countWords } from './count-words.ts';

export interface CompletenessSnapshot {
  profile: ProfileInput;
  quests: readonly ScoredQuest[];
  /** Leaf nodes of the skill tree. */
  leafSkills: readonly SkillTreeNode[];
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
export function evaluateCompleteness(snapshot: CompletenessSnapshot, rules: XpRules = xpRules): Completeness {
  const { profile, quests, leafSkills } = snapshot;
  const { minBioWords, placeholderEmailDomains } = rules.completeness;
  const items: CompletenessItem[] = [
    {
      id: 'no-placeholders',
      label: `No placeholder content left (${snapshot.placeholderFiles} files)`,
      passed: snapshot.placeholderFiles === 0,
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
      id: 'quest-evidence',
      label: 'Every project links evidence',
      passed: quests.every((quest) => quest.evidence.length > 0),
    },
    {
      id: 'quest-verified',
      label: 'Every project is verified (case study + unique evidence)',
      passed: quests.every((quest) => quest.verified),
    },
    {
      id: 'quest-metrics',
      label: 'Every project reports a metric',
      passed: quests.every((quest) => quest.metrics.length > 0),
    },
    {
      id: 'skill-evidence',
      label: 'Every leaf skill has evidence',
      passed: leafSkills.every((node) => node.evidenceCount > 0),
    },
    {
      id: 'streak-alive',
      label: 'Changelog entry this week or last',
      passed: snapshot.currentStreak > 0,
    },
  ];
  const passed = items.filter((item) => item.passed).length;
  return {
    percent: Math.round((100 * passed) / items.length),
    items,
    missing: items.filter((item) => !item.passed),
  };
}
