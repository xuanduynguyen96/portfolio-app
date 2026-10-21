# Plan: distinct job art (9 unique props, per-job accent + motion)

Created: 2026-10-21 · Status: **Planned, not started (plan only; no code, tests or docs touched)** · Target: v1.6 · Inputs: [scout + baseline](reports/01-scout-and-baseline-report.md) · Prior: [class/job switcher](../20261018-0541-class-job-switcher/plan.md), [v1.5 domain classes](../20261020-1801-domain-class-skill-jobs/plan.md) · Rules: `.claude/workflows/development-rules.md` (the brief says `docs/development-rules.md`; that path does not exist)

## Goal
Today job art = 3 shared props (banner/crystal/hawk, 6x11) chosen by job SLOT, so Knight/Ranger/Enchanter all show the same banner. Direction **A+B+C**: (A) one unique prop per job (9), keyed by job id, abstract metaphors, no logos; (B) per-job accent colour on outfit trim and on the prop, identical in both themes; (C) per-job 2-frame motion replacing the shared flutter/bob/flap, same CSS gating (`data-motion=ok`, reduced-motion, loop stops ~4.5 s).
Metaphors: Knight crest shield · Paladin leaf-and-sword · Sentinel watchtower/server rack · Ranger orbiting atom · Skirmisher phone + winged boots · Herald horn/tabard with `</>` · Enchanter rune circle/pipeline · Summoner container crate · Seer floating eye.

## Rejected (and why)
- Full per-job bodies/poses: 3x authoring (9 poses vs 3), lazy chunk blows its budget, breaks identity-box separation (class = silhouette).
- Aura/fx-only: noise at 128 px, no job reads from a glow; `fx` slot stays unused.

## Facts that shape the plan (measured, see report 01)
- Free zone, 1 px gap: Warrior **9x14**, Archer **9x13**, Mage **6x19** (staff squeezes it). "~10x14" only with touching allowed. Today 6x11.
- 16-colour cap: spare slots at gear tier 3 = warrior 5, archer 2, mage 2; accent uses 1.
- Animated raw ceiling 11,264 B: archer max today 10,015 B; noisy worst case 11.6 KB. Gzip ceiling 2,560 B is safe.
- No gear-vs-prop collision test exists today; one is added.

## Phases
| # | Phase | Pri | Effort | Status | Progress | Depends |
|---|---|---|---|---|---|---|
| 00 | [Spike: zones, policy, budgets, go/no-go](phase-00-spike-zones-overlap-policy-byte-budget.md) | P0 | S (3h) | Todo | 0% | - |
| 01 | [Job-keyed data model (no visual change)](phase-01-job-keyed-data-model-refactor.md) | P0 | M (4h) | Todo | 0% | 00 |
| 02 | [Palette, tokens, accent trim, prop geometry tests](phase-02-palette-tokens-accent-trim-and-prop-invariants.md) | P0 | M (5h) | Todo | 0% | 01 |
| 03 | [Art batch A: Warrior (Knight, Paladin, Sentinel)](phase-03-art-batch-warrior-props.md) | P0 | L (5h) | Todo | 0% | 02 |
| 04 | [Art batch B: Archer (Ranger, Skirmisher, Herald)](phase-04-art-batch-archer-props.md) | P0 | L (5h) | Todo | 0% | 02 |
| 05 | [Art batch C: Mage (Enchanter, Summoner, Seer) + uniqueness tests](phase-05-art-batch-mage-props-and-uniqueness.md) | P0 | L (5h) | Todo | 0% | 02 |
| 06 | [Verification: e2e, a11y, CLS/perf, chunk threshold](phase-06-verification-e2e-a11y-perf-chunk-budget.md) | P0 | M (4h) | Todo | 0% | 03-05 |
| 07 | [Docs, changelog, final gate, commit](phase-07-docs-changelog-final-gate.md) | P1 | M (4h) | Todo | 0% | 06 |

Order: 00 -> 01 -> 02 -> (03 || 04 || 05, one writer per file, review gate after each) -> 06 -> 07. About 35h. 03-05 are independent files; run them in order if one dev.

## Key decisions
- Prop key = job id (`JobId`, 9 values); `MotifId`/`MOTIF_IDS`/`JobDefinition.motif`/`PoseAnchors.motif` removed; `CharacterProfile.motif` dropped (`jobId` already exists). Look key `class/job` (`mage/seer`); legacy `mage/hawk` etc. become invalid, saved `portfolio-look` ignored once (same precedent as v1.5). `changeClass` still keeps the job SLOT (index in `JOBS[class]`).
- Each prop carries its own placement (`{x, y, rows}` per frame) and sits inside a per-class zone constant, so a Mage prop can differ in size from a Warrior prop without per-job anchors in pose files.
- Accent = 9 new palette keys `A B C D E F H J M` -> `--avatar-accent-<job>` tokens; applied through a new `trim` layer (z 15, between class and armor) from per-class masks, plus the prop's main hue. Pose rows untouched, Adventurer unaffected.
- Sprite files split per class: `avatar-job-props-{warrior,archer,mage}.ts` (<200 lines each); registry stays in `avatar-sprites.ts`.
- Phase 01 is provably pixel-neutral: `hash-look-grids.ts` digest must stay `f642d3a8...83f7`.
- Props stay lazy: art lives under `src/data/avatar/` (forbidden in the eager graph); `character-job-rules.ts` gets ids only.

## Risks (top)
Mage prop readability at 6 px wide · 16-colour cap on Archer/Mage · Archer animated raw ceiling · lazy chunk +~1 KB gz vs threshold · prop/gear collision on some tier/frame · accent hues too close or vs ring · invalidated saved looks · e2e radio value changes · art quality is subjective (review gate per batch).

## Rollback
Branch-only (`feat/distinct-job-art`); `git revert` the commits. No data migration, snapshot untouched. Per-phase: phase 01 alone is pixel-neutral and safe to keep.

## Done when
check, unit, e2e, build green; lazy chunk within the approved threshold; Lighthouse mobile home 99-100, CLS <= 0.002; 9 props pairwise distinct; docs + changelog synced; code-reviewer clean; conventional commits, no AI refs, no push.

## Unresolved questions
1. May props overlap the body/cape (default NO: 1 px gap, zero overlap with body, gear, identity boxes)? Touching allowed gives 10x15/10x14/6x29; overlap would let Mage go wider than 6 px.
2. Byte budget: approve lazy chunk <= **6,000 B gz** (baseline 4,627; +~1,300 B, +28%; v1.4 doc said <= 5 KB), eager stub <= +100 B gz, home HTML <= +1,000 B gz, animated raw ceiling 11 -> 12 KB if Archer needs it?
3. Should the per-job accent also tint the nameplate/UI (default NO: sprites only, no new UI tokens)?
4. Keep the 16-colour cap (Archer/Mage have 2 spare) or raise to 18?
5. Mage props are limited to 6x19 vs 9x14 for Warrior/Archer under the strict policy: acceptable?
6. Add a legacy-slot migration (`mage/hawk` -> `mage/seer`, 3-line map) or accept the one-time reset like v1.5 (default: reset)?
7. Version v1.6, changelog date 2026-10-21, branch `feat/distinct-job-art` OK?
8. Glyph/metaphor check: Knight gets a musical-sharp mark, Herald a generic `</>`, Ranger a 2-orbit atom (React uses 3 ellipses). Any look-alike concern?
