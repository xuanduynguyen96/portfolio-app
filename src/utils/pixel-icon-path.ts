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
