// Everything the page needs to show one chosen look, from the same build modules as the server render.
// Pure and JSON-serializable. Gear comes from the GitHub stats and is identical for every look.
import { gearRules, type GearSlotId } from '../../data/gear-rules.ts';
import type { GearTier } from '../github-character/character-types.ts';
import { avatarDescription, type AvatarProfile } from './avatar-description.ts';
import { avatarPaths, type AvatarPath } from './avatar-svg-paths.ts';
import { avatarFrameGrid } from './avatar-svg-markup.ts';
import { lookProfile, type ClassLook } from './class-looks.ts';

export interface LookAvatarModel {
  className: string;
  jobName: string | null;
  /** SVG <title> and visible name, e.g. 'Archer · Ranger'. */
  title: string;
  /** SVG <desc>: pose, job prop and the gear tiers earned from the GitHub stats. */
  desc: string;
  /** Frame A, frame B (the hero loops both; the character-sheet avatar draws only A). */
  frames: readonly [AvatarPath[], AvatarPath[]];
}

export function lookAvatarModel(look: ClassLook, gear: AvatarProfile['gear']): LookAvatarModel {
  const profile = lookProfile(look, gear);
  const { title, desc } = avatarDescription(profile);
  return {
    className: profile.className,
    jobName: profile.jobName,
    title,
    desc,
    frames: [avatarPaths(avatarFrameGrid(profile, 0)), avatarPaths(avatarFrameGrid(profile, 1))],
  };
}

/** Gear tiers serialized by the server into `data-gear`; throws on anything but a known slot with a valid tier. */
export function parseGear(json: string): AvatarProfile['gear'] {
  const data: unknown = JSON.parse(json);
  if (!Array.isArray(data)) throw new Error('gear must be an array');
  const seen = new Set<string>();
  return data.map((item: unknown) => {
    const { slot, tier } = (item ?? {}) as { slot?: unknown; tier?: unknown };
    const rule = gearRules.find((r) => r.slot === slot);
    if (!rule || seen.has(rule.slot)) throw new Error(`bad gear slot ${String(slot)}`);
    if (typeof tier !== 'number' || !Number.isInteger(tier) || tier < 0 || tier > rule.thresholds.length) {
      throw new Error(`bad gear tier ${String(tier)} for ${rule.slot}`);
    }
    seen.add(rule.slot);
    return { slot: rule.slot as GearSlotId, tier: tier as GearTier };
  });
}
