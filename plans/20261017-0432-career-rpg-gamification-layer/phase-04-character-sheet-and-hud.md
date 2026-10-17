# Phase 04: Character Sheet + HUD Completeness

## Context Links
- Parent: [plan.md](plan.md) · Depends on: [phase-02](phase-02-content-schema-extensions.md) · Parallel with: 03, 05, 06
- Docs: `docs/design-guidelines.md`, `docs/code-standards.md` (section pattern), https://developer.mozilla.org/docs/Web/HTML/Element/progress

## Overview
- Date: 2026-10-17 · Priority: P0 · Effort: M · Implementation: Not started · Review: Not reviewed
- New home section `#character` (after About): level, title, total XP + bar to next level, attribute bars, streak badge (link `/changelog/`), HUD completeness bar + missing items.

## Key Insights
- `<progress>` = native progressbar role; accessible name via `<label for>`; value text visible next to bar (not color-only).
- `<meter>` semantically fits gauges but styling is pseudo-element heavy; one primitive (`<progress>`) for all bars = DRY.
- HUD is owner-facing but public; missing list in `<details>` (collapsed by default, works without JS). Visibility question open (plan.md Q1).
- CLS 0: bars are fixed-height block elements rendered at build; no client JS.
- No animation on bars (static, avoids reduced-motion branch); section uses existing `data-reveal`.

## Requirements
- Functional: shows `Level N · <title>`, `<total> XP`, progress to next level ("X / Y XP"), one bar per attribute (value / attributeCap), streak "N-week streak" + longest, HUD "Profile completeness NN%" + `<details>` "N items missing" list.
- Non-functional: AA contrast; 360px no h-scroll; section id `character` + `aria-labelledby`; files <200 lines.

## Architecture
```
index.astro: Hero > About(1) > CharacterSheet(2) > Skills(3) > Projects(4) > Experience(5) > Contact(6)
character-sheet-section.astro  (loadCareerState once)
 ├─ level header: <p class="eyebrow">Level {n}</p><h3>{title}</h3>
 ├─ XpProgressBar(id, label "XP to level {n+1}", value, max, valueText)
 ├─ <ul role="list" aria-label="Attributes"> li > XpProgressBar per attribute
 ├─ StreakBadge(streak) -> <a href={withBasePath('/changelog/')}>
 └─ CompletenessHud(completeness) -> XpProgressBar + <details><summary>N items missing</summary><ul>...</ul></details>
```
`xp-progress-bar.astro` (shared primitive):
```astro
<div class="xp-bar">
  <label for={id} class="mono">{label}</label>
  <progress id={id} max={max} value={value} aria-valuetext={valueText}>{valueText}</progress>
  <span class="xp-bar-value mono" aria-hidden="true">{valueText}</span>
</div>
<style>
  progress { appearance: none; inline-size: 100%; block-size: 0.5rem; border: 0; border-radius: var(--radius-pill); background: var(--color-surface-glass); }
  progress::-webkit-progress-bar { background: var(--color-surface-glass); border-radius: inherit; }
  progress::-webkit-progress-value { background: linear-gradient(90deg, var(--color-accent-cyan), var(--color-accent-magenta)); border-radius: inherit; }
  progress::-moz-progress-bar { background: var(--color-accent-cyan); border-radius: inherit; }
</style>
```
New tokens (if needed): `--bar-height: 0.5rem` in `design-tokens.css`.

## Related Code Files
Create:
- `/home/user/portfolio-app/src/components/sections/character-sheet-section.astro`
- `/home/user/portfolio-app/src/components/career-rpg/xp-progress-bar.astro`
- `/home/user/portfolio-app/src/components/career-rpg/completeness-hud.astro`
- `/home/user/portfolio-app/src/components/career-rpg/streak-badge.astro`
Modify:
- `/home/user/portfolio-app/src/pages/index.astro`: insert section after About
- `/home/user/portfolio-app/src/components/sections/{skills,projects,experience,contact}-section.astro`: `SectionHeading index` +1 (2->3, 3->4, 4->5, 5->6)
- `/home/user/portfolio-app/src/styles/design-tokens.css`: `--bar-height` (optional)

## Implementation Steps
1. `xp-progress-bar.astro` (props `id,label,value,max,valueText`); unique ids per page (`xp-next-level`, `attr-<id>`, `hud-completeness`).
2. `streak-badge.astro`: text "{current}-week streak · best {longest}"; current 0 => "Streak paused · last entry <date>"; link to changelog.
3. `completeness-hud.astro`: heading h3 "Profile HUD"; bar; `<details>` only when missing > 0, else "All checks passed".
4. `character-sheet-section.astro`: two-column grid >=56rem (identity+XP | attributes), glass cards via `GlassCard`, `data-reveal` on cards. Title copy from `CareerState`, labels from `xpRules.attributes`.
5. Insert in `index.astro`; renumber headings.
6. Build; verify placeholder state: level/title deterministic for fixed content; HUD < 100% with list (email, placeholders, cli-toolkit body, ...).
7. Lighthouse spot check home (CLS 0).

## Todo List
- [ ] xp-progress-bar.astro
- [ ] streak-badge.astro
- [ ] completeness-hud.astro
- [ ] character-sheet-section.astro
- [ ] index.astro + heading renumber
- [ ] build + visual + Lighthouse spot check

## Success Criteria
- Every `<progress>` has accessible name (axe `aria-progressbar-name` / label rules pass).
- Values match `CareerState` (no hardcoded numbers in components).
- Content visible no-JS + reduced motion; CLS 0.

## Risk Assessment
- Gradient progress value unsupported in Firefox pseudo => solid cyan fallback (cosmetic).
- Section adds height => existing scroll specs (`scroll-position.spec.ts`) use hash anchors, should hold; rerun.
- Heading renumber missed => cosmetic only; grep `index={`.

## Security Considerations
- Static render only; missing-items list shows labels, never file paths/emails beyond config.

## Next Steps
- Phase 07 reuses level/title + `xp-progress-bar`; phase 08 adds character/HUD e2e.
