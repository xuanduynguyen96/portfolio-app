// Test oracle: rasterizes `M/m x y h w v h h-w z` rectangle paths back into a set of "x,y" cells.
export function pathCells(d: string): Set<string> {
  const out = new Set<string>();
  let pen = { x: 0, y: 0 };
  for (const [, cmd, a, b, w, h] of d.matchAll(/([Mm])(-?\d+) (-?\d+)h(\d+)v(\d+)h-\d+z/g)) {
    pen = cmd === 'M' ? { x: Number(a), y: Number(b) } : { x: pen.x + Number(a), y: pen.y + Number(b) };
    for (let dy = 0; dy < Number(h); dy++) for (let dx = 0; dx < Number(w); dx++) out.add(`${pen.x + dx},${pen.y + dy}`);
  }
  return out;
}

/** "x,y" cells of a grid equal to `char`. */
export function gridCells(grid: readonly string[], char: string): Set<string> {
  return new Set(grid.flatMap((row, y) => [...row].flatMap((c, x) => (c === char ? [`${x},${y}`] : []))));
}
