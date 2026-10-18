// Avatar sprite registry: one 2-frame pose per class, one 2-frame prop per job motif, 4 tiers per
// gear slot. Gear + motif sprites are drawn once and placed at each pose's per-frame anchors.
import type { ArchetypeId } from '../character-class-rules.ts';
import type { ClassId } from '../character-job-rules.ts';
import type { GearSlotId } from '../gear-rules.ts';
import { adventurerPose } from './avatar-class-adventurer.ts';
import { archerPose } from './avatar-class-archer.ts';
import { magePose } from './avatar-class-mage.ts';
import { warriorPose } from './avatar-class-warrior.ts';
import { armorTiers } from './avatar-gear-armor.ts';
import { amuletTiers, bootTiers } from './avatar-gear-boots-amulet.ts';
import { shieldTiers } from './avatar-gear-shield.ts';
import { motifFrames } from './avatar-job-motifs.ts';
import type { ClassPose, SpriteRows, TieredRows } from './avatar-types.ts';

export const classSprites: Readonly<Record<ClassId, ClassPose>> = {
  warrior: warriorPose,
  mage: magePose,
  archer: archerPose,
  adventurer: adventurerPose,
};

export const motifSprites: Readonly<Record<ArchetypeId, readonly [SpriteRows, SpriteRows]>> = motifFrames;

export const gearSprites: Readonly<Record<GearSlotId, TieredRows>> = {
  armor: armorTiers,
  shield: shieldTiers,
  boots: bootTiers,
  amulet: amuletTiers,
};


/** Material name per tier, shown in the legend and the SVG description. */
export const GEAR_MATERIALS = ['Leather', 'Bronze', 'Iron', 'Gold'] as const;
