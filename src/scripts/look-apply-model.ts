// Lazy chunk of the class/job switcher: composes the chosen look in the browser from the same
// modules as the build and swaps it into the avatars and nameplates. DOM APIs only (no innerHTML).
import { parseGear, lookAvatarModel, type LookAvatarModel } from '../utils/avatar/look-avatar-model.ts';
import { parseLookKey } from '../utils/avatar/class-looks.ts';
import type { AvatarPath } from '../utils/avatar/avatar-svg-paths.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';
const FRAME_CLASS = ['avatar-frame-a', 'avatar-frame-b'] as const;

function frameGroup(index: 0 | 1, paths: readonly AvatarPath[]): SVGGElement {
  const group = document.createElementNS(SVG_NS, 'g');
  group.setAttribute('class', FRAME_CLASS[index]);
  for (const { cssVar, d } of paths) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    path.style.setProperty('fill', `var(${cssVar})`);
    group.append(path);
  }
  return group;
}

/** Same shape as the server markup: hero (data-animate) keeps both frames, the sheet only frame A. */
function applyAvatar(svg: SVGSVGElement, model: LookAvatarModel): void {
  const title = svg.querySelector(':scope > title');
  const desc = svg.querySelector(':scope > desc');
  if (title) title.textContent = model.title;
  if (desc) desc.textContent = model.desc;
  svg.querySelectorAll(':scope > g').forEach((group) => group.remove());
  const count = svg.hasAttribute('data-animate') ? 2 : 1;
  for (let i = 0; i < count; i++) svg.append(frameGroup(i as 0 | 1, model.frames[i]));
}

function applyName(name: Element, model: LookAvatarModel): void {
  const className = name.querySelector('[data-look-class]');
  const job = name.querySelector<HTMLElement>('[data-look-job]');
  if (className) className.textContent = model.className;
  if (job) {
    job.textContent = model.jobName ? `· ${model.jobName}` : '';
    job.hidden = !model.jobName;
  }
}

/** Show `lookKey` everywhere on the page. Throws on an invalid key or bad gear JSON. */
export function renderLook(lookKey: string, gearJson: string): void {
  const look = parseLookKey(lookKey);
  if (!look) throw new Error(`invalid look ${lookKey}`);
  const model = lookAvatarModel(look, parseGear(gearJson));
  document.querySelectorAll<SVGSVGElement>('[data-look-avatar] svg.character-avatar').forEach((svg) => applyAvatar(svg, model));
  document.querySelectorAll('[data-look-name]').forEach((name) => applyName(name, model));
}
