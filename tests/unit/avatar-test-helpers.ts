// Shared builders for the avatar unit tests: every class x motif x gear tier combination.
import { CLASS_IDS, CLASS_NAMES, JOBS, MOTIF_IDS, type ClassId, type MotifId } from '../../src/data/character-job-rules.ts';
import { GEAR_SLOT_IDS } from '../../src/data/gear-rules.ts';
import type { AvatarProfile } from '../../src/utils/avatar/avatar-description.ts';
import type { GearTier } from '../../src/utils/github-character/character-types.ts';

export const TIERS: readonly GearTier[] = [0, 1, 2, 3];
export type Tiers = readonly [GearTier, GearTier, GearTier, GearTier];

export function avatarProfile(classId: ClassId, motif: MotifId | null, tiers: Tiers = [0, 0, 0, 0]): AvatarProfile {
  const job = classId !== 'adventurer' && motif ? JOBS[classId].find((j) => j.motif === motif) ?? null : null;
  return {
    classId,
    className: CLASS_NAMES[classId],
    jobName: job?.name ?? null,
    motif,
    gear: GEAR_SLOT_IDS.map((slot, i) => ({ slot, axis: slot, label: slot, tier: tiers[i], repos: [] })),
  };
}

/** Every class x (each motif + none) pairing. */
export const LOOK_KEYS: readonly [ClassId, MotifId | null][] = CLASS_IDS.flatMap((classId) =>
  [...MOTIF_IDS, null].map((motif): [ClassId, MotifId | null] => [classId, motif]));

/** All 4^4 armor/shield/boots/amulet tier sets. */
export const ALL_TIER_SETS: readonly Tiers[] = TIERS.flatMap((a) =>
  TIERS.flatMap((s) => TIERS.flatMap((b) => TIERS.map((m): Tiers => [a, s, b, m]))));

export const isOpaque = (char: string | undefined) => char !== undefined && char !== '.';
