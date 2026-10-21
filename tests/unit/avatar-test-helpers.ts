// Shared builders for the avatar unit tests: every class x job x gear tier combination.
import { CLASS_IDS, CLASS_NAMES, JOBS, type ClassId, type JobId } from '../../src/data/character-job-rules.ts';
import { GEAR_SLOT_IDS } from '../../src/data/gear-rules.ts';
import type { AvatarProfile } from '../../src/utils/avatar/avatar-description.ts';
import type { GearTier } from '../../src/utils/github-character/character-types.ts';

export const TIERS: readonly GearTier[] = [0, 1, 2, 3];
export type Tiers = readonly [GearTier, GearTier, GearTier, GearTier];

export function avatarProfile(classId: ClassId, jobId: JobId | null, tiers: Tiers = [0, 0, 0, 0]): AvatarProfile {
  const job = classId !== 'adventurer' ? JOBS[classId].find((j) => j.id === jobId) ?? null : null;
  return {
    classId,
    className: CLASS_NAMES[classId],
    jobName: job?.name ?? null,
    jobId,
    gear: GEAR_SLOT_IDS.map((slot, i) => ({ slot, axis: slot, label: slot, tier: tiers[i], repos: [] })),
  };
}

/** Every class x (each of its jobs + none) pairing. */
export const LOOK_KEYS: readonly [ClassId, JobId | null][] = CLASS_IDS.flatMap((classId) =>
  [...(classId === 'adventurer' ? [] : JOBS[classId].map((job) => job.id)), null].map((jobId): [ClassId, JobId | null] => [classId, jobId]));

/** All 4^4 armor/shield/boots/amulet tier sets. */
export const ALL_TIER_SETS: readonly Tiers[] = TIERS.flatMap((a) =>
  TIERS.flatMap((s) => TIERS.flatMap((b) => TIERS.map((m): Tiers => [a, s, b, m]))));

export const isOpaque = (char: string | undefined) => char !== undefined && char !== '.';
