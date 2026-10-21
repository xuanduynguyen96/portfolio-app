// Accessible name + description for the avatar, shared by the SVG <title>/<desc> and the legend.
import { JOB_PROP_NAMES } from '../../data/avatar/avatar-job-style.ts';
import { classSprites, GEAR_MATERIALS } from '../../data/avatar/avatar-sprites.ts';
import { jobSlot } from '../../data/character-job-rules.ts';
import { gearRules, type GearSlotId } from '../../data/gear-rules.ts';
import type { CharacterProfile, GearSlotResult, GearTier } from '../github-character/character-types.ts';
import { characterTitle } from '../github-character/character-title.ts';
import { gearTierOf } from './select-avatar-layers.ts';

/** What the avatar needs from a CharacterProfile (gear: slot + tier only). */
export type AvatarProfile = Pick<CharacterProfile, 'classId' | 'className' | 'jobName' | 'jobId'> & {
  gear: readonly Pick<GearSlotResult, 'slot' | 'tier'>[];
};

export interface AvatarGearLine {
  slot: GearSlotId;
  label: string;
  axis: string;
  tier: GearTier;
  maxTier: number;
  material: string;
  /** e.g. "Shield tier 1 of 3, Bronze (Testing)". */
  text: string;
}

export interface AvatarDescription {
  /** e.g. "Warrior · Knight" (class only for an Adventurer). */
  title: string;
  desc: string;
  gear: AvatarGearLine[];
}

export function avatarDescription(profile: AvatarProfile): AvatarDescription {
  const title = characterTitle(profile);
  const gear = gearRules.map(({ slot, label, axis, thresholds }): AvatarGearLine => {
    const tier = gearTierOf(profile, slot);
    const maxTier = thresholds.length;
    const material = GEAR_MATERIALS[tier];
    return { slot, label, axis, tier, maxTier, material, text: `${label} tier ${tier} of ${maxTier}, ${material} (${axis})` };
  });
  const prop = profile.jobId && jobSlot(profile.classId, profile.jobId) >= 0 ? ` Job prop: ${JOB_PROP_NAMES[profile.jobId]}.` : '';
  const desc = `Pixel art of ${classSprites[profile.classId].look}.${prop} Gear: ${gear.map((line) => line.text).join('; ')}.`;
  return { title, desc, gear };
}
