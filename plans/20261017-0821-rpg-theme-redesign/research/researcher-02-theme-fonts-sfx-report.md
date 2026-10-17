# Researcher-02: Theme, Fonts, SFX, Perf (RPG redesign)

Date: 2026-10-17. Scope: 5 topics. Tool limit hit (5/5 web calls).

## 0. Source status (READ FIRST)

- Web fetch FAILED: `fontsource.org`, `kenney.nl`, `docs.astro.build` -> `getaddrinfo ENOTFOUND` (DNS from sandbox). Results below marked [K] = from knowledge, NOT verified this session. Re-verify before locking decisions.
- WebSearch OK: prefers-reduced-sound query only.
- Contrast ratios: computed locally (WCAG 2.x relative luminance formula), exact.
- Confidence tags: [V] verified this session, [K] knowledge/unverified, [C] computed.

## 1. Executive Summary

- Heading font: **Cinzel** [K] (OFL) > MedievalSharp [K] (OFL). Cinzel caps, better AA legibility. MedievalSharp only >=32px.
- HUD/label font: **Pixelify Sans** [K] (OFL) for mixed-case labels; **Silkscreen** [K] (OFL) for short all-caps tags. Avoid Press Start 2P for anything beyond 1-2 words.
- Body: readable sans, self-hosted, 1 variable file. No pixel/blackletter in body.
- Palette below: all body text >=5.4:1 [C]; UI boundaries >=3:1 with strong border token.
- Theme: no-flash head script + `data-theme` on `<html>` (survives ClientRouter swaps) + `astro:after-swap` re-apply [K].
- SFX: Web Audio API, muted default, zero audio bytes fetched until opt-in [K]. No `prefers-reduced-sound` exists [V: search found none; only reduced-motion/-data/-transparency/-strobing proposals].
- Perf: cap at 2 extra font files, latin subset, preload only heading, metric-matched fallback for CLS 0 [K].

Confidence: fonts licences HIGH [K], font file sizes LOW, ClientRouter API MED [K], SFX licence MED [K], reduced-sound absence HIGH [V].

## 2. Technical Breakdown

### 2.1 Fonts

| Font | Role | Licence | Weights (Google Fonts) | Notes | Conf |
|---|---|---|---|---|---|
| MedievalSharp | heading | OFL 1.1 | 400 only | Gothic/blackletter-ish. Mixed-case legibility weak at <32px. Fontsource pkg `@fontsource/medievalsharp` [K] | MED |
| Cinzel | heading | OFL 1.1 | 400-900 variable | Roman caps. Reads "RPG" without hurting AA. Use 600-700 only [K] | HIGH |
| Pixelify Sans | HUD labels | OFL 1.1 | 400-700 variable | Pixel look, lowercase OK, readable 14px+ [K] | MED |
| Silkscreen | HUD tags | OFL 1.1 | 400, 700 | Designed for small sizes, caps-only feel [K] | MED |
| Press Start 2P | HUD (avoid) | OFL 1.1 | 400 | Very wide, 8px grid, poor for strings >2 words; cost in tracking/width [K] | MED |

Recommendation (ranked):
1. Cinzel (headings) + Pixelify Sans (labels). Two extra files. Best legibility/feel ratio.
2. MedievalSharp (headings) + Silkscreen (tags). Stronger medieval flavor; use only large.
3. Press Start 2P: only for numeric HUD counters (short strings). Not for nav/labels.

Legibility rules [K]:
- Heading min 24px desktop, 20px mobile; no pixel font under 14px.
- Pixel fonts: letter-spacing 0.02-0.06em; test at 200% zoom.
- Fallback stack: `Cinzel, "Iowan Old Style", Georgia, serif` (serif fallback reduces CLS).

### 2.2 Palette

Dark "dungeon" and light "parchment". Hex tokens on `:root`.

