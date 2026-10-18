// Job motif props (6x11 box, top-right of the pose): banner = backend, crystal = data,
// hawk = frontend. Two frames each: the banner flutters, the crystal bobs, the hawk flaps.
import type { ArchetypeId } from '../character-class-rules.ts';
import type { SpriteRows } from './avatar-types.ts';

export const motifFrames: Readonly<Record<ArchetypeId, readonly [SpriteRows, SpriteRows]>> = {
  backend: [
    ['y.....', 'lrrrrr', 'lryrrR', 'lrrrRR', 'lrrRrR', 'lrR..R', 'l.....', 'l.....', 'l.....', 'l.....', 'L.....'],
    ['y.....', 'lrrrr.', 'lryrrr', 'lrrrRR', 'lrrRR.', 'lrR.R.', 'l.....', 'l.....', 'l.....', 'l.....', 'L.....'],
  ],
  data: [
    ['......', '..a...', '.xaa..', '.xaaa.', 'xaaaa.', '.aaa..', '.aa...', '..a...', '......', 'x...x.', '......'],
    ['..a...', '.xaa..', '.xaaa.', 'xaaaa.', '.aaa..', '.aa...', '..a...', '......', '.x....', '....x.', '......'],
  ],
  frontend: [
    ['....L.', '...lL.', '...llL', '..lllL', '.kklL.', 'yokkLL', '.kkLLL', '...L.L', '......', '......', '......'],
    ['......', '......', '......', '.kk...', 'kokllL', 'ykklLL', '..lllL', '...lLL', '....L.', '......', '......'],
  ],
};

/** Prop name per motif, used in the SVG description and legend. */
export const MOTIF_PROP_NAMES: Readonly<Record<ArchetypeId, string>> = {
  backend: 'banner',
  data: 'crystal',
  frontend: 'hawk',
};
