// Inline SVG markup for the avatar (rendered at build time by character-avatar.astro; the class/job switcher re-composes it in the browser from the same modules).
// `size` is the 32px art box at an integer scale (4/6/8 px per art pixel); the SVG is 36/32 of it
// because the sticker ring sits on a 2px padded viewBox. Frame B is only emitted when animated.
import { AVATAR_FRAMES, type AvatarFrame } from '../../data/avatar/avatar-types.ts';
import { avatarDescription, type AvatarProfile } from './avatar-description.ts';
import { AVATAR_SIZE } from './compose-avatar-grid.ts';
import { avatarPaths } from './avatar-svg-paths.ts';
import { composeAvatarSprite, STICKER_PAD } from './avatar-sticker-outline.ts';
import { selectAvatarLayers } from './select-avatar-layers.ts';

export const AVATAR_SIZES = [128, 192, 256] as const;
export type AvatarSize = (typeof AVATAR_SIZES)[number];
export const AVATAR_VIEWBOX = AVATAR_SIZE + 2 * STICKER_PAD;

export interface AvatarSvgOptions {
  profile: AvatarProfile;
  size: AvatarSize;
  /** Unique per page: prefixes the <title>/<desc> ids. */
  idPrefix: string;
  /** Emit both frames for the CSS frame swap (hero only). */
  animate?: boolean;
}

export function avatarFrameGrid(profile: AvatarProfile, frame: AvatarFrame): string[] {
  return composeAvatarSprite(selectAvatarLayers(profile, frame));
}

export function avatarFramePaths(grid: readonly string[]): string {
  return avatarPaths(grid)
    .map(({ cssVar, d }) => `<path style="fill:var(${cssVar})" d="${d}"/>`)
    .join('');
}

export function avatarSvgMarkup({ profile, size, idPrefix, animate = false }: AvatarSvgOptions): string {
  const { title, desc } = avatarDescription(profile);
  const scale = size / AVATAR_SIZE;
  const box = AVATAR_VIEWBOX * scale;
  const id = escapeXml(idPrefix);
  const frames = (animate ? AVATAR_FRAMES : AVATAR_FRAMES.slice(0, 1))
    .map((frame) => `<g class="avatar-frame-${frame === 0 ? 'a' : 'b'}">${avatarFramePaths(avatarFrameGrid(profile, frame))}</g>`)
    .join('');
  return (
    `<svg class="character-avatar" viewBox="0 0 ${AVATAR_VIEWBOX} ${AVATAR_VIEWBOX}" width="${box}" height="${box}"` +
    ` role="img" aria-labelledby="${id}-title" aria-describedby="${id}-desc" shape-rendering="crispEdges" focusable="false"` +
    `${animate ? ' data-animate=""' : ''}>` +
    `<title id="${id}-title">${escapeXml(title)}</title><desc id="${id}-desc">${escapeXml(desc)}</desc>${frames}</svg>`
  );
}

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