| Token | Dark | Light | Notes |
|---|---|---|---|
| --bg | #14110F | #F4ECD8 | page |
| --surface | #1F1A17 | #FBF6E9 | cards |
| --text | #EAE0CC | #2B1F14 | body |
| --muted | #A89C88 | #5C4D3A | secondary text |
| --gold | #D9A441 | #7A5A12 | accent; light uses darker for text |
| --crimson | #E5635A (text) | #8B1E2D | danger/accent; dark uses lighter |
| --arcane | #9C8CF0 | #4B3A8C | links/focus alt |
| --border-strong | #7A6A58 | #6B5A3E | input/button boundaries (UI 3:1) |
| --border-soft | #4A3F35 | #8C7A5B | decorative only, NOT control boundary |

Contrast [C] (WCAG 2.x):

| Pair | Ratio | Pass |
|---|---|---|
| dark text / bg | 14.36 | AA body, AAA |
| dark text / surface | 13.16 | AA |
| dark muted / bg | 6.96 | AA |
| dark muted / surface | 6.38 | AA |
| dark gold / bg | 8.36 | AA |
| dark gold / surface | 7.66 | AA |
| dark arcane / bg | 6.65 | AA |
| dark crimson-text / bg | 5.61 | AA |
| dark border-strong / bg | 3.61 | UI 3:1 pass |
| dark border-soft / bg | 1.84 | FAILS 3:1 -> decorative only |
| light text / bg | 13.63 | AA |
| light text / surface | 14.87 | AA |
| light muted / bg | 6.92 | AA |
| light muted / surface | 7.55 | AA |
| light gold-text / bg | 5.41 | AA body |
| light gold-text / surface | 5.90 | AA |
| light crimson / bg | 7.68 | AA |
| light arcane / bg | 7.81 | AA |
| light border-strong / bg | 5.65 | UI pass |
| light border-soft / bg | 3.53 | UI pass (but keep strong for controls) |

Rules:
- Focus ring: use --gold (dark) / --crimson (light). Both >=7.6 vs bg. Min 2px, 3:1 vs adjacent [1.4.11].
- Never gold-on-parchment at light body size except --gold-text (5.41).
- Gradients/textures: keep text on flat --surface. Texture overlay can drop contrast; test.
- Run axe on both themes in CI; dark/light separately.

### 2.3 Theme in Astro ClientRouter [K unless noted]

- ClientRouter is the Astro 5+ name (formerly `ViewTransitions`) [K]. Astro "7" existence not verified; pin versions per package.json.
- Head inline script runs before paint -> no flash.
- `data-theme` on `<html>`: `<html>` element not replaced on swap [K] -> state persists. Still re-apply on `astro:after-swap` (cheap, safe).
- Guard listener to avoid duplicates if script re-runs.

Snippet (head, `is:inline`):

```html
<script is:inline>
(() => {
  const KEY = 'theme';
  const apply = () => {
    let t = null;
    try { t = localStorage.getItem(KEY); } catch {}
    if (t !== 'light' && t !== 'dark') t = null; // null = follow system
    const dark = t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    const eff = dark ? 'dark' : 'light';
    const el = document.documentElement;
    el.dataset.theme = eff;
    el.style.colorScheme = eff;
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.content = dark ? '#14110F' : '#F4ECD8';
  };
  apply();
  if (!window.__themeInit) {
    window.__themeInit = true;
    document.addEventListener('astro:after-swap', apply);
  }
  window.__setTheme = (t) => { try { localStorage.setItem(KEY, t); } catch {} apply(); };
})();
</script>
```

CSS:
```css
:root { color-scheme: light; }
:root[data-theme="dark"] { color-scheme: dark; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { color-scheme: dark; } }
body { background: var(--bg); color: var(--text); }
```
- `color-scheme` fixes native form controls/scrollbars.
- `theme-color`: JS-updated (media-query metas do not follow manual override). Keep one meta.
- Toggle: `<button aria-pressed>` or 3-state (system/light/dark) with visible label. Persist only preference, never sync to server.
- Caution: `localStorage` may throw (private mode) -> try/catch done above.

### 2.4 Opt-in UI SFX

