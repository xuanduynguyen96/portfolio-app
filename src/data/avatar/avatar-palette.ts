// Avatar palette: single-char grid key -> CSS custom property `--avatar-<slug>` (design-tokens.css).
// Ramps share keys across roles to keep any one avatar <= 16 colors (e.g. leather = wood = hair,
// steel-light = beard, bronze = gold shade). `.` is transparent; `#` is the sticker ring (composer only).

export const AVATAR_PALETTE = {
  '#': 'sticker',
  o: 'outline',
  s: 'skin',
  S: 'skin-shade',
  k: 'steel-light',
  i: 'steel',
  I: 'steel-dark',
  y: 'gold',
  b: 'bronze',
  l: 'leather',
  L: 'leather-dark',
  r: 'red',
  R: 'red-dark',
  c: 'blue-light',
  u: 'blue',
  f: 'green-light',
  g: 'green',
  G: 'green-dark',
  n: 'teal',
  N: 'teal-dark',
  a: 'arcane',
  x: 'sparkle',
} as const;

export type PaletteKey = keyof typeof AVATAR_PALETTE;
export type PaletteSlug = (typeof AVATAR_PALETTE)[PaletteKey];

export const TRANSPARENT = '.';
export const OUTLINE_KEY = 'o';
export const STICKER_KEY = '#';

/** Keys in declaration order (ring first, outline second: they paint underneath everything). */
export const PALETTE_KEYS = Object.keys(AVATAR_PALETTE) as PaletteKey[];

export function isPaletteKey(char: string): char is PaletteKey {
  return Object.hasOwn(AVATAR_PALETTE, char);
}

export function avatarCssVar(key: PaletteKey): string {
  return `--avatar-${AVATAR_PALETTE[key]}`;
}
