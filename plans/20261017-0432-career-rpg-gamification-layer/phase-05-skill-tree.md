# Phase 05: Skill Tree

## Context Links
- Parent: [plan.md](plan.md) · Depends on: [phase-02](phase-02-content-schema-extensions.md) (data), [phase-01](phase-01-rules-config-scoring-utils-unit-tests.md) (`buildSkillTree`, `skillNodeLevel`) · Parallel with: 03, 04, 06
- Docs: `docs/code-standards.md` (lists, decorative glyphs), https://www.w3.org/WAI/ARIA/apg/patterns/treeview/ (why NOT to use role=tree)

## Overview
- Date: 2026-10-17 · Priority: P1 · Effort: M · Implementation: Not started · Review: Not reviewed
- Replace skills grid with evidence-driven skill tree in existing `#skills` section: roots as glass cards, nested `<ul>` children, node level pips (0 locked..3), CSS connectors `aria-hidden`.

## Key Insights
- `role="tree"` demands roving-tabindex keyboard model + JS => overkill. Plain nested `<ul>`/`<li>` gives hierarchy to SR ("list, 4 items, level 2") without JS.
- Connectors via CSS pseudo-elements (`::before` border lines) => no DOM, automatically decorative. If SVG used, `aria-hidden="true" focusable="false"`.
- Level from evidence only (phase 01 roll-up); level must be in text ("Level 2 of 3" visually-hidden + pips aria-hidden), not color-only.
- Keep section id `skills` + `#skills-title` (nav, `responsive-layout.spec.ts`).
- Recursion: Astro `Astro.self` in `skill-tree-node.astro`; depth expected 2, works for N.

## Requirements
- Functional: every node shows label + level; locked (0) nodes dimmed but readable (AA); evidence links per node optional (`<details>` "Evidence (n)" when n > 0); quest-linked nodes list linked quest titles linking to detail pages.
- Non-functional: no JS; 360px no h-scroll; files <200 lines; reuse `GlassCard`, `.eyebrow`, chip tokens.

## Architecture
```
skills-section.astro (loadCareerState().skillTree: SkillTreeNode[] roots)
 └─ ul.skill-tree-roots (grid, role=list)
     └─ GlassCard as="li" data-reveal  (root)
         └─ SkillTreeNode(node)  -> h3 label + LevelPips + ul.skill-branch > li > Astro.self(child)
SkillTreeNode { id, label, attribute, level, evidence[], quests[{id,title}], children[] }
```
Markup per node:
```astro
<span class="skill-node-label">{node.label}</span>
<span class="visually-hidden">, level {node.level} of {max}</span>
<span class="skill-pips" aria-hidden="true">{[1,2,3].map(i => <i class:list={['pip', i <= node.level && 'pip--on']} />)}</span>
{node.children.length > 0 && <ul class="skill-branch" role="list" aria-label={`${node.label} sub-skills`}>...</ul>}
```
Connector CSS: `.skill-branch > li { position: relative; padding-left: var(--space-5) } .skill-branch > li::before { content: ''; position: absolute; left: 0; top: 0.8em; inline-size: var(--space-4); border-top: 1px solid var(--color-border-glow) }` + vertical `border-left` on `.skill-branch`.

## Related Code Files
Create:
- `/home/user/portfolio-app/src/components/career-rpg/skill-tree-node.astro` (recursive)
Modify:
- `/home/user/portfolio-app/src/components/sections/skills-section.astro`: render tree (replace phase-02 interim grouping); title stays "Tools of the trade" or "Skill tree" (copy choice)
- `/home/user/portfolio-app/src/styles/global-styles.css`: confirm `.visually-hidden` exists (used by header) – reuse, no new utility

## Implementation Steps
1. Confirm `buildSkillTree` output shape includes `level`, `quests`, sorted children (data order).
2. `skill-tree-node.astro` with `Astro.self`; pips decorative; level text visually hidden.
3. Evidence `<details>` per node when evidence exists: external links `target="_blank" rel="noopener noreferrer"`, label = hostname + path.
4. Linked quests: internal `withBasePath('/projects/<id>/')`.
5. Locked styling: `color: var(--color-text-muted)`; never lower opacity below AA.
6. Skills section uses tree; keep `data-reveal` on root cards only (avoid dozens of reveal targets).
7. Build; check 360px, no-JS.

## Todo List
- [ ] skill-tree-node.astro (recursive)
- [ ] skills-section.astro tree render
- [ ] evidence details + quest links
- [ ] locked/unlocked styles AA
- [ ] build + 360px + no-JS check

## Success Criteria
- DOM: roots `li` contain nested `ul` with child `li`s; connectors not in a11y tree.
- Every node exposes "level N of 3" to SR; visual pips match.
- Section renders identically with JS disabled.

## Risk Assessment
- Too many `<details>` = noisy => render only for nodes with evidence.
- Deep trees overflow at 360px => indent via `--space-4` max, wrap labels.
- `Astro.self` recursion typing in Astro 7 => verify; fallback 2-level explicit render.

## Security Considerations
- Evidence URLs https-only (schema); displayed hostnames escaped by Astro.

## Next Steps
- Phase 08: skill-tree e2e + axe; phase 09 documents node schema.