- Web Audio API vs `<audio>`:
  - Web Audio: low latency, overlapping blips, one `AudioContext`, pre-decoded `AudioBuffer`s, `GainNode` volume [K]. Preferred for UI blips.
  - `<audio>`: simpler, higher latency, clone-node for overlap. Fine for 1-2 cues.
- Autoplay: `AudioContext` starts `suspended` until user gesture. Create/resume inside the toggle click handler [K].
- Muted default. Toggle persisted in localStorage (try/catch). Do not auto-play on load.
- Lazy load: `fetch` + `decodeAudioData` only after opt-in. Zero audio bytes on default path. Verify with Network panel in Playwright test.
- Format: OGG Vorbis smallest; MP3 fallback for Safari versions lacking Ogg [K, verify Safari support matrix]. Ship both only if needed.
- Sizes: UI blip 0.5-3 s, mono, 22-44.1 kHz, ~5-30 KB each [K estimate].
- Pause when `document.hidden` [K].
- Reduced motion: `prefers-reduced-motion` is NOT a sound preference [V: search lists it as motion-only]. Recommend: default off already covers it; optionally also disable SFX when reduced-motion set (opinion, not standard).
- `prefers-reduced-sound`: NOT a CSS media feature. Search returned no such feature [V]. Only reduced-motion, reduced-data (experimental), reduced-transparency, and a strobing proposal (W3C archive) [V]. Do not design around it.
- Kenney licence: Kenney's site states assets are CC0 [K]. Packs "Interface Sounds" and "RPG Audio" exist [K]. Not verified this session (fetch failed). Verify on kenney.nl and keep a LICENSE/credits note even if CC0 (courtesy, not required).

### 2.5 Perf / CLS

- Each webfont file = 1 request. Latin woff2 single weight typically ~15-40 KB [K estimate; verify with Fontsource file list].
- Budget: 2 extra families, 1-2 weights each. Subset to latin (+ latin-ext only if needed).
- Preload only the above-fold heading file:
  `<link rel="preload" href="/fonts/cinzel-600-latin.woff2" as="font" type="font/woff2" crossorigin>` [K]. `crossorigin` required even same-origin.
- `font-display`: `swap` for heading (text visible fast, minor shift) vs `optional` for HUD labels (no shift, may fall back on slow net) [K].
- CLS 0: metric-matched fallback via `@font-face` `size-adjust`, `ascent-override`, `descent-override`, `line-gap-override` on a local fallback face [K]. Measure with Lighthouse/Playwright CLS.
- Fontsource npm CSS: self-hosted, Astro bundles files; avoid Google Fonts CDN (extra DNS/TLS, GDPR issues) [K].
- Lighthouse: fonts add LCP risk only if heading is LCP element and not preloaded. Keep heading font preloaded; body system/variable sans.
- Playwright+axe: add test asserting `document.fonts.ready` and no CLS >0.01 on theme toggle and view transition.

## 3. Trade-off Matrix

| Option | Legibility | Flavor | Perf cost | Licence | Maint |
|---|---|---|---|---|---|
| Cinzel heading | High | RPG-classic | Low (1 file) | OFL | Low |
| MedievalSharp heading | Med (<32px) | High medieval | Low | OFL | Low |
| Pixelify Sans HUD | Med-High (14px+) | High pixel | Low | OFL | Low |
| Silkscreen HUD | High small caps | Med pixel | Low | OFL | Low |
| Press Start 2P HUD | Low (wide, long text) | High | Low | OFL | Low |
| Web Audio SFX | High (latency) | n/a | Lazy, low | n/a | Med (code) |
| <audio> SFX | Med (latency) | n/a | Lazy, low | n/a | Low |
| Theme inline script | n/a | n/a | ~0 | n/a | Low |

## 4. Risk Disclosure

