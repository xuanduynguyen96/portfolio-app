// Shapes for the layered 32x32 pixel avatar. Grids are rows of single-char palette keys
// (`.` = transparent); a layer is a sub-rect placed at (x, y) on the 32x32 canvas.

export type LayerSlot = 'base' | 'class' | 'armor' | 'amulet' | 'boots' | 'shield' | 'job' | 'fx';

/** Paint order: higher z draws later; within a slot, list order. Last opaque pixel wins. */
export const LAYER_Z: Readonly<Record<LayerSlot, number>> = {
  base: 0,
  class: 10,
  armor: 20,
  amulet: 25,
  boots: 30,
  shield: 40,
  job: 50,
  fx: 60,
};

export interface SpriteLayer {
  slot: LayerSlot;
  x: number;
  y: number;
  rows: readonly string[];
}

/** 0 = key pose (also the static pose), 1 = second animation frame. */
export type AvatarFrame = 0 | 1;
export const AVATAR_FRAMES: readonly AvatarFrame[] = [0, 1];

export interface Point {
  x: number;
  y: number;
}

/** Inclusive pixel box. */
export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Unplaced sprite rows; every row has the same width. */
export type SpriteRows = readonly string[];

/** A sprite that carries its own top-left position on the 32x32 canvas. */
export interface PlacedSprite extends Point {
  rows: SpriteRows;
}

/** A job prop: frame A (rest, static pose) and frame B, each placed independently. */
export type JobPropFrames = readonly [PlacedSprite, PlacedSprite];

/** One sprite per tier 0-3, all the same size; tier n+1 only adds opaque pixels. */
export type TieredRows = readonly [SpriteRows, SpriteRows, SpriteRows, SpriteRows];

/** Where gear attaches on one frame of a class pose (top-left of each sprite). */
export interface PoseAnchors {
  armor: Point;
  amulet: Point;
  shield: Point;
  bootNear: Point;
  bootFar: Point;
}

/** Pixels that carry class identity (headgear, held items); gear + job art must stay out. */
export interface IdentityBoxes {
  head: Box;
  held: readonly Box[];
}

export interface PoseFrame {
  /** Full 32x32 class layer: body, outfit, headgear, weapon. No exterior outline (composer adds it). */
  rows: SpriteRows;
  anchors: PoseAnchors;
  identity: IdentityBoxes;
}

export interface ClassPose {
  /** Short visual description for the SVG `<desc>`. */
  look: string;
  frames: readonly [PoseFrame, PoseFrame];
}
