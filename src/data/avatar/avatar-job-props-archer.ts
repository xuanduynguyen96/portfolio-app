// Archer job props, one per job, each frame placed on the 32x32 canvas.
import type { JobPropFrames } from './avatar-types.ts';

export const archerProps: Readonly<Record<'ranger' | 'skirmisher' | 'herald', JobPropFrames>> = {
  ranger: [
    { x: 23, y: 1, rows: ['y.....', 'lrrrrr', 'lryrrR', 'lrrrRR', 'lrrRrR', 'lrR..R', 'l.....', 'l.....', 'l.....', 'l.....', 'L.....'] },
    { x: 23, y: 1, rows: ['y.....', 'lrrrr.', 'lryrrr', 'lrrrRR', 'lrrRR.', 'lrR.R.', 'l.....', 'l.....', 'l.....', 'l.....', 'L.....'] },
  ],
  skirmisher: [
    { x: 23, y: 1, rows: ['......', '..a...', '.xaa..', '.xaaa.', 'xaaaa.', '.aaa..', '.aa...', '..a...', '......', 'x...x.', '......'] },
    { x: 23, y: 1, rows: ['..a...', '.xaa..', '.xaaa.', 'xaaaa.', '.aaa..', '.aa...', '..a...', '......', '.x....', '....x.', '......'] },
  ],
  herald: [
    { x: 23, y: 1, rows: ['....L.', '...lL.', '...llL', '..lllL', '.kklL.', 'yokkLL', '.kkLLL', '...L.L', '......', '......', '......'] },
    { x: 23, y: 1, rows: ['......', '......', '......', '.kk...', 'kokllL', 'ykklLL', '..lllL', '...lLL', '....L.', '......', '......'] },
  ],
};
