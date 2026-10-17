# Phase 03: Quests & Boss Battle UI

## Context Links
- Parent: [plan.md](plan.md) · Depends on: [phase-02](phase-02-content-schema-extensions.md) · Parallel with: 04, 05, 06
- Docs: `docs/design-guidelines.md` (Components, Color contrast), `docs/code-standards.md` (Accessibility rules)

## Overview
- Date: 2026-10-17 · Priority: P0 · Effort: M · Implementation: Not started · Review: Not reviewed
- Quest-tier badge on project cards, boss card highlighted on home (first, wide), Quest Log + Boss Battle panel on detail page (obstacles, metrics as "loot", evidence links, XP earned / unverified reason).

## Key Insights
- `tag-chip.astro` renders `<li>` => badge needs own tiny component (span), same pill styling tokens.
- Boss first: extend `sortProjects` (boss > featured > order > title); same order used by scoring (phase 01) => consistent.
- Metrics are numbers => render via `<dl>` (label/value pairs) for SR clarity; never color-only tier meaning (text label always).
- Show XP per quest from `CareerState` (computed), not frontmatter.

## Requirements
- Functional: badge text "Side quest" / "Main quest" / "Raid" + "Boss" variant; boss card spans 2 grid cols >=900px; detail page panel lists obstacles, metrics, evidence (type-labelled external links), XP earned or "Unverified: <reason>".
- Non-functional: reuse `.glass`, tokens; AA contrast; no layout shift; works without JS; files <200 lines.

## Architecture
```
projects-section.astro --loadCareerState()--> ProjectCard(project, quest)  -> QuestTierBadge
[slug].astro           --loadCareerState()--> BossBattlePanel(quest)  (heading "Boss Battle" if isBoss else "Quest Log")
```
- `QuestTierBadge` props: `difficulty`, `isBoss`. Classes `.quest-badge--side|main|raid|boss`: side muted border; main cyan border; raid magenta border; boss magenta fill + `--color-text-on-accent`.
- Boss card: `.project-card[data-boss]` => `grid-column: span 2` in `@media (min-width: 56rem)`, magenta `--shadow-glow-magenta` border. Static CSS => CLS 0.
- Panel uses `GlassCard as="article"`? No: `<section aria-labelledby>` inside detail `<article>` wrapping `GlassCard` (div) to keep one article landmark.

## Related Code Files
Create:
- `/home/user/portfolio-app/src/components/career-rpg/quest-tier-badge.astro`
- `/home/user/portfolio-app/src/components/career-rpg/boss-battle-panel.astro` (obstacles list, metrics `<dl>`, evidence links, XP line)
Modify:
- `/home/user/portfolio-app/src/utils/sort-projects.ts`: `SortableProject.data.isBoss`; boss first
- `/home/user/portfolio-app/tests/unit/sort-projects.test.ts` (create): boss > featured > order > title
- `/home/user/portfolio-app/src/components/project-card.astro`: badge above title, `data-boss` attr, optional prop `questXp`
- `/home/user/portfolio-app/src/components/sections/projects-section.astro`: load state, pass quest score per card, boss grid span CSS
- `/home/user/portfolio-app/src/pages/projects/[slug].astro`: insert `BossBattlePanel` after header (file at 125 lines; keep <200 by keeping panel styles in component)

## Implementation Steps
1. Update `sort-projects.ts` (+ unit test). Note: `sortProjects` stays pure (no `.ts` imports needed).
2. `quest-tier-badge.astro`: `<span class="quest-badge quest-badge--{tier}">{label}</span>`; boss renders text "Boss · Raid" (text only, no icon font/glyph).
3. Card: badge row above `h3`; `data-boss={isBoss ? '' : undefined}`; keep `data-spotlight data-reveal`.
4. Projects section: `const state = await loadCareerState();` map `quest = state.quests[id]`; CSS `.project-card[data-boss]` span 2.
5. `boss-battle-panel.astro`: props `quest: QuestScore` (`difficulty,isBoss,obstacles,metrics,evidence,xp,verified,reason`). Heading h2 "Boss Battle" / "Quest Log" (h1 is project title). Obstacles `<ul role="list" aria-label="Obstacles">`; metrics `<dl>`; evidence links `NeonButton external` or plain links with "(opens in new tab)" aria-label pattern from `project-card.astro`.
6. `[slug].astro`: render panel. Keep header repo/demo buttons (recruiter-friendly, via `getEvidenceLink`); panel lists full evidence (figma/article/other too).
7. Contrast check boss badge (cyan/magenta fill + `#05070d` text) in axe run.
8. `npm run check && npm run build`; eyeball `/`, `/projects/neon-dashboard/`, `/projects/cli-toolkit/` (unverified state).

## Todo List
- [ ] sort-projects boss-first + unit test
- [ ] quest-tier-badge.astro
- [ ] project-card badge + data-boss
- [ ] projects-section boss span
- [ ] boss-battle-panel.astro
- [ ] [slug].astro integration
- [ ] build + visual check

## Success Criteria
- Each card shows exactly one tier badge; boss card first + wide on desktop, normal width at 360px (no h-scroll).
- Boss detail page has "Boss Battle" h2 with obstacles + metrics; non-boss shows "Quest Log".
- `cli-toolkit` shows "Unverified" reason (body too short / no new evidence) with 0 XP.

## Risk Assessment
- 2-col span leaves gap with 3 cards (2+1 layout) => acceptable; `grid-auto-flow: dense` if ugly.
- `[slug].astro` grows past 200 => keep markup in panel component.
- `transition:name` on cards unaffected; verify view transition still works (lifecycle spec).

## Security Considerations
- Evidence hrefs already https-validated (phase 02); `target="_blank"` + `rel="noopener noreferrer"`.

## Next Steps
- Phase 07 consumes boss/featured quest metrics for achievements; phase 08 updates card/detail e2e.
