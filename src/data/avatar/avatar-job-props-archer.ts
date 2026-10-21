// Archer job props (zone x23-31, y0-12): one per job, frame A = rest, frame B = the action.
// Ranger two-orbit atom (electrons advance), Skirmisher winged phone (wings flap, screen lights),
// Herald horn with a </> pennant (sound arcs leave the bell, the pennant tail sways).
import type { JobPropFrames } from './avatar-types.ts';

export const archerProps: Readonly<Record<'ranger' | 'skirmisher' | 'herald', JobPropFrames>> = {
  ranger: [
    {
      x: 23,
      y: 2,
      rows: ['.DD...xD.', 'D..D.D..D', 'D...D...D', '.D.DbD.D.', '..DbybD..', '.D.DbD.D.', 'D...D...D', 'D..D.D..D', '.Dx...DD.'],
    },
    {
      x: 23,
      y: 2,
      rows: ['.DD...DD.', 'D..D.D..D', 'D...D...x', '.D.DbD.D.', '..DbxbD..', '.D.DbD.D.', 'x...D...D', 'D..D.D..D', '.DD...DD.'],
    },
  ],
  skirmisher: [
    {
      x: 23,
      y: 1,
      rows: ['k.IIIII.k', 'kkIEEEIkk', '.kIExEIk.', '..IEEEI..', '..IEEEI..', '..IEEEI..', '..IEEEI..', '..IIkII..', '..IIIII..'],
    },
    {
      x: 23,
      y: 1,
      rows: ['..IIIII..', '..IxEEI..', '..IExEI..', '..IEExI..', '.kIEEEIk.', 'kkIEEEIkk', 'k.IEEEI.k', '..IIkII..', '..IIIII..'],
    },
  ],
  herald: [
    {
      x: 23,
      y: 0,
      rows: ['......y..', 'Lyyyyyy..', '.l...ly..', 'FFFFFFFFF', 'FxFFFxFxF', 'xFFFxFFFx', 'FxFxFFFxF', 'FFFFFFFFF', 'FFF...FFF', 'FF.....FF'],
    },
    {
      x: 23,
      y: 0,
      rows: ['......yx.', 'Lyyyyyy.x', '.l...lyx.', 'FFFFFFFFF', 'FxFFFxFxF', 'xFFFxFFFx', 'FxFxFFFxF', 'FFFFFFFFF', 'FFFF..FFF', '.FF....FF'],
    },
  ],
};
