// Outfit trim per combat class: the class pose pixels recoloured to the job's accent (`*` = accent key,
// filled in by selectAvatarLayers). Drawn between the pose and the gear, outside head/held boxes.
// Warrior: tabard flap below the belt. Archer: tunic yoke + front edge. Mage: the two light robe bands.
import type { CombatClassId } from '../character-job-rules.ts';
import type { PlacedSprite } from './avatar-types.ts';

export const TRIM_MARK = '*';

const archerTrim: PlacedSprite = { x: 11, y: 18, rows: ['*********', '*........', '*........', '*........', '*........'] };
const mageTrim: PlacedSprite = {
  x: 10,
  y: 23,
  rows: ['************.', '.............', '.............', '.............', '*************'],
};

export const classTrim: Readonly<Record<CombatClassId, readonly [PlacedSprite, PlacedSprite]>> = {
  warrior: [
    { x: 11, y: 23, rows: ['.**', '.**', '***'] },
    { x: 12, y: 24, rows: ['**', '**'] },
  ],
  archer: [archerTrim, archerTrim],
  mage: [mageTrim, mageTrim],
};
