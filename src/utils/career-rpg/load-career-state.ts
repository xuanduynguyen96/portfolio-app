// Astro-only wiring: collections + data files -> pure buildCareerState(). Not unit-tested
// (needs astro:content); keep it thin. Memoized per build: every page shares one state.
import { getCollection } from 'astro:content';
import { z } from 'astro/zod';
import { skillNodeSchema } from '../../data/career-schemas';
import { siteConfig } from '../../data/site-config';
import { skillNodes } from '../../data/skills-data';
import { buildCareerState } from './build-career-state';
import type { CareerState } from './career-types';
import { resolveBuildNow } from './resolve-build-now';

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
  // Dev server: rebuild per request so content edits (and fixes after a rule error) show up.
  if (import.meta.env.DEV) return build();
  cached ??= build().catch((error: unknown) => {
    cached = undefined;
    throw error;
  });
  return cached;
}
