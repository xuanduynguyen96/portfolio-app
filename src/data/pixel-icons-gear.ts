// Gear slot icons (8x8, hand-authored) for the avatar gear legend: one per GEAR_SLOT_IDS entry.
// Legend: `#` ink (currentColor), `+` shade (currentColor at reduced opacity), `.` transparent.
import type { PixelGrid } from '../utils/pixel-icon-path.ts';

export const gearIcons = {
  armor: [
    // breastplate
    '##....##',
    '###..###',
    '########',
    '#+####+#',
    '.######.',
    '.#+##+#.',
    '.######.',
    '..####..',
  ],
  shield: [
    // heater shield with a cross
    '########',
    '#+++#++#',
    '#+++#++#',
    '########',
    '#+++#++#',
    '.#++#+#.',
    '..#+##..',
    '...##...',
  ],
  boots: [
    // pair of boots
    '.##..##.',
    '.##..##.',
    '.#+..#+.',
    '.#+..#+.',
    '.##+.##+',
    '####+###',
    '########',
    '........',
  ],
  amulet: [
    // pendant on a chain
    '#......#',
    '.#....#.',
    '..#..#..',
    '...##...',
    '..####..',
    '.##++##.',
    '.##++##.',
    '..####..',
  ],
} as const satisfies Record<string, PixelGrid>;
