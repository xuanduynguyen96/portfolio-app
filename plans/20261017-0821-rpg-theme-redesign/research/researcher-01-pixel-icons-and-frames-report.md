# Researcher-01: Pixel Icons + RPG Frames (2026-10-17)

Budget: 5/5 research calls used. Fetch failures: docs.astro.build, game-icons.net (DNS ENOTFOUND). Tag legend: `[SRC]` = search/fetch result this run; `[UNV]` = prior knowledge, no source this run, verify before relying.

## 1. Executive Summary
- Icons: integer scale of 8px grid (16/24/32/48). `image-rendering: crisp-edges` + `pixelated` fallback. `[SRC]` partial
- Astro `<Image>` = sharp resample = blur baked in. Keep pixel art out of astro:assets. `[UNV]` Astro internals
- Best icon path: inline SVG `<symbol>` sprite built from TS grid map, `shape-rendering: crispEdges`, `fill: currentColor`.
- Frames: `border-image` + `round` with pixel 9-slice art. Pure CSS (box-shadow/clip-path) only for 1px outlines.
- Gotchas: `border-radius` vs square `border-image`; `backdrop-filter` shape mismatch; `clip-path` clips `box-shadow`.
- game-icons.net = CC BY 3.0 → per-icon credit. Avoid by drawing own 8x8 art. `[UNV]` license text (fetch failed)

## 2. Technical Breakdown