- Source gap: 3 of 4 target domains unreachable. Licence and API claims for Fontsource, Kenney, Astro = unverified.
- ClientRouter behaviour across Astro versions may differ; verify `astro:after-swap` and head-script rerun semantics against pinned version.
- Pixel fonts + variable weights: some foundries ship only subsets; check Fontsource file list for `wght` axis before promising 500 weight.
- SFX adds bundle + QA surface (mute state, tab visibility, iOS silent switch behaviour). Keep to 3-5 cues.
- Safari Ogg support: verify before dropping MP3.
- Theme: `localStorage` denied in some contexts -> fallback to system. Acceptable.
- Pixel and blackletter fonts vs WCAG 1.4.12 (text spacing): test with user stylesheet overrides.

## 5. Ranked Recommendations

1. Headings: Cinzel 600 (preload, latin subset). Rationale: legibility + RPG look, OFL.
2. HUD labels: Pixelify Sans 500/700 (font-display optional). Rationale: pixel flavor, readable at 14px+.
3. Body: existing readable sans (no change). Rationale: AA, perf.
4. Theme: inline head script + `data-theme` + `astro:after-swap` + `color-scheme` + JS theme-color. Rationale: no flash, survives swaps.
5. Palette: dark/light tokens above. Use --border-strong for controls, --border-soft decorative only.
6. SFX (if built): Web Audio, muted default, lazy decode after opt-in, 3-5 OGG cues, pause on hidden. Rationale: zero cost unless used.
7. Skip MedievalSharp unless brand demands blackletter; then large-only.

## 6. Minimal Working Examples

- Theme script + CSS: see section 2.3.
- Preload:
```html
<link rel="preload" href="/fonts/cinzel-600-latin.woff2" as="font" type="font/woff2" crossorigin>
```
- SFX gate:
```js
let ctx, buffers = {};
btn.addEventListener('click', async () => {
  ctx ??= new AudioContext();
  await ctx.resume();
  if (!buffers.blip) {
    const b = await fetch('/sfx/blip.ogg').then(r => r.arrayBuffer());
    buffers.blip = await ctx.decodeAudioData(b);
  }
  // play on interactions only when enabled
});
```

## 7. Attributed Sources

Verified this session [V]:
- Search: MDN prefers-reduced-data (experimental): https://developer.mozilla.org/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-data
- Chrome DevTools, emulate CSS media features (reduced-motion, reduced-transparency): https://developer.chrome.com/docs/devtools/rendering/emulate-css
- W3C CSS archive, prefers-reduced-strobing proposal (2023-03): https://lists.w3.org/Archives/Public/public-css-archive/2023Mar/1099.html
- Intopia, prefers-reduced-motion Firefox support: https://intopia.digital/articles/tag/css/

Not fetched (DNS fail) [K] - verify before citing:
- Fontsource MedievalSharp / Cinzel / Pixelify Sans / Silkscreen / Press Start 2P: https://fontsource.org/fonts/medievalsharp (and /cinzel, /pixelify-sans, /silkscreen, /press-start-2p)
- Kenney RPG Audio / Interface Sounds (CC0): https://kenney.nl/assets/rpg-audio , https://kenney.nl/assets/interface-sounds
- Astro View Transitions / ClientRouter: https://docs.astro.build/en/guides/view-transitions/
- MDN Autoplay policy: https://developer.mozilla.org/docs/Web/Media/Autoplay_guide
- MDN Web Audio API: https://developer.mozilla.org/docs/Web/API/Web_Audio_API
- web.dev font-display / CLS: https://web.dev/articles/font-best-practices , https://web.dev/articles/cls

## 8. Unresolved Questions

1. Exact Fontsource file sizes and available weights for each font (fetch failed).
2. Kenney CC0 wording on the two pack pages (fetch failed) - confirm before shipping.
3. Astro "7": confirm version exists and ClientRouter API/event names unchanged (fetch failed).
4. Head-script re-execution semantics under ClientRouter for pinned Astro version.
5. Safari Ogg Vorbis support on target browser matrix - MP3 needed?
6. Sandbox DNS failure for fontsource.org/kenney.nl/docs.astro.build: proxy config (/root/.ccr/README.md) not checked. Re-run research once reachable.
7. Lighthouse numeric impact of 2 extra fonts not measured; recommend lab test on prototype.
