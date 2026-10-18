// Pure grid -> SVG path conversion for 8x8 pixel icons (pixel-icon.astro).
// Each row is scanned left to right; consecutive cells of the same char merge into one
// 1px-tall rectangle `M{x} {y}h{w}v1h-{w}z`, keeping path data small and seam-free.

/** Rows of equal-length strings; `#` = ink, `+` = shade, `.` = transparent. */
export type PixelGrid = readonly string[];

/** Path data covering every cell equal to `char` (empty string when none match). */
export function gridToPathData(grid: PixelGrid, char: string): string {
  let d = '';
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] !== char) {
        x += 1;
        continue;
      }
      const start = x;
      while (x < row.length && row[x] === char) x += 1;
      const width = x - start;
      d += `M${start} ${y}h${width}v1h-${width}z`;
    }
  });
  return d;
}

/** True when any row contains `char` (used to skip an empty shade path). */
export function gridHasChar(grid: PixelGrid, char: string): boolean {
  return grid.some((row) => row.includes(char));
}

/**
 * Smaller path data for larger sprites (avatar): equal runs stacked in consecutive rows merge into one
 * rectangle `{x} {y}h{w}v{h}h-{w}z`, and each rectangle after the first moves relatively (`m`) from
 * the previous one's start (where `z` leaves the pen). Same coverage as gridToPathData.
 */
export function gridToMergedPathData(grid: PixelGrid, char: string): string {
  const rects: { x: number; y: number; w: number; h: number }[] = [];
  let open = new Map<string, (typeof rects)[number]>(); // "x,w" -> rect still growing downward
  grid.forEach((row, y) => {
    const next = new Map<string, (typeof rects)[number]>();
    let x = 0;
    while (x < row.length) {
      if (row[x] !== char) {
        x += 1;
        continue;
      }
      const start = x;
      while (x < row.length && row[x] === char) x += 1;
      const key = `${start},${x - start}`;
      const above = open.get(key);
      if (above) above.h += 1;
      else rects.push({ x: start, y, w: x - start, h: 1 });
      next.set(key, above ?? rects[rects.length - 1]);
    }
    open = next;
  });
  let d = '';
  let pen = { x: 0, y: 0 };
  rects.forEach((rect, index) => {
    d += index === 0 ? `M${rect.x} ${rect.y}` : `m${rect.x - pen.x} ${rect.y - pen.y}`;
    d += `h${rect.w}v${rect.h}h-${rect.w}z`;
    pen = rect;
  });
  return d;
}
