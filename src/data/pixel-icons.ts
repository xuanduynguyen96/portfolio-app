// Pixel icon registry: every hand-authored 8x8 grid, keyed by name.
// `PixelIconName` is derived from the keys, so an unknown name fails `astro check`.
import { careerIcons } from './pixel-icons-career.ts';
import { gearIcons } from './pixel-icons-gear.ts';
import { hudIcons } from './pixel-icons-hud.ts';

export const pixelIcons = { ...careerIcons, ...hudIcons, ...gearIcons } as const;

export type PixelIconName = keyof typeof pixelIcons;

/** Grid width/height in cells (SVG viewBox is `0 0 8 8`). */
export const PIXEL_ICON_GRID = 8;

/** Allowed render sizes in px: integer multiples of the grid (2x/3x/4x/6x) keep pixels crisp. */
export const PIXEL_ICON_SIZES = [16, 24, 32, 48] as const;
export type PixelIconSize = (typeof PIXEL_ICON_SIZES)[number];

/** Grid legend: ink, shade, transparent. */
export const PIXEL_ICON_CHARS = { ink: '#', shade: '+', empty: '.' } as const;

export const PIXEL_ICON_NAMES = Object.keys(pixelIcons) as PixelIconName[];
