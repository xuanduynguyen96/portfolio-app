// Character profile -> avatar layers for one frame: class pose, then each gear slot at its tier and
// the job motif prop, placed at the pose's anchors for that frame (so gear follows moving parts).
import type { ClassId, MotifId } from '../../data/character-job-rules.ts';
import type { GearSlotId } from '../../data/gear-rules.ts';
import { classSprites, gearSprites, motifSprites } from '../../data/avatar/avatar-sprites.ts';
import type { AvatarFrame, Point, SpriteLayer, SpriteRows } from '../../data/avatar/avatar-types.ts';
import type { GearTier } from '../github-character/character-types.ts';

/** The parts of a CharacterProfile the avatar depends on. */
export interface AvatarLook {
  classId: ClassId;
  motif: MotifId | null;
  gear: readonly { slot: GearSlotId; tier: GearTier }[];
}

export function gearTierOf(look: AvatarLook, slot: GearSlotId): GearTier {
  return look.gear.find((item) => item.slot === slot)?.tier ?? 0;
}

export function selectAvatarLayers(look: AvatarLook, frame: AvatarFrame): SpriteLayer[] {
  const { rows, anchors } = classSprites[look.classId].frames[frame];
  const gear = (slot: GearSlotId) => gearSprites[slot][gearTierOf(look, slot)];
  const at = (slot: SpriteLayer['slot'], point: Point, sprite: SpriteRows): SpriteLayer => ({
    slot,
    x: point.x,
    y: point.y,
    rows: sprite,
  });
  const layers: SpriteLayer[] = [
    at('class', { x: 0, y: 0 }, rows),
    at('armor', anchors.armor, gear('armor')),
    at('amulet', anchors.amulet, gear('amulet')),
    at('boots', anchors.bootFar, gear('boots')),
    at('boots', anchors.bootNear, gear('boots')),
    at('shield', anchors.shield, gear('shield')),
  ];
  if (look.motif) layers.push(at('job', anchors.motif, motifSprites[look.motif][frame]));
  return layers;
}
