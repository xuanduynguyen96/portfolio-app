import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { questOverrideFields } from './data/career-schemas';

// Optional case studies: one file per public repo, named by the repo slug (e.g. portfolio-app.md).
// Strict: unknown keys (hand-set `xp`/`difficulty`/`skills`/`evidence`, legacy `repoUrl`) fail the build.
// Cross-entry rules (slug names a snapshot repo, at most one boss) run in build-career-state.ts.
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z
      .strictObject({ ...questOverrideFields, cover: image().optional() })
      .refine((project) => !project.cover || project.coverAlt.trim().length > 0, {
        message: 'coverAlt is required when cover is set',
        path: ['coverAlt'],
      }),
});

// Dated build log shown on /changelog/ (the streak itself comes from GitHub activity).
const changelog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/changelog' }),
  schema: z.strictObject({
    date: z.coerce.date(),
    summary: z.string().min(1).max(160),
  }),
});

export const collections = { projects, changelog };
