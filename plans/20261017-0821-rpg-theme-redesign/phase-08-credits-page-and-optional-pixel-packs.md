# Phase 08: Credits page + optional external pixel packs

## Context Links
- Parent: [plan.md](plan.md) · Depends on: [01](phase-01-tokens-and-theme-infrastructure.md) (axe spec shape), [02](phase-02-typography-and-fonts.md) (font list + authors), [03](phase-03-pixel-icon-system.md) (gallery) · Parallel with: 04-07
- Research: [assets report](../reports/261017-rpg-theme-assets.md) (licenses, pitfalls), [researcher-01 §2.2 Astro assets](research/researcher-01-pixel-icons-and-frames-report.md)
- Docs: `docs/code-standards.md` (content in data files, `withBasePath`, "add a spec when adding a page")

## Overview
- Date: 2026-10-17 · Priority: P1 (A) / P3 optional (B) · Effort: S 2h (A) + 2h (B) · Implementation: A Done; B Skipped (network-blocked, user decision) · Review: Done ([03 report](reports/03-code-review-report.md): M5 fixed)
- **A**: `/credits/` page: fonts (OFL), libraries (Astro, GSAP), own pixel icons (gallery), sounds (own synth, if 07), linked from footer. **B (optional, gated)**: pipeline to add downloaded CC0 8x8 packs if own icons leave a gap.

## Key Insights
- Even with all-own art, OFL fonts merit credit (courtesy + license notice); credits page doubles as icon gallery = visual QA surface for 03 art.
- Content lives in data → `src/data/credits-data.ts`; page only renders.
- New page ⇒ new spec (code-standards) + add to axe/responsive lists; footer link auto-covered by `internal-links.spec` base-path guard.
- B blocked today: opengameart.org / itch.io 403 (network policy). Needs user to allowlist `opengameart.org`, `itch.io`, `*.itch.zone` in environment network settings, or download manually and drop files in repo.
- Pixel PNGs must bypass `astro:assets` `<Image>` (sharp resample + webp = blur/artifacts) → `import url from './x.png?url'` + plain `<img>` + `image-rendering: crisp-edges; image-rendering: pixelated`.

## Requirements
- A functional: `/credits/` (h1 "Credits"), sections Fonts / Icons / Sound / Libraries; each entry name, author, license name + link; footer "Credits" link on every page; icon gallery = all `PixelIconName`s at 32px with visible names (icons `aria-hidden`, name is text).
- A non-functional: AA both themes, 360px, base path, `noindex` not needed (public).
- B functional: each pack under `src/assets/pixel8/<pack-slug>/` with `LICENSE.txt` copy; `src/assets/pixel8/LICENSES.md` index; credited on `/credits/` from data.
- B non-functional: only CC0 (or CC BY with per-asset credit); untrusted archive handling.

## Architecture
```
src/data/credits-data.ts  creditGroups: { id, title, entries: { name, author, license, licenseUrl, url?, note? }[] }[]
src/pages/credits.astro   BaseLayout + SectionHeading-like h2s + GlassCard lists + IconGallery
src/components/pixel-icon-gallery.astro   Object.keys(pixelIcons) → <li><PixelIcon size={32}/> <code>{name}</code></li>
site-footer.astro         + <a href={withBasePath('/credits/')}>Credits</a>
```
Initial data (verify author/copyright from `node_modules/*/LICENSE` in step 1):
- Fonts: Space Grotesk (OFL-1.1), MedievalSharp (OFL-1.1), Pixelify Sans (OFL-1.1) — via Fontsource
- Libraries: Astro (MIT), GSAP (license per `node_modules/gsap` LICENSE / package.json — verify)
- Icons: "24 pixel icons, 8x8, hand-drawn for this site" (own work)
- Sound: "Synthesized in the browser with the Web Audio API" (own; only if 07 shipped)

## Related Code Files
Create (A):
- `/home/user/portfolio-app/src/data/credits-data.ts`
- `/home/user/portfolio-app/src/pages/credits.astro`
- `/home/user/portfolio-app/src/components/pixel-icon-gallery.astro`
- `/home/user/portfolio-app/tests/e2e/credits-page.spec.ts`
Modify (A):
- `/home/user/portfolio-app/src/components/site-footer.astro`: Credits link
- `/home/user/portfolio-app/tests/e2e/test-helpers.ts`: `export const INFO_PAGES = ['./credits/'] as const;`
- `/home/user/portfolio-app/tests/e2e/accessibility-axe.spec.ts`: add credits entry (both themes via 01 loop)
- `/home/user/portfolio-app/tests/e2e/responsive-layout.spec.ts`: include `...INFO_PAGES`
Create (B, only if approved): `/home/user/portfolio-app/src/assets/pixel8/<pack>/...`, `/home/user/portfolio-app/src/assets/pixel8/LICENSES.md`

## Implementation Steps
A:
1. Read `LICENSE`/`package.json` of each font + astro + gsap in `node_modules`; record exact author/license strings.
2. `credits-data.ts` typed array (no literals in page).
3. `credits.astro`: `<BaseLayout title={`Credits | ${siteConfig.name}`}>`, h1 "Credits", one `<section aria-labelledby>` per group, external links `target="_blank" rel="noopener noreferrer"` + visually-hidden "(opens in new tab)" (pattern from skill-tree-node).
4. `pixel-icon-gallery.astro`: `<ul role="list" aria-label="Pixel icon set">` grid `auto-fill minmax(min(100%, 8rem), 1fr)`.
5. Footer link (`withBasePath`), keep existing text.
6. Specs: `credits-page.spec.ts` (h1, groups present, every external link safe rel, gallery count == `Object.keys(pixelIcons).length` via import, footer link on home/project/speedrun navigates); add to axe + responsive lists.
B (stop and ask user before starting):
7. User allowlists hosts or downloads manually. Candidates: syvalia 8x8 mini pack, OGA "8x8 RPG/Rogue tileset" (Angel), Chasersgaming RPG Assets GB — confirm CC0 on each source page.
8. Each archive → new empty dir in scratchpad; list contents; never run bundled scripts/html; verify license text inside archive matches page.
9. Copy only needed PNGs (native 8x8 or sheet) → `src/assets/pixel8/<pack>/`, copy license → `LICENSE.txt`, add row to `LICENSES.md` + `credits-data.ts`.
10. Use: `import potion from '../assets/pixel8/<pack>/potion.png?url'` → `<img src={potion} width="32" height="32" alt="" class="pixel-img">`; `.pixel-img { image-rendering: crisp-edges; image-rendering: pixelated; }`. Never `<Image>`.
11. If no download possible: fallback = own icons (already shipped) — B simply skipped.

## Todo List
- [x] license facts from node_modules
- [x] credits-data.ts
- [x] credits.astro + icon gallery
- [x] footer link
- [x] credits spec + axe/responsive lists
- [ ] (B, gated) allowlist/manual download, vet, import, credit — SKIPPED (network-blocked)

## Success Criteria
- `/credits/` passes axe both themes, 360px, internal-links; footer link on every page
- Every third-party asset in repo appears on `/credits/` with license link (B: `LICENSES.md` row per pack)

## Risk Assessment
- Wrong author/license string → step 1 reads from package files, not memory.
- GSAP license wording changed across versions → quote what installed package states.
- B: mixed-license packs → per-file audit; any non-CC0/CC-BY file excluded.

## Security Considerations
- Downloaded archives untrusted: isolated dir, no execution, only PNG + license text copied, SVGs (if any) inspected for scripts before use.
- External credit links rel-safe.

## Next Steps
- 09 docs: README "Edit content" row for credits data + pixel icons.
