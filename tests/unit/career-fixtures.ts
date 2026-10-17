// Input builders for Career RPG unit tests: valid defaults, override what a test needs.
import type {
  ChangelogInput,
  ProfileInput,
  QuestInput,
  QuestOverrideInput,
  SkillNodeInput,
} from '../../src/utils/career-rpg/career-types.ts';

/** `count` distinct prose words (e.g. "word1 word2 ..."). */
export function words(count: number): string {
  return Array.from({ length: count }, (_, index) => `word${index + 1}`).join(' ');
}

const noSignals = { description: false, topics: false, homepage: false, tests: false, ci: false };

/** A scored-ready quest; defaults earn no bonus (base XP only). */
export function quest(overrides: Partial<QuestInput> & { id: string }): QuestInput {
  return {
    repo: overrides.id,
    title: overrides.id,
    summary: `Summary of ${overrides.id}`,
    tags: ['TypeScript'],
    difficulty: 'main',
    isBoss: false,
    featured: false,
    order: 100,
    skills: ['typescript'],
    obstacles: [],
    metrics: [],
    repoMetrics: [],
    evidence: [{ type: 'repo', url: `https://github.com/example-user/${overrides.id}` }],
    body: '',
    signals: noSignals,
    isSample: false,
    ...overrides,
  };
}

export function override(overrides: Partial<QuestOverrideInput> & { id: string }): QuestOverrideInput {
  return { obstacles: [], metrics: [], body: '', isSample: false, ...overrides };
}

export function skill(overrides: Partial<SkillNodeInput> & { id: string }): SkillNodeInput {
  return { label: overrides.id, attribute: 'code-efficiency', ...overrides };
}

export const baseSkills: SkillNodeInput[] = [
  skill({ id: 'languages' }),
  skill({ id: 'typescript', parent: 'languages', match: { languages: ['TypeScript'] } }),
  skill({ id: 'go', parent: 'languages', match: { languages: ['Go'] } }),
  skill({ id: 'frontend', attribute: 'ui-polish' }),
  skill({ id: 'css', attribute: 'ui-polish', parent: 'frontend', match: { languages: ['CSS'] } }),
  skill({ id: 'collaboration', attribute: 'communication' }),
  skill({ id: 'writing', attribute: 'communication', parent: 'collaboration', match: { files: ['docs'] } }),
];

export function entry(id: string, isoDate: string, bodyWords = 50): ChangelogInput {
  return { id, date: new Date(`${isoDate}T12:00:00Z`), summary: `Entry ${id}`, body: words(bodyWords) };
}

export const realProfile: ProfileInput = {
  email: 'jane@janedoe.dev',
  bio: [words(70)],
  socials: [{ label: 'GitHub', href: 'https://github.com/example-user' }],
  availability: { status: 'open', note: 'Available for new projects' },
};

/** Saturday 2026-10-17 12:00 UTC (ISO week starting Monday 2026-10-12). */
export const NOW = new Date('2026-10-17T12:00:00Z');
