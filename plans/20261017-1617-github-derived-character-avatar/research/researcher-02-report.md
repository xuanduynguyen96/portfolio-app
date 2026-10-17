# Researcher-02: pixel RPG avatar (readability, composition, sourcing, a11y, validation)

Persisted by main agent from researcher hand-back. Sourcing thin: WebFetch DNS failures; [TK] = training knowledge, unverified. Tier-1 sources (MDN, WCAG, axe, Kenney license) not fetched.

## Summary
- 32x32 canvas, integer scale (4x=128 / 6x=192 / 8x=256 px). 24x32 fallback; 48x48 only if tier detail fails silhouette test. Confidence medium.
- Class identity = silhouette first (headgear, weapon, torso/cape mass), color second. Gear tier = added pixels + material ramp, not color alone. Confidence high.
- Hand-authored layers. Avoid LPC (CC-BY-SA 3.0 / GPL 3.0 dual; SVG conversion = derivative). Kenney CC0 optional reference only after license check.
- Build-time compose -> one inline SVG, RLE runs grouped per palette key, `shape-rendering="crispEdges"`, colors via CSS vars. Est 1.5-2.5 KB/avatar (unmeasured; budget <=3 KB).
- A11y: `role="img"` + `aria-labelledby` -> `<title>`/`<desc>`, plus visible HTML legend. Motion: `steps()` bob, transform-only, gated by reduced-motion.
- Validation: grid unit tests, pairwise combo snapshots, silhouette IoU test, dev-only gallery, human blind-ID test.

## 1. Readability
### Canvas
| Size | Verdict |
|---|---|
| 16x16 | Reject: can't fit gear slots + job + class |
| 24x32 | Fallback; no clean power-of-2 scales |
| 32x32 | **Recommended**: 4x/8x clean, enough for face + distinct clothing |
| 48x48 | Only if tests fail (~2.25x authoring) |
Chibi/SD proportions (big head, short thick limbs) [weak source].

### Class silhouettes
| Class | Silhouette | Color (secondary) |
|---|---|---|
| Warrior | Wide shoulders, helm (flat/horned), shield or greatsword, square outline | Steel/red |
| Mage | Tall pointed hat (triangle top), flared robe (trapezoid), staff w/ orb above head | Blue/violet |
| Archer | Hood/cap w/ feather, bow arc off one side, lean torso, cloak asymmetry, quiver | Green/brown |
- Unique 1px-outline silhouette per class (IoU test).
- Jobs within class differ by one silhouette prop; same base body.
- Color never sole cue (WCAG 1.4.1).

### Gear tiers
| Tier | Visual | Palette |
|---|---|---|
| 0 | Base item, no trim | Grey/leather |
| 1 | +1px trim | Bronze ramp |
| 2 | +plume/bulk (+2-4 px silhouette) | Iron/steel ramp |
| 3 | +bulk + 1-2 sparkle pixels, optional 2-frame shimmer (motion-gated) | Gold ramp + accent |
- Material = 3-shade ramp + outline. Tier monotonic: mask(n+1) ⊇ mask(n).
- Glow = stippled grid pixels, never CSS blur/drop-shadow.

### Palette
<=12 visible colors per avatar (8-10 target). Single-char keys, `.` transparent.

## 2. Composition
```ts
type Layer = { id: string; z: number; slot: 'base'|'class'|'job'|'head'|'weapon'|'armor'|'shield'|'fx'; rows: string[] }; // 32x32
type Palette = Record<string, string>; // key -> CSS var name
```
- z: base < class < job < armor < head < weapon < shield < fx. Last opaque wins -> one 32x32 char grid.
- Fixed canvas -> no anchors needed (store ox/oy only if gear authored on smaller canvas).
- SVG: one `<path>` per palette key, RLE `M{x} {y}h{w}v1h-{w}z` (existing `gridToPathData` already does this, size-agnostic). Optional greedy vertical merge ~20-30% smaller [TK].
- `width`/`height` attrs + `aspect-ratio: 1` (CLS 0). Integer scales only.
- Theming: palette keys -> CSS custom props w/ `light-dark()` (matches `design-tokens.css`).
- Forced colors: SVG fills may flatten [unverified] -> legend text must carry meaning; consider `forced-color-adjust: none` on avatar only if contrast checked.
- Gallery dedupe: `<symbol>` + `<use>` only there.

## 3. Sourcing
| Option | License | Verdict |
|---|---|---|
| Hand-authored | own | **Recommended** |
| Kenney | CC0 [TK] | reference/items only, verify |
| LPC | CC-BY-SA 3.0 + GPL 3.0 (OGA listing snippet) | Avoid for shipped art |

## 4. Accessibility
```html
<svg role="img" aria-labelledby="av-t av-d" viewBox="0 0 32 32">
  <title id="av-t">Warrior, Guardian</title>
  <desc id="av-d">Armor tier 2 (Security); Shield tier 3 (Testing)</desc>
</svg>
```
- Unique ids per instance. Visible `<dl>` legend: slot -> skill -> "Tier 2 of 3". No JS needed.
- Idle bob:
```css
@media (prefers-reduced-motion: no-preference) {
  .avatar { animation: bob 1.2s steps(2, end) infinite; }
}
@keyframes bob { to { transform: translateY(-8px); } }
```
Transform-only -> CLS 0. Tier-3 shimmer gated too.

## 5. Validation
- Unit: 32 rows x 32 chars; chars in palette or `.`; one layer per slot; tier masks monotonic; coverage band (25-75% [TK]); SVG bytes <= 3 KB.
- Pairwise combos (~20-30 instead of 3x3x4^4=2304), snapshot SVG text.
- Silhouette: opaque mask per class+job @ tier 0; max cross-class IoU < ~0.6 [TK]; also at 16x16 downsample.
- Dev gallery: all class x job x tiers, both themes, silhouette toggle; excluded from prod or noindex.
- Human blind-ID: 5 people, <=2s per thumbnail, >=80% correct [TK].

## Sources
- OGA LPC base assets (snippet) https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles
- https://www.sprite-ai.art/gallery/16x16 (vendor)
- https://community.aseprite.org/t/advice-on-practicing-for-8x8-16x16-and-32x32-characters/7986
- https://sorceress.games/blog/how-to-make-pixel-art-for-games-sprite-ready (vendor)
- https://pixnote.net/en/learn/game-assets (vendor)
- Not fetched: MDN shape-rendering / forced-colors / prefers-reduced-motion / steps(); WCAG 1.1.1, 1.4.1, 2.3.3; axe svg-img-alt; Kenney license.

## Unresolved
- LPC per-file terms (moot if hand-authored).
- Forced-colors rendering of inline SVG fills: test.
- 32x32 vs 24x32: decide via blind-ID on 2 prototypes.
- IoU threshold, tier-3 glow visibility at 4x: tune.
- Gear slot -> skill mapping list.
- Real gzip bytes per avatar: measure.
