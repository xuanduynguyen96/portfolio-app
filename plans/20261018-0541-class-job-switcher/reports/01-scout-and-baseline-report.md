# 01 Scout + baseline report (class/job switcher)

Date 2026-10-18. Measured from repo HEAD (v1.3, `92ac11a`) in a scratch copy (`npm ci`, `astro build`), nothing in the repo changed. Re-run: `node --disable-warning=ExperimentalWarning plans/20261018-0541-class-job-switcher/reports/assets/measure-variant-sizes.ts`.

## Code facts (verified)

| Claim | Evidence |
|-------|----------|
| 4 classes: warrior, mage, archer, adventurer | `CLASS_IDS` in `src/data/character-job-rules.ts` |
| Job = `JOBS[CombatClassId][ArchetypeId]` -> 9 jobs; job identity is the motif (backend/data/frontend) | `JOBS`; `classify-character.ts` L48-60 (`motif = secondary ?? primary`) |
| Adventurer has NO job and NO motif | `classify-character.ts` L39 (`jobId: null, jobName: null, motif: null`); gallery shows 1 Adventurer look. Pose file has a `motif` anchor but production never uses it. `avatar-test-helpers.ts` `LOOK_KEYS` includes adventurer x motif (invalid in production; test-only) |
| => valid looks = 3 classes x 3 motifs + Adventurer = **10** | `avatar-gallery.astro` builds the same 10 |
| Gear tiers (armor/shield/boots/amulet) are independent of class/job | `AvatarProfile.gear`; `selectAvatarLayers(look, frame)` |
| Owner now: Warrior · Vanguard (frontend motif), gear armor 0, shield 1, boots 2, amulet 0 | `classifyCharacter(snapshot)` |
| Avatar is build-time inline SVG, no JS; hero `animate` (both frames), sheet static (frame A only) | `character-avatar.astro`, `avatar-svg-markup.ts` |
| Display title builder is single-sourced | `characterTitle()` in `github-character/character-title.ts` |
| SVG ids: `<title id=hero-avatar-title>`, `<desc id=...-desc>`; swapping children keeps ids and the box (CLS 0) | `avatarSvgMarkup` |
| Frame loop is CSS-only: `html[data-motion=ok]` + `prefers-reduced-motion: no-preference` + `[data-animate]`; new `<g>` elements restart it | `character-avatar.astro` styles |
| Nameplate DOM: `.nameplate > p.nameplate-class > span + span.nameplate-job`; e2e asserts `.hero .nameplate-class` `toHaveText(title)` (uses textContent: hidden badge text inside it would break it) | `character-nameplate.astro`, `character-avatar.spec.ts` |
| Hero avatar width is CSS (`--hero-avatar-px` 4/8), SVG attr 288 (256 art) ; sheet 216 | hero-section.astro; `AVATAR_VIEWBOX` 36 |
| Client JS today: `base-layout` chunk (GSAP + animations + mobile menu), `ClientRouter`, inline theme + root-flag scripts; `speedrun-countdown.ts` is inlined by Astro (small script) | `dist/`, `base-layout.astro` |
| Lifecycle pattern: bind on `astro:page-load`, cleanup on `astro:before-swap`; module scripts run once, DOM is replaced | `init-animations.ts`, `mobile-menu.ts`, `speedrun-countdown.ts`; `page-navigation-lifecycle.spec.ts` |
| No CSP anywhere (GitHub Pages, no headers, no meta) | grep `src`, `public`, `astro.config.mjs` |
| Sprite/composer modules are pure TS with `.ts` imports; esbuild bundles them for the browser unchanged | bundle test below |

## Baseline (v1.3 build)

| Item | Raw | Gzip -9 |
|------|-----|---------|
| `dist/index.html` | 111,740 B | 13,452 B |
| of which avatars: hero (animated, 256) / sheet (static, 192) | 8,321 / 4,750 B | ~1.85 KB together |
| `dist/speedrun/index.html` | 24,826 B | 6,623 B |
| `_astro/base-layout...js` (GSAP, animations, menu) | 121,648 B | 47,374 B |
| `_astro/ClientRouter...js` | 16,365 B | 5,655 B |
| Docs budget: home HTML gzip growth from the avatar | | +3.4 KB used of 6 KB |

## Variant payloads (10 looks, owner's gear)

Per look: static SVG 3.7-5.1 KB raw (1.2-1.4 KB gz); animated 6.9-9.7 KB raw (1.6-1.9 KB gz); frames-only (A+B paths) 6.4-9.2 KB raw (1.25-1.5 KB gz); desc 232-285 chars.

| Option | Measured cost | Verdict |
|--------|---------------|---------|
| A. Inline `<template>` per look (all 10) | 86 KB raw; whole-page test: home HTML 111.7 -> 198.9 KB raw, **13,476 -> 21,295 B gz = +7,819 B on every load** (+58%) | Fails the 6 KB HTML budget (3.4 used) |
| B. Per-look static JSON/SVG fetched lazily | ~1.25-1.5 KB gz each; all 10 separately = 14.2 KB gz; needs 10 build outputs + loading/error/race states | Cheap for 1-2 looks, worse than C beyond 3 |
| C. Compose in browser from the same pure modules, lazy `import()` | esbuild min bundle of `avatarFrameGrid`+paths+`avatarDescription` (sprites, composer, rules): **17,235 B raw / 4,104 B gz** (without description 15,540 / 3,344); compose 2 frames **~1.5 ms** warm in Node | Recommended (confirm in phase 00) |

Why C: nothing on first load; one request after first intent covers all 10 looks; no new build artifacts or fetch error states; same code as the build (DRY, no drift). Cost: sprite data reaches the browser (4.1 KB gz, on demand) and the README/docs "zero client JS" statement needs rewording.

## Unknowns for phase 00
- Does Astro/Vite split the dynamic import as its own chunk under `/portfolio-app/_astro/` and keep the stub small? (stub with a dynamic import is probably not inlined)
- Tree-shaking of `character-class-rules.ts` (big rule tables) out of the eager stub.
- Compose time on mobile (4x CPU throttle) and Lighthouse mobile delta (expect none: nothing runs before intent).
