// Career RPG icons (8x8, hand-authored): skill-tree roots, attributes, quest difficulties.
// Legend: `#` ink (currentColor), `+` shade (currentColor at reduced opacity), `.` transparent.
// Rendered by src/components/pixel-icon.astro; invariants in tests/unit/pixel-icons.test.ts.
import type { PixelGrid } from '../utils/pixel-icon-path.ts';

export const careerIcons = {
  // Skill-tree roots (ids from skills-data.ts)
  languages: [
    // open book
    '........',
    '.##..##.',
    '#++##++#',
    '#..##..#',
    '#++##++#',
    '#..##..#',
    '########',
    '...##...',
  ],
  frontend: [
    // paintbrush
    '......##',
    '.....##.',
    '....##..',
    '...++...',
    '.+++....',
    '####....',
    '###.....',
    '#.......',
  ],
  backend: [
    // anvil
    '........',
    '########',
    '..######',
    '...++++.',
    '....##..',
    '...####.',
    '..######',
    '........',
  ],
  tooling: [
    // pickaxe
    '.####...',
    '....###.',
    '....+##.',
    '...+..##',
    '..+...#.',
    '.+....#.',
    '+.......',
    '........',
  ],
  collaboration: [
    // party of two
    '........',
    '.##..++.',
    '.##..++.',
    '........',
    '.##..++.',
    '####++++',
    '####++++',
    '........',
  ],

  // Attributes (ATTRIBUTE_IDS in xp-rules.ts)
  'code-efficiency': [
    // lightning bolt
    '....###.',
    '...###..',
    '..###...',
    '.######.',
    '...###..',
    '..###...',
    '.##.....',
    '#.......',
  ],
  'ui-polish': [
    // faceted gem
    '...#+...',
    '..##++..',
    '.###+++.',
    '####++++',
    '++++####',
    '.+++###.',
    '..++##..',
    '...+#...',
  ],
  reliability: [
    // heater shield
    '####++++',
    '####++++',
    '####++++',
    '####++++',
    '.###+++.',
    '.###+++.',
    '..##++..',
    '...#+...',
  ],
  communication: [
    // speech bubble
    '........',
    '.######.',
    '########',
    '#.#.#.##',
    '########',
    '.######.',
    '.##.....',
    '.#......',
  ],

  // Quest difficulties (QUEST_DIFFICULTIES in xp-rules.ts) + boss
  'side-quest': [
    // travel boot
    '.++++...',
    '.####...',
    '.####...',
    '.####...',
    '.######.',
    '.#######',
    '.#######',
    '........',
  ],
  'main-quest': [
    // sword
    '......##',
    '.....#+#',
    '....#+#.',
    '#..#+#..',
    '.##+#...',
    '..##....',
    '.#.##...',
    '#...#...',
  ],
  raid: [
    // crossed swords
    '##....##',
    '###..###',
    '.######.',
    '..####..',
    '..####..',
    '.+#..#+.',
    '++....++',
    '+......+',
  ],
  boss: [
    // skull
    '.######.',
    '########',
    '#..##..#',
    '#..##..#',
    '###..###',
    '.######.',
    '.#.##.#.',
    '........',
  ],
} as const satisfies Record<string, PixelGrid>;
