// Avatar sprite registry: one 2-frame pose per class, one 2-frame prop per job, 4 tiers per gear slot.
// Gear sprites are drawn once and placed at each pose's per-frame anchors; props carry their own place.
import type { ClassId, JobId } from '../character-job-rules.ts';
import type { GearSlotId } from '../gear-rules.ts';
import { adventurerPose } from './avatar-class-adventurer.ts';
import { archerPose } from './avatar-class-archer.ts';
import { magePose } from './avatar-class-mage.ts';
import { warriorPose } from './avatar-class-warrior.ts';
import { armorTiers } from './avatar-gear-armor.ts';
import { amuletTiers, bootTiers } from './avatar-gear-boots-amulet.ts';
import { shieldTiers } from './avatar-gear-shield.ts';
import { archerProps } from './avatar-job-props-archer.ts';
import { mageProps } from './avatar-job-props-mage.ts';
import { warriorProps } from './avatar-job-props-warrior.ts';
import type { ClassPose, JobPropFrames, TieredRows } from './avatar-types.ts';

export const classSprites: Readonly<Record<ClassId, ClassPose>> = {
  warrior: warriorPose,
  archer: archerPose,
  mage: magePose,
  adventurer: adventurerPose,
};

export const jobPropSprites: Readonly<Record<JobId, JobPropFrames>> = { ...warriorProps, ...archerProps, ...mageProps };

export const gearSprites: Readonly<Record<GearSlotId, TieredRows>> = {
  armor: armorTiers,
  shield: shieldTiers,
  boots: bootTiers,
  amulet: amuletTiers,
};

/** Material name per tier, shown in the legend and the SVG description. */
export const GEAR_MATERIALS = ['Leather', 'Bronze', 'Iron', 'Gold'] as const;