### 2.1 Crisp pixel rendering
| Item | Finding | Conf | Src |
|---|---|---|---|
| `image-rendering: pixelated` | Nearest-neighbour upscale. Broadly supported; search summary says since ~2021 | med | [SRC](https://webreference.com/css/properties/image-rendering/), [SRC](https://modern-css.com/reference/properties/image-rendering/) |
| `image-rendering: crisp-edges` | Can I Use: Chrome/Edge partial (13+), Firefox 3.6+, Safari 7+ (full). Chrome partial = not reliable alone | med | [SRC](https://caniuse.com/mdn-css_properties_image-rendering_crisp-edges) |
| Recommended declaration | `image-rendering: crisp-edges; image-rendering: pixelated;` (invalid value dropped, later valid wins) | med | [SRC](https://dev.to/auroratide/pixelart-and-the-image-rendering-paradox-2p8k) |
| Default browser smoothing | Causes blur on enlarged pixel art; PNG/GIF over JPEG | high | [SRC](https://developer.mozilla.org/en-US/docs/Games/Techniques/Crisp_pixel_art_look) |
| Canvas alternative | `ctx.imageSmoothingEnabled = false` | high | [SRC](https://developer.mozilla.org/en-US/docs/Games/Techniques/Crisp_pixel_art_look) |

Integer scaling (8px grid, derived):
- 8 → 16 (2x), 24 (3x), 32 (4x), 48 (6x). All exact.
- 12, 20, 28 = non-integer → uneven pixels. Avoid.

Fractional devicePixelRatio `[UNV]` (no source this run):
- Device px = CSS px × DPR. Exact only when result is multiple of 8 device px.
- DPR 1.5: 16 CSS → 24 dev = 3x OK. 24 CSS → 36 dev = 4.5x BAD.
- DPR 1.25: 24 CSS → 30 dev = 3.75x BAD.
- No CSS rule guarantees crispness at all DPRs. Options: (a) accept 1-device-px seams at odd DPR; (b) `@media (resolution: 1.5dppx)` size overrides; (c) SVG rects with `crispEdges` (no nearest-neighbour seams, still AA at fractional px unless crispEdges).

### 2.2 Astro assets pipeline
Sourcing failed (docs.astro.build unreachable). All `[UNV]`:
- `<Image>` / `getImage()` run sharp. Any resize (width/height > source or < source) resamples → blur baked into file. 8px → 48px = blur.
- Default output format for raster = webp, lossy (quality ~80) → artifacts on pixel art even at native size. Set `format: 'png'` if kept.
- `inferSize`: reads intrinsic dimensions, no resize. Still re-encodes → still set format.
- Bypass options:
  1. `import iconUrl from './icons/x.png?url'` → Vite hashed URL, no sharp. Best.
  2. `public/icons/x.png` → static, no processing. Simple, no hash.
  3. Astro 5+ `image.service: passthroughImageService()` `[UNV]` name/version for Astro 7 unknown.
- Pixel-art rule: plain `<img>` + `image-rendering` class. Do not route through `<Image>`.

### 2.3 Icons: inline SVG vs PNG sprite
| Criterion | Inline SVG sprite (TS grid) | PNG sprite sheet |
|---|---|---|
| Theming | `fill: currentColor` → one icon, any palette | Multiple sheets per color/theme |
| Size | Run-merged rects ~150–400 B/icon `[UNV]` | PNG 8x8 ~70–150 B + sheet overhead; comparable |
| Crispness | Integer viewBox, `shape-rendering: crispEdges` (inherited) | Needs `pixelated`; DPR seams |
| A11y | `role="img"` + `aria-label`, or `aria-hidden` if decorative | `alt` text; same |
| Network | None; inline in HTML | HTTP request (cacheable) |
| Build | Generated from TS grid → unit-testable, typed IDs | Art tool export step |
| Cons | Repeat markup if inlined per use; use `<symbol>`+`<use>` to dedupe | Not themeable; needs image pipeline |

Recommend: inline SVG (see §4).

### 2.4 RPG frames
border-image (sourced: webreference, htmldog, modern-css):
- `border-image-slice` = 9 regions (4 corners, 4 edges, center). px for raster, coords for SVG.
- Center transparent unless `fill` keyword.
- `border-image-source` + `border-image-repeat`.
- Fallback: declare solid `border` first, border-image overrides when image loads.
- `repeat: round` tiles edges without partial pixels; `stretch` smears `[UNV]`, search summary agreed.
- Scale rule: `border-image-width` = slice × integer scale (e.g. slice 8 art px, width 16px = 2x).

Gotchas `[UNV]`:
- `border-radius`: border-image draws rectangular frame. Background/box-shadow still follow radius → mismatch. Use `border-radius: 0` on framed panels.
- `backdrop-filter`: blur region follows border-radius clip. Square frame + rounded blur = edge mismatch. Also creates stacking context / containing block for fixed children.
- `clip-path`: clips `box-shadow` and `outline`. Put shape clip on wrapper, or use `filter: drop-shadow()` for outlines.

Pure CSS alternative `[UNV]`:
- 1px-pixel outline: `box-shadow` ring of N px offsets (N = pixel size). Cheap, no asset.
- Stepped corners: `clip-path: polygon()` with N-px notches at each corner. Clips shadows → layer with wrapper.
- Limit: complex art (bevels, ornaments) needs PNG/SVG 9-slice.

## 3. Trade-off Matrix
| Option | Perf | Maint | Learn | Theming | A11y | Adoption cost |
|---|---|---|---|---|---|---|
| Inline SVG sprite (TS grid) | high (no request) | med (codegen) | med | high | good | low-med |
| PNG sprite + pixelated | high | med (art pipeline) | low | low | good | low |
| Astro `<Image>` for pixel art | med (blur, re-encode) | low | low | n/a | good | bad: blurs |
| border-image 9-slice PNG | high | med (art) | med | low | n/a | low |
| Pure CSS frame | high | low | med | high | n/a | low; limited look |

## 4. Risk Disclosure
- Astro 7 behavior not verified (docs unreachable). Astro internals in §2.2 are prior knowledge.
- Browser support from Can I Use summary only; MDN compat table not retrieved.
- Fractional DPR behavior not sourced.
- border-radius/backdrop-filter/clip-path gotchas not sourced.
- game-icons.net license text not fetched. Attribution format in §5 is prior knowledge.
- Maintenance: `crisp-edges` spec still "under discussion" per DEV article (older source).

## 5. Ranked Recommendations
1. **Inline SVG `<symbol>` sprite from TS grid map.** Themeable, no network, crisp via integer viewBox + crispEdges. Trade-off: codegen step.
2. **9-slice pixel PNG via `border-image` + `round`** for panels. Trade-off: art assets; border-radius must be 0.
3. **Raster pixel art (if any): `?url` or `public/` + `<img>` + `image-rendering`.** Avoid `<Image>`. Trade-off: no automatic optimization.
4. **Own 8x8 art (or verified CC0 pack).** Avoids game-icons CC BY attribution. Trade-off: art time. Verify license before any third-party pack.
5. **Pure CSS frames** for 1px outlines only. Trade-off: limited look.

## 6. Minimal Working Examples (illustrative, unverified)

```ts
// icons.ts — grid map, 1 char = 1 art px
export const sword = ['........','...##...','..###...','.###....','###.....','##......','#.......','........'] as const;
```

```css
.px { image-rendering: crisp-edges; image-rendering: pixelated; }
.panel {
  border: 4px solid #5a3e2b;          /* fallback */
  border-image: url(/ui/frame9.png) 8 / 16px round; /* slice 8 art px, width 2x */
  border-radius: 0;                   /* avoid radius mismatch */
}
```

```astro
---
import iconUrl from './icons/potion.png?url'; // bypass sharp
---
<img src={iconUrl} class="px" width="24" height="24" alt="" />
```

## 7. Attributed Sources
Fetched/searched this run (dates not returned by tool):
- https://caniuse.com/mdn-css_properties_image-rendering_crisp-edges
- https://developer.mozilla.org/en-US/docs/Games/Techniques/Crisp_pixel_art_look
- https://dev.to/auroratide/pixelart-and-the-image-rendering-paradox-2p8k (older)
- https://webreference.com/css/properties/image-rendering/
- https://modern-css.com/reference/properties/image-rendering/
- https://vale.rocks/micros/20260504-0426 (2026-05, not read in detail)
- https://webreference.com/css/properties/border-image-slice/
- https://htmldog.com/references/css/properties/border-image-slice/
- https://modern-css.com/reference/properties/border-image-slice
- https://www.w3schools.com/cssref/css3_pr_border-image-slice.asp
- https://community.aseprite.org/t/blurred-images-i-need-help-for-god-sake-im-going-uncanny/13474/2 (community, weak)

Failed (network): https://docs.astro.build/en/guides/images/ ; https://game-icons.net/about.html

Shortfall: 11 sources vs 15 target; 5-call cap.

## 8. Unresolved Questions
- Astro 7 image service API (passthrough name, `?url` behavior) — needs docs fetch.
- Exact game-icons.net CC BY 3.0 attribution string + whether per-icon credit is needed in bundled SVG vs credits page.
- Real fractional-DPR rendering of `crisp-edges` vs `pixelated` on current Chrome/Safari.
- border-image + border-radius + backdrop-filter interaction in current browsers — needs test page.
- Whether `image-rendering` applies to border-image raster sources in all browsers.
- Plan to pick art source: own art vs CC0 pack (opengameart/itch blocked).
