// Career RPG id -> pixel icon mappings. Records keyed by xp-rules unions are exhaustive at type level.
import type { PixelIconName } from './pixel-icons.ts';
import type { AttributeId, QuestDifficulty } from './xp-rules.ts';

export const attributeIcons: Readonly<Record<AttributeId, PixelIconName>> = {
  'code-efficiency': 'code-efficiency',
  'ui-polish': 'ui-polish',
  reliability: 'reliability',
  communication: 'communication',
};

export const difficultyIcons: Readonly<Record<QuestDifficulty, PixelIconName>> = {
  side: 'side-quest',
  main: 'main-quest',
  raid: 'raid',
};

export const bossIcon: PixelIconName = 'boss';

/** Root skill ids from skills-data.ts (nodes without `parent`). Leaf skills get no icon. */
export const skillRootIcons: Readonly<Record<string, PixelIconName>> = {
  languages: 'languages',
  frontend: 'frontend',
  backend: 'backend',
  tooling: 'tooling',
  collaboration: 'collaboration',
};

/** Icon for a root skill id; unknown roots fall back to the generic quest scroll. */
export function skillRootIcon(id: string): PixelIconName {
  return Object.hasOwn(skillRootIcons, id) ? skillRootIcons[id] : 'quest';
}
