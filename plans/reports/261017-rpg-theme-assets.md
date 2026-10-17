# Research: Free RPG Theme Assets for Portfolio App

Date: 2026-10-17 · Budget: 5 searches (used 5) · Stack: Astro 7 static, GSAP, SVG covers, Fontsource fonts

## Table of Contents
- [Executive Summary](#executive-summary)
- [Research Methodology](#research-methodology)
- [Key Findings](#key-findings)
- [Comparative Analysis](#comparative-analysis)
- [Implementation Recommendations](#implementation-recommendations)
- [Resources & References](#resources--references)
- [Unresolved Questions](#unresolved-questions)

## Executive Summary

**Recommendation: build the kit from Kenney (CC0) + game-icons.net (CC BY 3.0) + one OFL display font.**

- **Kenney** (kenney.nl, CC0): best base. Fantasy UI Borders (130+ sprites), UI Pack RPG extension, UI Pack Adventure (128 sprites), 50 RPG SFX, 51 UI SFX. CC0 = no attribution, no license file bloat.
- **game-icons.net** (Lorc et al., CC BY 3.0): the largest RPG icon library found. SVG, recolorable via CSS `fill`. Attribution required, so add a credits page.
- **Fonts**: MedievalSharp (OFL, Google Fonts). Verify Fontsource package before self-hosting.
- **Avoid as primary**: 496 pixel icons (2015, CC0 but pixel style clashes with futuristic-SVG aesthetic); AntumDeluge consolidated pack (2020, mixed sub-licenses, check each).

Rich enough? Yes for icons, UI frames and audio. Weak for full-color illustrated RPG art and character sprites. Those need a second source (itch.io free packs) and per-pack license check, not covered by these searches.

## Research Methodology
- Sources consulted: 5 web searches (standard mode). Results: mostly OpenGameArt listings, itch.io, Godot asset library, one aggregator guide. Official kenney.nl and game-icons.net pages were **not** fetched directly.
- Date range: undated listings; Kenney/Lorc packs are multi-year old, OGA CC0 pack dated 2015 and 2020.
- Key search terms: "Kenney RPG icon pack CC0", "game-icons.net RPG license CC BY 3.0", "OpenGameArt CC0 RPG icons pack", "free RPG fantasy fonts OFL MedievalSharp Cinzel", "Kenney RPG sound effects CC0".

## Key Findings

### Technology Overview
Asset types useful for an RPG-themed portfolio (quest/skill/XP/HUD motif already in repo):

| Need | Asset type | Format to want |
|------|-----------|----------------|
| Skill-tree nodes, item/class icons | Icon sets | SVG |
| Panels, dialogs, HUD frames, buttons | UI sprite packs | SVG source or PNG 9-slice |
| Headings, quest titles | Display fonts | WOFF2 (OFL) |
| Level-up, quest-complete, click | SFX | OGG (+ WAV for Godot only) |

### Current State & Trends
- Kenney: all current packs CC0. Kenney Audio packs CC0 (per guide; verify on kenney.nl).
- game-icons.net: continued by community; SVG versions, regular additions (per OGA comment, unverified on site).
- OpenGameArt: large CC0 catalog but old and inconsistent licensing. Check each page.

### Best Practices
- Prefer CC0 to avoid attribution drift. Use CC BY only where icon quality demands it, and log credits in one place.
- Keep an `ATTRIBUTIONS.md` (or `/credits` route) listing every pack, author, license URL.
- Store license text next to each pack in `src/assets/rpg-kit/LICENSES/`.
- Use SVG icons inline or via Astro `<Image>`/SVG import; color via `currentColor` to match theme tokens.
- Audio: ship OGG only, keep files small, add a mute toggle (portfolio is motion-heavy; respect `prefers-reduced-motion` and autoplay rules).

### Security Implications
- Downloaded packs are untrusted archives: unzip into empty dir, scan, never execute bundled scripts (some itch packs include .exe/.html demos).
- Avoid packs bundling proprietary fonts or assets from commercial games (ripped content). Stick to listed CC0/OFL/CC BY sources.
- License risk is the real security issue: "free" on itch.io often means "pay-what-you-want" or "personal use only". Verify.

### Performance Insights
- SVG icon sprite (one `<symbol>` sheet) beats 500 separate requests. Build step can inline used icons only.
- Audio: keep SFX under ~50 KB each; lazy-load on first user gesture (matches existing GSAP lazy pattern).
- Pixel sheets: use `image-rendering: pixelated` if any PNG art is used.

## Comparative Analysis

| Source | Pack (verified in search) | Count | License | Style fit | Notes |
|--------|--------------------------|-------|---------|-----------|-------|
| Kenney | Fantasy UI Borders | 130+ sprites | CC0 | High (fantasy frames) | Name-your-price on itch; free via kenney.nl |
| Kenney | UI Pack RPG extension | not stated | CC0 | High | OGA listing |
| Kenney | UI Pack – Adventure | 128 PNG tiles + sheet + vector source | CC0 | High | Vector sources = SVG-friendly |
| Kenney | Game Icons expansion | 64 icons | CC0 | Medium | Tagged RPG |
| Kenney | 50 RPG sound effects (OGG) | 50 | CC0 | High | OGA hosted |
| Kenney | 51 UI sound effects | 51 | CC0 | High | Buttons, switches, clicks |
| Kenney | UI Audio (Godot repack) | 50 | CC0 | — | WAV conversion; use Kenney original for web |
| game-icons.net (Lorc + community) | RPG icon collection | Thousands (count **not verified** in search; site claims large set) | CC BY 3.0 | Very high (RPG-native) | SVG; attribute "Lorc" + site |
| OGA (Lazarini) | 496 pixel art RPG icons | 496 | CC0 | Low–medium (pixel) | 2015 upload |
| OGA (AntumDeluge) | Consolidated icon packs | multiple | CC0 (per pack) | Medium | Dec 2020; verify each |
| Google Fonts | MedievalSharp | 1 weight | OFL | High (display headings) | Kalinowski; language coverage conflicting |
| itch.io | Mork Dungeon font | 1 font | OFL, commercial OK w/o attribution, no standalone sale | Medium (manuscript) | Mörk Borg–style |

**Verdict per need:**
- Icons: game-icons.net (SVG, volume) + Kenney Game icons (CC0 supplement).
- UI frames: Kenney Fantasy UI Borders (primary), UI Pack Adventure (vector sources).
- Fonts: MedievalSharp for headings. Cinzel not verified (search returned nothing); check Google Fonts directly.
- Sound: Kenney RPG SFX + UI SFX (both CC0).

## Implementation Recommendations

### Quick Start Guide
1. Download from official pages (kenney.nl, game-icons.net, Google Fonts). Not mirrors.
2. Extract each pack into its own empty dir under scratchpad; review contents; copy only needed files to repo.
3. Create `src/assets/rpg-kit/` (SVG/PNG) and `public/audio/rpg/` (OGG).
4. Create `src/assets/rpg-kit/LICENSES/` with each license text; add `ATTRIBUTIONS.md` at repo root and a credits section on site.
5. Map assets to Career RPG concepts: skill node icons, quest difficulty badges (`side|main|raid`), boss frame, HUD borders.
6. Add a single icon sprite build step, or import SVG per icon in Astro components.

### Code Examples

Inline SVG with theme color (game-icons are monochrome SVG):

```astro
---
// src/components/RpgIcon.astro
const { src, label } = Astro.props;
---
<span class="rpg-icon" role="img" aria-label={label}>
  <Fragment set:html={src} />
</span>
<style>
  .rpg-icon svg { width: 1.5em; height: 1.5em; fill: currentColor; }
</style>
```

Lazy-loaded SFX on first gesture (no autoplay, reduced-motion aware):

```ts
// src/lib/sfx.ts
const cache = new Map<string, HTMLAudioElement>();
let enabled = !matchMedia("(prefers-reduced-motion: reduce)").matches;

export function play(name: "levelUp" | "questDone" | "click") {
  if (!enabled) return;
  let a = cache.get(name);
  if (!a) {
    a = new Audio(`/portfolio-app/audio/rpg/${name}.ogg`);
    cache.set(name, a);
  }
  a.currentTime = 0;
  void a.play().catch(() => {}); // blocked until user gesture: ignore
}
```

Font via Fontsource (verify package exists first):

```bash
npm i @fontsource/medievalsharp
```

```ts
// src/layouts/Base.astro frontmatter
import "@fontsource/medievalsharp/400.css";
```

### Common Pitfalls
- **Downloading from aggregators** (cinevva, gtstu, itch mirrors): licenses restated wrong. Use source pages.
- **Mixed-license packs** (OGA consolidated, itch bundles): one CC-BY file taints the pack. Audit per file.
- **Pixel + SVG mix**: style clash with GSAP glow/gradient UI. Pick one lane (SVG) for the futuristic theme.
- **Attribution forgotten**: CC BY needs author + license + link. Build it into the credits route, not memory.
- **Audio autoplay**: browsers block; start only on user action. Respect reduced motion.
- **Font size/weight**: MedievalSharp has one weight; don't use it for body text (readability, a11y contrast checks in e2e/axe).

## Resources & References

### Official Documentation
- Kenney asset library, CC0 license info — https://kenney.nl/assets (license on each pack page; not directly fetched)
- Kenney Fantasy UI Borders (itch) — https://kenney-assets.itch.io/fantasy-ui-borders
- game-icons.net — https://game-icons.net (license and icon count not verified in this research)
- Google Fonts MedievalSharp — https://fonts.google.com/specimen/MedievalSharp
- SIL Open Font License — https://openfontlicense.org
- Creative Commons BY 3.0 — https://creativecommons.org/licenses/by/3.0/

### Recommended Tutorials
- Astro SVG/asset handling — https://docs.astro.build (verify current v7 image/SVG docs)

### Community Resources
- OpenGameArt — https://opengameart.org (filter by CC0, sort by date)
- Godot Asset Library Kenney UI Audio repack — https://godotengine.org/asset-library/asset/796

### Further Reading
- Cinevva free game UI kits guide (2026, aggregator — verify all claims) — https://app.cinevva.com/guides/free-game-ui-kits-fonts
- Mork Dungeon font page — https://markgosbell.itch.io/mork-dungeon

## Appendices

### A. Glossary
- **CC0**: public domain dedication; no attribution required.
- **CC BY 3.0**: free reuse incl. commercial, attribution required.
- **OFL (SIL Open Font License)**: font reuse, embedding, redistribution; can't sell font alone.
- **Sprite sheet / 9-slice**: one image split into tiles; corners fixed, edges stretched.
- **SFX**: sound effect.
- **OGG**: open audio container, good web support.

### B. Compatibility Matrix
| Asset | Format | Astro static | Notes |
|-------|--------|--------------|-------|
| Kenney UI (PNG) | PNG | yes | Use `<Image>`; 9-slice via CSS `border-image` |
| Kenney UI Adventure | SVG source | yes | Best for theme color |
| game-icons.net | SVG | yes | `fill: currentColor` |
| MedievalSharp | WOFF2 via Fontsource | yes | Self-hosted, matches existing fonts approach |
| Kenney SFX | OGG | yes | Lazy load; not in e2e tests by default |

### C. Raw Research Notes
- Kenney Fantasy UI Borders listing: 130+ sprites, CC0, name-your-price.
- OGA "ui pack RPG extension": CC0, tagged RPG/Fantasy.
- OGA "ui pack adventure": 128 sprites, CC0.
- OGA "game icons expansion": 64 icons, CC0 (Kenney).
- OGA RPG icons (Lorc): CC BY 3.0, attribution "Lorc" required; SVG continuation at game-icons.net.
- OGA "496 pixel art RPG icons" (Lazarini, 2015): CC0.
- OGA "consolidated" (AntumDeluge, Dec 2020): CC0 sub-packs.
- MedievalSharp: OFL, single weight, language count conflicting (48 vs 59).
- Mork Dungeon: OFL, commercial use without attribution, no standalone sale.
- Kenney 50 RPG SFX + 51 UI SFX: CC0 on OGA.

## Unresolved Questions
- Exact game-icons.net icon count and current license text: not verified. Check https://game-icons.net before quoting a number.
- Cinzel: not confirmed in search. Check Google Fonts directly before choosing it.
- Kenney RPG UI Pack count and exact license text on kenney.nl: check each pack page.
- Is `@fontsource/medievalsharp` published? Verify with `npm view @fontsource/medievalsharp`.
- Need richer full-color RPG illustrations or character sprites? Not covered by these 5 searches; a follow-up search on itch.io free CC0 fantasy packs (e.g., "itch.io CC0 fantasy RPG pack") would close that gap.
- Website aesthetic: pixel vs SVG direction. Not decided here; SVG recommended for current futuristic theme.
