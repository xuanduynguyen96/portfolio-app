import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { evidenceSchema, metricSchema, skillIdSchema } from './data/career-schemas';
import { QUEST_DIFFICULTIES } from './data/xp-rules';

// Strict: unknown keys (hand-set `xp`/`level`, legacy `repoUrl`/`demoUrl`) fail the build.
// Cross-entry rules (exactly one boss, known skills, min words) run in build-career-state.ts.
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z
      .strictObject({
        title: z.string(),
        summary: z.string().max(160),
        tags: z.array(z.string()).default([]),
        cover: image().optional(),
        coverAlt: z.string().default(''),
        featured: z.boolean().default(false),
        order: z.number().default(100),
        difficulty: z.enum(QUEST_DIFFICULTIES),
        isBoss: z.boolean().default(false),
        skills: z.array(skillIdSchema).min(1).max(6),
        obstacles: z.array(z.string().min(1).max(140)).max(6).default([]),
        metrics: z.array(metricSchema).max(6).default([]),
        evidence: z.array(evidenceSchema).max(8).default([]),
      })
      .refine((project) => !project.cover || project.coverAlt.trim().length > 0, {
        message: 'coverAlt is required when cover is set',
        path: ['coverAlt'],
      })
      .refine((project) => !project.isBoss || (project.metrics.length > 0 && project.obstacles.length > 0), {
        message: 'boss quest needs at least one metric and one obstacle',
        path: ['isBoss'],
      }),
});

// Dated build log; feeds the Consistency Streak (ISO weeks with an entry).
const changelog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/changelog' }),
  schema: z.strictObject({
    date: z.coerce.date(),
    summary: z.string().min(1).max(160),
  }),
});

export const collections = { projects, changelog };
