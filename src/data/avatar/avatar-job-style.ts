// Per-job avatar styling (lazy graph only): the prop's name for the SVG <desc>.
import type { JobId } from '../character-job-rules.ts';

/** Short name of each job's prop, e.g. "Job prop: crest shield." */
export const JOB_PROP_NAMES: Readonly<Record<JobId, string>> = {
  knight: 'crest shield',
  paladin: 'leaf and sword',
  sentinel: 'watchtower',
  ranger: 'orbiting atom',
  skirmisher: 'phone and winged boot',
  herald: 'horn with a code pennant',
  enchanter: 'rune circle',
  summoner: 'container crate',
  seer: 'floating eye',
};
