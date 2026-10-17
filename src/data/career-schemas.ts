// Strict zod schemas for Career RPG content. Strict = unknown keys (e.g. a hand-set `xp`
// or `level`) fail the build: XP and levels are always computed from evidence.
import { z } from 'astro/zod';
import { ATTRIBUTE_IDS, EVIDENCE_TYPES } from './xp-rules';

/** https only: evidence URLs end up in href attributes (no javascript:/data:/http:). */
export const httpsUrl = z.url({ protocol: /^https$/, error: 'must be an https:// URL' });

export const skillIdSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'skill id must be kebab-case');

export const evidenceSchema = z.strictObject({
  type: z.enum(EVIDENCE_TYPES),
  url: httpsUrl,
});

export const metricSchema = z.strictObject({
  label: z.string().min(1).max(40),
  value: z.number(), // zod 4 rejects Infinity/NaN by default
  unit: z.string().max(12).optional(),
});

export const skillNodeSchema = z.strictObject({
  id: skillIdSchema,
  label: z.string().min(1).max(40),
  attribute: z.enum(ATTRIBUTE_IDS),
  parent: skillIdSchema.optional(),
  evidence: z.array(httpsUrl).max(10).default([]),
});

/** Authoring shape for `skills-data.ts` (evidence optional). */
export type SkillNodeData = z.input<typeof skillNodeSchema>;
