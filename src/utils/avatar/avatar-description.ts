// Accessible name + description for the avatar, shared by the SVG <title>/<desc> and the legend.
import { MOTIF_PROP_NAMES } from '../../data/avatar/avatar-job-motifs.ts';
import { classSprites, GEAR_MATERIALS } from '../../data/avatar/avatar-sprites.ts';
import { ARCHETYPE_LABELS } from '../../data/character-job-rules.ts';
import { gearRules, type GearSlotId } from '../../data/gear-rules.ts';
import type { CharacterProfile, GearTier } from '../github-character/character-types.ts';
import { gearTierOf } from './select-avatar-layers.ts';

export type AvatarProfile = Pick<CharacterProfile, 'classId' | 'className' | 'jobName' | 'motif' | 'gear'>;

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
  /** e.g. "Warrior · Vanguard" (class only for an Adventurer). */
  title: string;
  desc: string;
  gear: AvatarGearLine[];
}

export function avatarDescription(profile: AvatarProfile): AvatarDescription {
  const title = profile.jobName ? `${profile.className} · ${profile.jobName}` : profile.className;
  const gear = gearRules.map(({ slot, label, axis, thresholds }): AvatarGearLine => {
    const tier = gearTierOf(profile, slot);
    const maxTier = thresholds.length;
    const material = GEAR_MATERIALS[tier];
    return { slot, label, axis, tier, maxTier, material, text: `${label} tier ${tier} of ${maxTier}, ${material} (${axis})` };
  });
  const prop = profile.motif
    ? ` Job prop: ${MOTIF_PROP_NAMES[profile.motif]} (${ARCHETYPE_LABELS[profile.motif]}).`
    : '';
  const desc = `Pixel art of ${classSprites[profile.classId].look}.${prop} Gear: ${gear.map((line) => line.text).join('; ')}.`;
  return { title, desc, gear };
}
