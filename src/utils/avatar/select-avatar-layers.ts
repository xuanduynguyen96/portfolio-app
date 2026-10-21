// Character profile -> avatar layers for one frame: class pose, the job's outfit trim, each gear slot
// at its tier, then the job prop. Gear sits at the pose's anchors for that frame (so it follows moving
// parts); trim and prop carry their own position per frame.
import { jobSlot, type ClassId, type JobId } from '../../data/character-job-rules.ts';
import type { GearSlotId } from '../../data/gear-rules.ts';
import { classTrim, TRIM_MARK } from '../../data/avatar/avatar-class-trim.ts';
import { JOB_ACCENT } from '../../data/avatar/avatar-job-style.ts';
import { classSprites, gearSprites, jobPropSprites } from '../../data/avatar/avatar-sprites.ts';
import type { AvatarFrame, Point, SpriteLayer, SpriteRows } from '../../data/avatar/avatar-types.ts';
import type { GearTier } from '../github-character/character-types.ts';

/** The parts of a CharacterProfile the avatar depends on. */
export interface AvatarLook {
  classId: ClassId;
  jobId: JobId | null;
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
  const job = look.classId !== 'adventurer' && look.jobId && jobSlot(look.classId, look.jobId) >= 0
    ? { classId: look.classId, jobId: look.jobId }
    : null;
  const layers: SpriteLayer[] = [at('class', { x: 0, y: 0 }, rows)];
  if (job) {
    const trim = classTrim[job.classId][frame];
    layers.push(at('trim', trim, trim.rows.map((row) => row.replaceAll(TRIM_MARK, JOB_ACCENT[job.jobId]))));
  }
  layers.push(
    at('armor', anchors.armor, gear('armor')),
    at('amulet', anchors.amulet, gear('amulet')),
    at('boots', anchors.bootFar, gear('boots')),
    at('boots', anchors.bootNear, gear('boots')),
    at('shield', anchors.shield, gear('shield')),
  );
  if (job) {
    const prop = jobPropSprites[job.jobId][frame];
    layers.push(at('job', prop, prop.rows));
  }
  return layers;
}
