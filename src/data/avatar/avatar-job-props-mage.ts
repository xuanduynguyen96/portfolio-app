// Mage job props (zone x26-31, y7-25, narrow beside the staff): one per job, frame A = rest, frame B =
// the action. Enchanter rune pipeline (the lit stage advances), Summoner container crate (lid lifts,
// a puff rises), Seer floating eye (blinks).
import type { JobPropFrames } from './avatar-types.ts';

export const mageProps: Readonly<Record<'enchanter' | 'summoner' | 'seer', JobPropFrames>> = {
  enchanter: [
    {
      x: 26,
      y: 8,
      rows: ['..HH..', '.HxxH.', '.HxxH.', '..HH..', '..yy..', '..yy..', '..HH..', '.HaaH.', '.HaaH.', '..HH..', '..yy..', '..yy..', '..HH..', '.HaaH.', '.HaaH.', '..HH..'],
    },
    {
      x: 26,
      y: 8,
      rows: ['..HH..', '.HaaH.', '.HaaH.', '..HH..', '..yy..', '..yy..', '..HH..', '.HxxH.', '.HxxH.', '..HH..', '..yy..', '..yy..', '..HH..', '.HaaH.', '.HaaH.', '..HH..'],
    },
  ],
  summoner: [
    {
      x: 26,
      y: 12,
      rows: ['......', '......', '......', '...a..', '......', 'IIIIII', 'JJJJJJ', 'IIIIII', 'JIJJIJ', 'JIJJIJ', 'JIJJIJ', 'IIIIII'],
    },
    {
      x: 26,
      y: 12,
      rows: ['..aa..', '.axaa.', '..aa..', 'IIIIII', 'JJJJJJ', '......', '.xxxx.', 'IIIIII', 'JIJJIJ', 'JIJJIJ', 'JIJJIJ', 'IIIIII'],
    },
  ],
  seer: [
    {
      x: 26,
      y: 9,
      rows: ['.a..a.', '......', '.MMMM.', 'MxaaxM', 'MaooaM', 'MxaaxM', '.MMMM.', '......', '..x...', '...a..'],
    },
    {
      x: 26,
      y: 9,
      rows: ['......', '......', '......', '......', 'MMMMMM', '.MMMM.', '......', '......', '...x..', '..a...'],
    },
  ],
};
