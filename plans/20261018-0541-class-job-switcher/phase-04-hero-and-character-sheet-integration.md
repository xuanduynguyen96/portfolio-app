# Phase 04: Integration: hero + character sheet

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 03 · Blocks: 05
- Inputs: [report 01](reports/01-scout-and-baseline-report.md) (DOM facts), phase 02 hooks (`data-look-avatar`, `data-look-name`, `data-look-class|job`)
- Docs: `docs/design-guidelines.md#character-avatar`, `docs/code-standards.md#component-conventions`

## Overview
- Date: 2026-10-18 · Priority: P0 · Effort: S (3h) · Implementation: Done · Review: covered by full-branch code review (report 03)

## Outcome (as built)
- Hero + sheet tagged `switchable`; control mounted in portrait `.portrait-details`. Default text and SVG boxes (288/216) unchanged.
- HTML gzip 13,452 -> 13,790 B (+338 B, within 2 KB).
- Deviation: switcher styles are `is:global` in `class-job-switcher.astro` (JS-built radios lack Astro scope attrs), so "scoped styles" criterion is not met as written.
- Screenshots: `reports/assets/switcher-*.png`, `hero-*.png` (m360 dark, d1280 light; default + archer/arcane).
- Tag the two real avatars and nameplates as switch targets and mount the control in the character-sheet portrait panel. No badge or preview label: the chosen class/job is simply the displayed one. Default render (no interaction, no JS) must stay byte-for-byte equivalent in text and size to v1.3 so existing e2e/Lighthouse results hold.

## Key Insights
- Targets today: hero `CharacterAvatar size=256 animate` + `CharacterNameplate` (in `figcaption`); sheet `CharacterPortraitPanel` -> `CharacterAvatar size=192` + `CharacterNameplate as="h3"`. `/speedrun/` header and `/credits/` gallery are separate components and are NOT tagged (out of scope; they keep showing the GitHub-derived identity, also after the visitor picks another look (propagation = follow-up; saved key already makes it cheap)).
- `character-avatar.astro` must stay pure markup + CSS: only an attribute is added (`data-look-avatar` on the wrapper `<span class="avatar">`); the script touches `svg > title|desc|g` only.
- Existing e2e asserts `.hero .nameplate-class` `toHaveText(title)` (Playwright reads `textContent`, hidden children included): `.nameplate-class` must contain only the class/job text (no extra children text). Class/job spans get hooks (`data-look-class`, `data-look-job`); a plain space text node sits between them (collapsed whitespace is ignored by `toHaveText`).
- Control location: character sheet (hero at 360x640 must keep the name above the fold; `character-sheet-section.astro` is 153 lines and untouched, the panel is the right owner). The choice then shows in the hero when the visitor scrolls up.
- Gear = f(GitHub stats): legend rows, tiers and the sprite gear layers are unchanged by the choice; the same earned gear is drawn on every class/job pose (anchors per pose already exist). Attributes and the Why panel ("Why Warrior?") keep describing the GitHub-derived class; the control's line "GitHub pick: X" sits next to them. Not changed here (follow-up if confusing, plan Q3).

## Requirements
- Hero + sheet avatars/nameplates change together; default state identical to v1.3 output (same text, same 288/216 px SVG boxes).
- Hero and sheet nameplates/avatars always show the same chosen look.
- Control mounted once, in the portrait panel details column, above the gear legend.
- No change to `index.astro`, `base-layout.astro`, speedrun, credits, data files.

## Architecture
```
hero-section.astro ── CharacterAvatar(256, animate, switchable) + CharacterNameplate(level, switchable)     [targets]
character-portrait-panel.astro ── CharacterAvatar(192, switchable) + CharacterNameplate(as h3, switchable)  [targets]
                               └─ .portrait-details: ClassJobSwitcher(character) → GearLegend → ClassWhyPanel → GithubDataNote
```
```astro
<!-- character-nameplate.astro (switchable) -->
<div class="nameplate" data-look-name={switchable ? '' : undefined}>
  <Tag class="nameplate-class hud-text"><span data-look-class>{character.className}</span>{' '}<span class="nameplate-job" data-look-job hidden={!character.jobName}>{character.jobName ? `· ${character.jobName}` : ''}</span></Tag>
  {level && <p class="nameplate-level hud-text">…</p>}
</div>
```

## Related Code Files
Modify:
- `/home/user/portfolio-app/src/components/avatar/character-avatar.astro` (prop `switchable?: boolean` -> `data-look-avatar`; fix header comment "zero client JS")
- `/home/user/portfolio-app/src/components/career-rpg/character-nameplate.astro` (prop `switchable?`, hooks, caption reserve)
- `/home/user/portfolio-app/src/components/sections/hero-section.astro` (pass `switchable` to avatar + nameplate)
- `/home/user/portfolio-app/src/components/career-rpg/character-portrait-panel.astro` (pass `switchable`, mount `ClassJobSwitcher`)
- `/home/user/portfolio-app/src/utils/avatar/avatar-svg-markup.ts` (comment only: "zero client JS" header)
Read: `src/styles/effects.css`, `tests/e2e/character-avatar.spec.ts`, `character-sheet-and-hud.spec.ts`.

## Implementation Steps
1. Baseline from phase 00 scratch build: `dist/index.html` text + SVG box sizes (hero 288, sheet 216) and gzip 13,452 B.
2. `character-avatar.astro`: add `switchable` prop and the attribute; no markup/CSS change otherwise.
3. `character-nameplate.astro`: hooks (`data-look-class|job`); the job span `hidden` for Adventurer (no job); `text-wrap: balance` and a reserved two-line `min-height` on the hero caption name to absorb the longest name ("Archer · Arcane Archer") without a post-load shift.
4. Hero + portrait panel: pass `switchable`; mount the control in `.portrait-details`.
5. `npm run check`, `npm run test:unit`, `npm run test:e2e` unchanged-green (231 unit + new, 94 e2e).
6. `astro build`: diff `dist/index.html` vs baseline: only the control markup, 2 attributes x 2, one script reference (inline or `_astro` file); gzip growth <= 2 KB.
7. Visual check 360x640 and 1280x800, light/dark, default + a chosen look (e.g. Mage · Sorcerer, Archer · Arcane Archer for longest name), hero layout at 360 with the longest name, screenshots into `reports/assets/`.

## Todo List
- [x] `switchable` prop on avatar + nameplate
- [x] hero + portrait panel wired, control mounted
- [x] default-state parity (text, boxes) confirmed
- [x] HTML gzip growth measured (<= 2 KB; +338 B)
- [x] screenshots 360/1280, light/dark, default + chosen look

## Success Criteria
- Existing 94 e2e + 231 unit pass untouched
- Hero and sheet show the same chosen look simultaneously; default render unchanged
- `/speedrun/` and `/credits/` avatars unaffected after choosing a look and soft-navigating
- No new class names in global CSS; scoped styles; files < 200 lines

## Risk Assessment
- Nameplate edit breaks `toHaveText(title)` -> keep `.nameplate-class` text exactly `Class · Job` (no extra children text); run `character-avatar.spec.ts` first.
- Long names ("Archer · Arcane Archer") rewrap the 360px hero caption: with a restored choice this happens after load (CLS counts) -> reserve the caption height as above; measure in phase 05 with a saved look.
- Reduced hero space on small screens: control lives below the fold in the sheet, so hero height is unchanged.

## Security Considerations
- Only static attributes added; no new external links, no user data rendered.

## Next Steps
- 05 verification. Unresolved: plan Q2/Q3 (hero entry point, Why panel wording).
