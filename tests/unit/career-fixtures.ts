// Input builders for Career RPG unit tests: valid defaults, override what a test needs.
import type {
  ChangelogInput,
  ProfileInput,
  QuestInput,
  SkillNodeInput,
} from '../../src/utils/career-rpg/career-types.ts';

/** `count` distinct prose words (e.g. "word1 word2 ..."). */
export function words(count: number): string {
  return Array.from({ length: count }, (_, index) => `word${index + 1}`).join(' ');
}

export function quest(overrides: Partial<QuestInput> & { id: string }): QuestInput {
  return {
    title: overrides.id,
    difficulty: 'main',
    isBoss: false,
    featured: false,
    order: 100,
    skills: ['typescript'],
    obstacles: [],
    metrics: [],
    evidence: [{ type: 'repo', url: `https://github.com/example-user/${overrides.id}` }],
    body: words(200),
    isSample: false,
    ...overrides,
  };
}

export function bossQuest(overrides: Partial<QuestInput> & { id: string }): QuestInput {
  return quest({
    difficulty: 'raid',
    isBoss: true,
    obstacles: ['Legacy build pipeline'],
    metrics: [{ label: 'Load time cut', value: 40, unit: '%' }],
    ...overrides,
  });
}

export function skill(overrides: Partial<SkillNodeInput> & { id: string }): SkillNodeInput {
  return { label: overrides.id, attribute: 'code-efficiency', evidence: [], ...overrides };
}

export const baseSkills: SkillNodeInput[] = [
  skill({ id: 'languages' }),
  skill({ id: 'typescript', parent: 'languages' }),
  skill({ id: 'frontend', attribute: 'ui-polish' }),
  skill({ id: 'css', attribute: 'ui-polish', parent: 'frontend' }),
  skill({ id: 'collaboration', attribute: 'communication' }),
  skill({ id: 'writing', attribute: 'communication', parent: 'collaboration' }),
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
