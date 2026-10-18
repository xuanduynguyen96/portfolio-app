// Strict zod schemas for Career RPG content. Strict = unknown keys (e.g. a hand-set `xp`
// or `level`) fail the build: XP and levels are always computed from evidence.
import { z } from 'astro/zod';
import { ATTRIBUTE_IDS, EVIDENCE_TYPES, SKILL_ID_PATTERN } from './xp-rules.ts';

/** https only: evidence URLs end up in href attributes (no javascript:/data:/http:). */
export const httpsUrl = z
  .url({ protocol: /^https$/, error: 'must be an https:// URL' })
  .refine((url) => {
    const { username, password } = new URL(url);
    return !username && !password;
  }, 'must not contain credentials');

export const skillIdSchema = z.string().regex(SKILL_ID_PATTERN, 'skill id must be kebab-case');

export const evidenceSchema = z.strictObject({
  type: z.enum(EVIDENCE_TYPES),
  url: httpsUrl,
});

export const metricSchema = z.strictObject({
  label: z.string().min(1).max(40),
  value: z.number(), // zod 4 rejects Infinity/NaN by default
  unit: z.string().max(12).optional(),
});

const words = z.array(z.string().min(1).max(60)).min(1).max(20);

/** How public repos prove a skill (see repo-skill-matches.ts). */
export const skillMatchSchema = z
  .strictObject({
    languages: words.optional(),
    topics: words.optional(),
    keywords: z.array(z.string().regex(/^[a-z0-9]+$/, 'keywords are lowercase single words')).min(1).max(20).optional(),
    files: words.optional(),
    workflows: z.literal(true).optional(),
  })
  .refine((match) => Object.keys(match).length > 0, 'match needs at least one rule');

/** Strict: evidence is derived from matching repos, so a hand-set `evidence` key fails the build. */
export const skillNodeSchema = z.strictObject({
  id: skillIdSchema,
  label: z.string().min(1).max(40),
  attribute: z.enum(ATTRIBUTE_IDS),
  parent: skillIdSchema.optional(),
  match: skillMatchSchema.optional(),
});

/** Authoring shape for `skills-data.ts`. */
export type SkillNodeData = z.input<typeof skillNodeSchema>;

/**
 * Frontmatter of a case-study override (src/content/projects/<repo-slug>.md), minus `cover` (needs
 * Astro's image() helper, added in content.config.ts). Difficulty, skills, evidence and XP are derived
 * from the repo: setting them here (or legacy `repoUrl`/`demoUrl`) fails the build.
 */
export const questOverrideFields = {
  title: z.string().min(1).max(80).optional(),
  summary: z.string().min(1).max(160).optional(),
  tags: z.array(z.string().min(1).max(30)).max(6).optional(),
  coverAlt: z.string().default(''),
  featured: z.boolean().optional(),
  order: z.number().optional(),
  isBoss: z.boolean().default(false),
  obstacles: z.array(z.string().min(1).max(140)).max(6).default([]),
  metrics: z.array(metricSchema).max(6).default([]),
};
export const questOverrideSchema = z.strictObject(questOverrideFields);
