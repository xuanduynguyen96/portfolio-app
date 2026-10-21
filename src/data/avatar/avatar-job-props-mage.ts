// Mage job props, one per job, each frame placed on the 32x32 canvas.
import type { JobPropFrames } from './avatar-types.ts';

export const mageProps: Readonly<Record<'enchanter' | 'summoner' | 'seer', JobPropFrames>> = {
  enchanter: [
    { x: 26, y: 4, rows: ['y.....', 'lrrrrr', 'lryrrR', 'lrrrRR', 'lrrRrR', 'lrR..R', 'l.....', 'l.....', 'l.....', 'l.....', 'L.....'] },
    { x: 26, y: 4, rows: ['y.....', 'lrrrr.', 'lryrrr', 'lrrrRR', 'lrrRR.', 'lrR.R.', 'l.....', 'l.....', 'l.....', 'l.....', 'L.....'] },
  ],
  summoner: [
    { x: 26, y: 4, rows: ['......', '..a...', '.xaa..', '.xaaa.', 'xaaaa.', '.aaa..', '.aa...', '..a...', '......', 'x...x.', '......'] },
    { x: 26, y: 4, rows: ['..a...', '.xaa..', '.xaaa.', 'xaaaa.', '.aaa..', '.aa...', '..a...', '......', '.x....', '....x.', '......'] },
  ],
  seer: [
    { x: 26, y: 4, rows: ['....L.', '...lL.', '...llL', '..lllL', '.kklL.', 'yokkLL', '.kkLLL', '...L.L', '......', '......', '......'] },
    { x: 26, y: 4, rows: ['......', '......', '......', '.kk...', 'kokllL', 'ykklLL', '..lllL', '...lLL', '....L.', '......', '......'] },
  ],
};
