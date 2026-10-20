// Job prop art (6x11 box, top-right of the pose), one per job slot: banner, crystal, hawk. Two frames
// each: the banner flutters, the crystal bobs, the hawk flaps. The 3 jobs of a class use the 3 props.
import type { MotifId } from '../character-job-rules.ts';
import type { SpriteRows } from './avatar-types.ts';

export const motifFrames: Readonly<Record<MotifId, readonly [SpriteRows, SpriteRows]>> = {
  banner: [
    ['y.....', 'lrrrrr', 'lryrrR', 'lrrrRR', 'lrrRrR', 'lrR..R', 'l.....', 'l.....', 'l.....', 'l.....', 'L.....'],
    ['y.....', 'lrrrr.', 'lryrrr', 'lrrrRR', 'lrrRR.', 'lrR.R.', 'l.....', 'l.....', 'l.....', 'l.....', 'L.....'],
  ],
  crystal: [
    ['......', '..a...', '.xaa..', '.xaaa.', 'xaaaa.', '.aaa..', '.aa...', '..a...', '......', 'x...x.', '......'],
    ['..a...', '.xaa..', '.xaaa.', 'xaaaa.', '.aaa..', '.aa...', '..a...', '......', '.x....', '....x.', '......'],
  ],
  hawk: [
    ['....L.', '...lL.', '...llL', '..lllL', '.kklL.', 'yokkLL', '.kkLLL', '...L.L', '......', '......', '......'],
    ['......', '......', '......', '.kk...', 'kokllL', 'ykklLL', '..lllL', '...lLL', '....L.', '......', '......'],
  ],
};
