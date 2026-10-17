# Plan: RPG theme redesign (8x8 pixel icons)

Created: 2026-10-17 · Status: **Implemented, docs done, user approval received for commit (still uncommitted on branch `feat/rpg-theme-redesign` until commit step)** · Synthesis: [reports/01-synthesis-report.md](reports/01-synthesis-report.md) · Scout: [scout/scout-01-theme-surface-report.md](scout/scout-01-theme-surface-report.md) · Research: [01](research/researcher-01-pixel-icons-and-frames-report.md), [02](research/researcher-02-theme-fonts-sfx-report.md), [assets](../reports/261017-rpg-theme-assets.md) · Tests: [02](reports/02-tester-report.md) · Review: [03](reports/03-code-review-report.md)

## Goal
Reskin futuristic neon site to RPG look: dark "dungeon" + light "parchment" themes (toggle, follows system), MedievalSharp headings, Pixelify Sans HUD labels, hand-authored 8x8 pixel icons (inline SVG), pixel-cornered panels/buttons. Career RPG scoring untouched (restyle only). Credits page.
Scope (2026-10-17): core 01-06, 08-A, 09. **07 SFX deferred. 08-B external packs skipped (network-blocked).**

## Constraint
**No git commits/pushes until user approves.** Branch `feat/rpg-theme-redesign` (uncommitted). Each phase ends with `npm run check`, `npm run test:unit`, `npm run test:e2e` green.

## Key Decisions
- Tokens: semantic rename (`accent-cyan`→`accent-primary` gold, `magenta`→`accent-secondary` crimson, + `accent-arcane`); every color = `light-dark(light, dark)` driven by `color-scheme`
- Theme: inline head script sets `data-theme` before paint; `localStorage` (try/catch); copied to `newDocument` in `astro:before-swap`, re-applied `after-swap`; `theme-color` updated. Follows system by default; no JS → system via CSS, toggle hidden
- Deviation (01): click handled by delegated listener in `theme-head-script`; no `scripts/theme-toggle.ts`. Works when bundle fails
- Icons: own 8x8 grids in TS (`as const` → `PixelIconName`) → `pixel-icon.astro` inline SVG, `crispEdges`, `currentColor`, sizes 16/24/32/48. 22 icons (sound on/off dropped with SFX). No downloads
- Frames: pure CSS 4-side `box-shadow` pixel border, radius 0, no `backdrop-filter`/`clip-path` on panels. Keep `GlassCard`/`NeonButton` names
- Fonts: + MedievalSharp (h1/h2, >=32px, preloaded; small h2s → `.h2-compact` body face) + Pixelify Sans Variable (labels >=14px); **JetBrains Mono dropped** (`code` → system mono). Space Grotesk body
- SFX (deferred): Web Audio oscillator bleeps, lazy module after opt-in, muted default
- Credits `/credits/`: fonts OFL, libs, own icon gallery
- Visible text asserted by e2e kept verbatim (`Return to base`, badge/XP/streak/level text). Icons carry no text nodes

## Phases

| # | Phase | Priority | Effort | Status |
|---|---|---|---|---|
| 01 | [Tokens + theme infrastructure + toggle](phase-01-tokens-and-theme-infrastructure.md) | P0 | M (5h) | Done |
| 02 | [Typography + fonts](phase-02-typography-and-fonts.md) | P0 | S (3h) | Done |
| 03 | [Pixel icon system (data, component, unit tests)](phase-03-pixel-icon-system.md) | P0 | M (4h) | Done |
| 04 | [Surfaces + core components](phase-04-surfaces-and-core-components.md) | P0 | L (6h) | Done |
| 05 | [Career RPG components restyle](phase-05-career-rpg-components-restyle.md) | P0 | M (4h) | Done |
| 06 | [Motion adaptation](phase-06-motion-adaptation.md) | P2 | S (2h) | Done (taste capture open, Q11) |
| 07 | [Opt-in chiptune SFX (optional)](phase-07-opt-in-chiptune-sfx.md) | P2 | M (4h) | Deferred (user) |
| 08 | [Credits page + optional external pixel packs](phase-08-credits-page-and-optional-pixel-packs.md) | P1 | S (2h, +2h B) | A done; B skipped (network) |
| 09 | [Verification, a11y/perf audit, docs, changelog](phase-09-verification-docs-changelog.md) | P0 | M (4h) | Done (docs + approval; manual no-JS/zoom captures not recorded) |

Progress: 01-06, 08-A, 09 done. Tests: check 0 errors, unit 116/116, e2e 86/86. Docs/README/package description updated (review M2 resolved); user approval received. Open: per-phase commits.

## Dependencies
```
03 ──────────┬─────────────────────┐
01 → 02 → 04 → 05 → 06 ────────────┼→ 09
 (01 toggle icons need 03) └→ 07 ──┤
      02 → 08 ─────────────────────┘
```
- 03 has no deps; start with 01 in parallel (03 = new files only). 01 last step (toggle icons) waits for 03.
- After 04: 05, 07 parallel (disjoint: 05 = `career-rpg/*`, `project-card`, character/skills; 07 = `sfx-*`, `header-controls`). 06 after 05. 07 attr edits after 06.
- 08 after 02 and 01; parallel with 04-07 (owns `site-footer`, `credits.astro`, `credits-data.ts`, `test-helpers.ts`).
- Rollback: whole redesign on branch; per phase `git restore`/`git stash`. Non-additive: token rename, `.mono`→`.hud-text`, JetBrains removal.

## Definition of Done
- check + unit + e2e green [met: 0 err, 116/116, 86/86]
- axe 0 serious/critical both themes [met]; 360px no h-scroll both themes [partial: no screenshots recorded]
- Lighthouse mobile >=98 perf, 100 a11y/BP/SEO, CLS 0 (home, project, speedrun, changelog, credits) [met mobile; dark+light only home+credits]
- No-JS + reduced-motion: content visible, system theme, toggles hidden [partial: theme-toggle.spec (f); manual pass not recorded]
- Files <200 lines, kebab-case, tokens only (favicon = literal exception, see Q15) [met, max 198]; docs + changelog [met; M2 resolved]

## Unresolved Questions
1. ~~System light → parchment (planned) or force dark?~~ **Resolved: follow system (light = parchment).**
2. 2-state toggle (planned) or 3-state incl. "follow system" reset? **Open.** User chose 2-state 2026-10-17; confirm to close.
3. ~~MedievalSharp vs Cinzel Variable?~~ **Resolved: MedievalSharp.**
4. ~~Drop JetBrains Mono?~~ **Resolved: dropped; `code` → system mono.**
5. Keep names `GlassCard`/`NeonButton`/`.glass`/`.neon-text` or rename? (review L6: names now mismatch)
6. Recolor project cover SVGs + OG image to RPG palette or leave neon? (still cyan/magenta)
7. ~~Build SFX now or defer?~~ **Resolved: deferred (07 not built).**
8. ~~External CC0 packs (08-B) wanted?~~ **Resolved: skipped (network-blocked; own icons only).**
9. 404 CTA: keep "Return to base" (e2e) or "Return to town" + test update?
10. Spotlight: keep recolored gold (planned) or drop for flatter look?
11. Stepped 8-bit easing on hero title (06): taste call. Capture not recorded.
12. Pixel font >=14px widens badges/chips; acceptable?
13. `light-dark()` floor OK? Older browsers get dark-only fallback block.
14. Branch from `master` or `research/rpg-theme-assets`?
15. Amend "favicon only literal colors" rule: `theme-head-script` + test hold hex pre-CSS (review L3)?
