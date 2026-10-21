// Warrior job props (zone x23-31, y0-13): one per job, frame A = rest, frame B = the action.
// Knight crest shield (glint runs the rim), Paladin sword with spring leaves (leaves sway, tip glints),
// Sentinel server watchtower (beacon flashes, status LEDs swap).
import type { JobPropFrames } from './avatar-types.ts';

export const warriorProps: Readonly<Record<'knight' | 'paladin' | 'sentinel', JobPropFrames>> = {
  knight: [
    {
      x: 23,
      y: 1,
      rows: ['xyyyyyyyy', 'xAAAkAAAy', 'yAAAkAAAy', 'ykkkkkkky', 'yAAAkAAAy', 'yAAAkAAAy', '.yAAkAAy.', '.yAAkAAy.', '..yAkAy..', '...yAy...', '....y....'],
    },
    {
      x: 23,
      y: 1,
      rows: ['yyyyyyyyy', 'yAAAkAAAy', 'yAAAkAAAy', 'ykkkkkkky', 'yAAAkAAAx', 'yAAAkAAAx', '.yAAkAAx.', '.yAAkAAy.', '..yAkAy..', '...yAy...', '....y....'],
    },
  ],
  paladin: [
    {
      x: 23,
      y: 0,
      rows: ['..k......', '..kI..BB.', '..kI.BBBB', '..kIBBBBB', '..kIBBBB.', '..kBBBB..', '.BBI.....', 'BBBI.....', '.BkI.....', 'yyyyyy...', '..lL.....', '..lL.....', '.yyyy....'],
    },
    {
      x: 23,
      y: 0,
      rows: ['.xkx..B..', '..kI.BBB.', '..kIBBBBB', '..kIBBBB.', '..kIBBB..', '..kB.....', 'BBBI.....', '.BBI.....', '..kI.....', 'yyyyyy...', '..lL.....', '..lL.....', '.yyyy....'],
    },
  ],
  sentinel: [
    {
      x: 24,
      y: 0,
      rows: ['...y...', '...i...', '.IIIII.', 'ICCCCCI', 'IkkkCyI', 'ICCCCCI', 'IkkkCrI', 'ICCCCCI', 'IkkkCyI', 'ICCCCCI', 'IIIIIII', '.I...I.'],
    },
    {
      x: 24,
      y: 0,
      rows: ['.x.x.x.', '...i...', '.IIIII.', 'ICCCCCI', 'IkkkCrI', 'ICCCCCI', 'IkkkCyI', 'ICCCCCI', 'IkkkCrI', 'ICCCCCI', 'IIIIIII', '.I...I.'],
    },
  ],
};
