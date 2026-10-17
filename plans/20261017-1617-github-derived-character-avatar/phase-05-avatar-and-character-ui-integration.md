# Phase 05: UI integration: hero, character sheet, speedrun, legend, why panel, projects

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 03 (state), 04 (avatar component) · Blocks: 06
- Inputs: [researcher-02 §4](research/researcher-02-report.md), [scout UI consumers](scout/scout-01-report.md)
- Docs: `docs/design-guidelines.md` (tokens, frames, motion), `docs/code-standards.md#accessibility-rules`

## Overview
- Date: 2026-10-17 · Priority: P0 · Effort: L (7h) · Implementation: Not started · Review: Not started
- Avatar is the first thing seen in the hero, repeated on character sheet + `/speedrun/`. Visible nameplate, gear legend, "why this class" panel, GitHub data note. Projects show derived quests. All server-rendered, zero new client JS.

## Key Insights
- "Know instantly" = avatar above the fold on 360px + nameplate text next to it; legend is the text equivalent (WCAG 1.1.1/1.4.1), not decoration.
- Hero h1 stays the LCP text; avatar is not `data-hero` (never pre-hidden), fixed width/height attrs → CLS 0.
- Integer scales only: 128 (speedrun, mobile sheet), 192 (mobile hero, sheet), 256 (desktop hero >= 48rem) via CSS width steps, never fluid.
- `character-sheet-section.astro` (153 lines) and `speedrun.astro` (171) would pass 200 → extract panels.
- Two avatars on home (hero + sheet) ~2x 3 KB raw: within budget; `<symbol>/<use>` only if 06 budget fails.

## Requirements
- Hero: avatar + nameplate ("Warrior · Vanguard" line, "Lv 6 · Journeyman Engineer" line) + link "See character sheet" (`#character`); note "Based on public GitHub activity" (small, muted). Layout: >= 48rem two columns (text left, avatar right); < 48rem avatar 192 above eyebrow, title still visible at 360x640.
- Character sheet: portrait panel (avatar 192, nameplate, gear legend, why panel) + existing level/attributes/HUD/streak.
- Gear legend: `<dl>`: slot icon (decorative) + "Armor" → "Security" → "Tier 1 of 3" + matched repos count; tier 0 text "Starter gear".
- Why panel: `<details>` summary "Why Warrior?" (>=44px); list of signals ("C# in MiniWebServer (+0.32)"); secondary line; Adventurer copy "Not enough public signal yet".
- GitHub note: "Based on public GitHub activity as of {asOf}" + external link to profile (`rel="noopener noreferrer"`).
- `/speedrun/`: avatar 128 + nameplate in header; achievements from derived metrics.
- Projects: card shows description (or "No description yet"), language tags, difficulty badge, XP, "Case study" tag if override; detail page = override body or derived quest log (languages, topics, commits, links). Boss panel uses derived metrics.
- Skills: evidence `<details>` lists matched repos (links).
- StreakBadge: "N-week contribution streak"; links to GitHub profile (external); `/changelog/` copy no longer claims streak.
- Credits: avatar gallery (10 looks at tier 0 + one gear ramp row tiers 0-3) with captions; credits entry.
- OG image from avatar: **optional, deferred** (Q8).

## Architecture
```
hero-section.astro ── CharacterAvatar(size 256/192) + CharacterNameplate + GithubDataNote
character-sheet-section.astro ── CharacterPortraitPanel
                                   ├ CharacterAvatar(192) + CharacterNameplate
                                   ├ GearLegend (dl)
                                   └ ClassWhyPanel (details)
speedrun.astro ── SpeedrunCharacterHeader (avatar 128 + nameplate)
credits.astro ── AvatarGallery
```
```astro
<!-- character-nameplate.astro -->
<p class="nameplate hud-text"><span>{c.className}</span>{c.jobName && <> · <span>{c.jobName}</span></>}</p>
<p class="nameplate-level hud-text">Lv {level.level} · {level.title}</p>
```

