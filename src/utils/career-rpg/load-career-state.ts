// Astro-only wiring: collections + data files -> pure buildCareerState(). Not unit-tested
// (needs astro:content); keep it thin. Memoized: every page in a build shares one state.
import { getCollection } from 'astro:content';
import { z } from 'astro/zod';
import { skillNodeSchema } from '../../data/career-schemas';
import { siteConfig } from '../../data/site-config';
import { skillNodes } from '../../data/skills-data';
import { buildCareerState } from './build-career-state';
import type { CareerState } from './career-types';

/** `CAREER_RPG_NOW=YYYY-MM-DD` pins the build date (tests); means the end of that UTC day. */
export function resolveBuildNow(value: string | undefined): Date {
  if (value === undefined || value === '') return new Date();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`CAREER_RPG_NOW must be YYYY-MM-DD, got "${value}"`);
  const now = new Date(`${value}T23:59:59.999Z`);
  if (Number.isNaN(now.getTime())) throw new Error(`CAREER_RPG_NOW is not a real date: "${value}"`);
  return now;
}

// Raw text of content/data files, scanned for placeholder markers (HUD completeness).
const rawSources = import.meta.glob<string>(['/src/data/*.ts', '/src/content/**/*.md'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

async function build(): Promise<CareerState> {
  const [projects, changelog] = await Promise.all([getCollection('projects'), getCollection('changelog')]);
  return buildCareerState({
    quests: projects.map((project) => ({
      id: project.id,
      title: project.data.title,
      difficulty: project.data.difficulty,
      isBoss: project.data.isBoss,
      featured: project.data.featured,
      order: project.data.order,
      skills: project.data.skills,
      obstacles: project.data.obstacles,
      metrics: project.data.metrics,
      evidence: project.data.evidence,
      body: project.body ?? '',
    })),
    // Strict parse: a hand-set `xp`/`level` key on a skill node fails the build.
    skills: z.array(skillNodeSchema).parse(skillNodes),
    changelog: changelog.map((entry) => ({
      id: entry.id,
      date: entry.data.date,
      summary: entry.data.summary,
      body: entry.body ?? '',
    })),
    profile: siteConfig,
    rawSources,
    now: resolveBuildNow(process.env.CAREER_RPG_NOW),
  });
}

let cached: Promise<CareerState> | undefined;

export function loadCareerState(): Promise<CareerState> {
  cached ??= build();
  return cached;
}
