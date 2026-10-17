// HUD icons (8x8, hand-authored): XP/level/streak glyphs, states, theme toggle.
// Legend: `#` ink (currentColor), `+` shade (currentColor at reduced opacity), `.` transparent.
// Rendered by src/components/pixel-icon.astro; invariants in tests/unit/pixel-icons.test.ts.
import type { PixelGrid } from '../utils/pixel-icon-path.ts';

export const hudIcons = {
  xp: [
    // star
    '...##...',
    '...##...',
    '########',
    '.######.',
    '..####..',
    '.######.',
    '.##..##.',
    '.#....#.',
  ],
  level: [
    // double up-chevron (rank up)
    '...##...',
    '..####..',
    '.##..##.',
    '##....##',
    '...++...',
    '..++++..',
    '.++..++.',
    '++....++',
  ],
  streak: [
    // flame
    '....#...',
    '...##...',
    '..###.#.',
    '.####.##',
    '.###+###',
    '##++++##',
    '##++++##',
    '.######.',
  ],
  locked: [
    // padlock
    '..####..',
    '.#....#.',
    '.#....#.',
    '########',
    '###++###',
    '###++###',
    '########',
    '........',
  ],
  evidence: [
    // magnifying glass
    '.####...',
    '#+...#..',
    '#+...#..',
    '#....#..',
    '#....#..',
    '.#####..',
    '.....##.',
    '......##',
  ],
  quest: [
    // scroll
    '########',
    '.######.',
    '.#....#.',
    '.#++++#.',
    '.#....#.',
    '.#++++#.',
    '.######.',
    '########',
  ],
  achievement: [
    // trophy
    '########',
    '#.####.#',
    '#.####.#',
    '.######.',
    '..####..',
    '...##...',
    '...##...',
    '..####..',
  ],
  sun: [
    // sun with rays
    '...##...',
    '.#....#.',
    '...##...',
    '#.####.#',
    '#.####.#',
    '...##...',
    '.#....#.',
    '...##...',
  ],
  moon: [
    // crescent
    '..####..',
    '.###....',
    '###.....',
    '###.....',
    '###.....',
    '###.....',
    '.###....',
    '..####..',
  ],
} as const satisfies Record<string, PixelGrid>;