## Related Code Files
Create:
- `/home/user/portfolio-app/src/components/career-rpg/character-nameplate.astro`
- `/home/user/portfolio-app/src/components/career-rpg/character-portrait-panel.astro`
- `/home/user/portfolio-app/src/components/career-rpg/gear-legend.astro`
- `/home/user/portfolio-app/src/components/career-rpg/class-why-panel.astro`
- `/home/user/portfolio-app/src/components/career-rpg/github-data-note.astro`
- `/home/user/portfolio-app/src/components/career-rpg/speedrun-character-header.astro`
- `/home/user/portfolio-app/src/components/avatar/avatar-gallery.astro`
- `/home/user/portfolio-app/src/data/pixel-icons-gear.ts` (4 slot icons 8x8: armor, shield, boots, amulet) + map in `pixel-icon-map.ts`
- e2e: `/home/user/portfolio-app/tests/e2e/character-avatar.spec.ts`
Modify:
- `src/components/sections/hero-section.astro`, `character-sheet-section.astro`, `projects-section.astro`, `skills-section.astro`
- `src/components/project-card.astro`, `career-rpg/boss-battle-panel.astro`, `career-rpg/streak-badge.astro`, `career-rpg/skill-tree-node.astro`, `career-rpg/achievement-card.astro` (drop "Sample" when not sample)
- `src/pages/speedrun.astro`, `src/pages/projects/[slug].astro`, `src/pages/changelog.astro`, `src/pages/credits.astro`
- `src/data/pixel-icons.ts`, `src/data/pixel-icon-map.ts`, `src/data/credits-data.ts`
- e2e: `home-page-smoke`, `character-sheet-and-hud`, `speedrun-page`, `quest-cards-and-boss`, `project-detail-and-focus`, `skill-tree`, `changelog-and-streak`, `credits-page`, `pixel-icons`, `accessibility-axe` (pages list), `forced-colors`, `reduced-motion`, `responsive-layout`
- `tests/unit/pixel-icons.test.ts` (gear icons)

## Implementation Steps
1. Gear slot icons (8x8) + map; unit test update.
2. Nameplate, data note, legend, why panel (text from `avatar-description.ts` + `CharacterProfile`; no scoring in components).
3. Portrait panel; slim `character-sheet-section.astro` (<200 lines).
4. Hero layout (CSS grid, tokens only; avatar wrapper `aspect-ratio: 1`); unique `idPrefix` per instance (`hero`, `sheet`, `speedrun`, `gallery-<n>`).
5. Speedrun header extraction; achievements via derived metrics.
6. Projects card/detail/boss text for derived quests; skills evidence lists repos.
7. Streak badge + changelog copy; credits gallery.
8. e2e `character-avatar.spec.ts`: hero avatar `role=img` name = "{Class} · {Job}" from computed state (import pure classifier + snapshot, DRY); nameplate text; 4 legend rows; why `<details>` opens by keyboard; no-JS context still shows avatar; reduced motion → `animation-name: none`; avatar box size stable (no CLS) at 360 and 1280.
9. Update other specs; run check + unit + e2e.

## Todo List
- [ ] gear icons
- [ ] nameplate, legend, why panel, data note
- [ ] portrait panel + sheet refactor
- [ ] hero layout
- [ ] speedrun header
- [ ] projects/skills/streak/changelog/credits updates
- [ ] e2e new + updated specs green

## Success Criteria
- 360x640: avatar + name visible without scroll, no h-scroll, both themes
- Every visual state (class, job, tier) also present as text on the same view
- No new client JS bundle bytes (compare `dist/_astro` sizes before/after)

## Risk Assessment
- Hero crowding on mobile → avatar 192 above eyebrow; fall back to 128 if title pushes below fold.
- e2e brittleness (names change with snapshot) → assertions computed from snapshot via pure modules, never literals.
- Pixel font widens nameplate → `text-wrap: balance`, allow 2 lines.

## Security Considerations
- External links (profile, repos, homepages) https-only, `target="_blank" rel="noopener noreferrer"`; repo text escaped (no `set:html`).

## Next Steps
- 06 verification. Unresolved: OG image regen (Q8); gallery on public `/credits/` OK?
