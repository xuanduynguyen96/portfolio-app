// Per-job avatar styling (lazy graph only): the prop's name for the SVG <desc>, the job's accent colour
// and the free box each class leaves for a prop.
import type { CombatClassId, JobId } from '../character-job-rules.ts';
import type { PaletteKey } from './avatar-palette.ts';
import type { Box } from './avatar-types.ts';

/** Short name of each job's prop, e.g. "Job prop: crest shield." */
export const JOB_PROP_NAMES: Readonly<Record<JobId, string>> = {
  knight: 'crest shield',
  paladin: 'sword with spring leaves',
  sentinel: 'server watchtower',
  ranger: 'two-orbit atom',
  skirmisher: 'winged phone',
  herald: 'horn with a code pennant',
  enchanter: 'rune pipeline',
  summoner: 'container crate',
  seer: 'floating eye',
};

/** Palette key of each job's accent: the prop's main hue and the outfit trim. */
export const JOB_ACCENT: Readonly<Record<JobId, PaletteKey>> = {
  knight: 'A',
  paladin: 'B',
  sentinel: 'C',
  ranger: 'D',
  skirmisher: 'E',
  herald: 'F',
  enchanter: 'H',
  summoner: 'J',
  seer: 'M',
};

/** Inclusive box per class, both frames, that keeps a 1px gap from body, gear (every tier) and identity art. */
export const JOB_PROP_ZONES: Readonly<Record<CombatClassId, Box>> = {
  warrior: { x0: 23, y0: 0, x1: 31, y1: 13 },
  archer: { x0: 23, y0: 0, x1: 31, y1: 12 },
  mage: { x0: 26, y0: 7, x1: 31, y1: 25 },
};
