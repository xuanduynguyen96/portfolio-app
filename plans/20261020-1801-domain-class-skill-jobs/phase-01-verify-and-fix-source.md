# Phase 01: Rename to Mage, verify + fix source, art review

## Context Links
- Parent: [plan.md](plan.md) · Depends on: none · Blocks: 02, 03, 04
- Report: [current state](reports/01-current-state-report.md)
- Docs: `docs/code-standards.md` (GitHub character modules, Avatar sprites), `docs/design-guidelines.md#character-avatar`

## Overview
- Date: 2026-10-20 · Priority: P0 · Effort: M (2.5h; Mage rename adds ~0.5h, dropping new-art review saves ~1h)
- Implementation status: Done · Review status: Reviewed (code-reviewer: no critical/important findings) (code-reviewer in phase 06)
- Make `src/` + `scripts/` correct and budget-clean before touching tests. Source is mostly done; this phase proves it and fixes what is found.

## Key Insights
- `npm run check`: 0 tsc errors in `src/`; only `scripts/render-avatar-sheet.ts` is wrong in non-test code.
- Render crash: hero cell `profileOf('warrior', 'frontend', [0,1,2,0])` uses an old motif id.
- **Revision: Mage = DevOps.** Working tree still has the generated Artificer class (`artificer` id, Forgemaster/Shipwright/Warden, `avatar-class-artificer.ts`). Replace it with the original Mage pose from HEAD (staged for deletion today) and rename the class; see plan.md "Revision" table.
- The restored Mage pose (pointed hat, beard, orb hand, crystal staff) has hand-tuned anchors and identity boxes that passed all sprite tests at HEAD with the same prop art; re-verify against the new class set only.
- Jobs credit compares unrounded floats; domain scores are rounded. Align.
- `xp-rules.ts:39` comment is stale.

## Requirements
- Functional: classifier/rules exactly per spec (plan.md); sheet script renders all 10 looks; Mage (DevOps) satisfies every sprite constraint; no `artificer` identifier left in `src/`, `scripts/`.
- Non-functional: files <200 lines; no new deps; pure modules stay pure (no clock/DOM); eager-import guard for switcher unchanged.

## Architecture
Unchanged data flow: `snapshot -> repoMatchesSkill (skill nodes) -> repoDomainVote (even split x repoWeight) -> scores/primary -> pickJob (credit per job) -> CharacterProfile{signals,jobSignals,motif}`. Looks: `class-looks.ts` = CLASS_IDS x MOTIF_IDS + adventurer; job = `JOBS[class].find(motif)`. Gear untouched.

## Related code files
Modify:
- `src/data/character-job-rules.ts` (Mage rename: `CLASS_IDS` = warrior, archer, mage, adventurer; `CLASS_BY_DOMAIN.devops = 'mage'`; `CLASS_NAMES.mage = 'Mage'`; `JOBS.mage` = Enchanter `[github-actions, jenkins]` banner "CI/CD pipelines", Summoner `[docker]` crystal "Containers", Seer `[playwright]` hawk "Test automation"; header comment)
- `src/data/avatar/avatar-sprites.ts` (import `magePose` from `./avatar-class-mage.ts`; `classSprites.mage`; drop the `artificer` entry)
- `src/utils/avatar/class-looks.ts` (line 30 comment example `mage/hawk`)
- `scripts/render-avatar-sheet.ts` (hero motif `'banner'`; optionally show all 10 looks in the "big" rows via `LOOKS`, not only `PURE`)
- `src/utils/github-character/classify-character.ts` (round job credit with `round3`)
- `src/data/xp-rules.ts` (comment line 39: "Quest ranking = repo weight + hygienic slots + pinned bonus")
- `src/data/avatar/avatar-class-mage.ts` (restored from HEAD, unchanged; edit only if sprite tests demand)
- `src/data/avatar/avatar-palette.ts` + `src/styles/design-tokens.css` only if a new palette key is needed (avoid; reuse keys)
Read-only verify: `character-class-rules.ts`, `repo-domain-vote.ts`, `repo-skill-matches.ts`, `switcher-body.ts`, `class-why-panel.astro`.
Restore: `src/data/avatar/avatar-class-mage.ts` (`git restore --staged --worktree`).
Delete: `src/data/avatar/avatar-class-artificer.ts` (untracked; plain `rm`, then it is gone from history because it was never committed).

## Implementation Steps
1. Baseline: `cd /home/user/portfolio-app && git status --short` (expect 2 staged `D`, 17 `M`, 2 `??`, plus the untracked plan dir).
1a. **Mage rename** (before anything else so later checks run on the final class set):
   - `git restore --staged --worktree src/data/avatar/avatar-class-mage.ts` (brings the pose back; `git status` then shows 1 staged `D` left: `repo-archetype-vote.ts`).
   - `rm src/data/avatar/avatar-class-artificer.ts`; edit `avatar-sprites.ts` and `character-job-rules.ts` as listed above; fix the `class-looks.ts` comment.
   - `grep -rniE "artificer|forgemaster|shipwright" src scripts` -> must be empty. `npm run check` -> errors only in `tests/`.
   - Confirm `magePose` still satisfies `ClassPose` (types unchanged at HEAD) and that the placeholder `look` text / `avatar-description` do not mention "data" (the pose says "bearded wizard ... arcane orb"; no change needed unless the description line reads like a data scientist).
   - Check job names unique across all 9 (Knight, Paladin, Sentinel, Ranger, Skirmisher, Herald, Enchanter, Summoner, Seer).
2. Fix `render-avatar-sheet.ts` hero cell: `profileOf('warrior', 'banner', [0, 1, 2, 0])`. Run `npm run check` -> remaining errors must all be in `tests/`.
3. Quick invariant script (scratchpad, not committed) via `node`: for every `skillDomains` key assert exactly one job in `JOBS[CLASS_BY_DOMAIN[domain]]` lists it; every id exists in `skillNodes`; no job skill outside its class domain. (Becomes a unit test in phase 02; run now to catch table typos early.)
4. Round credit in `pickJob`: `round3(sum)`; keep reduce with strict `>` so earlier job wins ties. Same for `jobSignals` ordering (already `round3` points).
5. Render art: `node scripts/render-avatar-sheet.ts $SCRATCH/sheet.html --png $SCRATCH/sheet.png` (`SCRATCH` = session scratchpad); Read the PNG. Check:
   - Mage vs Adventurer vs Warrior vs Archer distinct at 64px and 128px (hat + beard + orb silhouette, hue). The pose is unchanged from HEAD; only compare it to the current Warrior/Archer, which did not change either.
   - Orb/sparks differ between frames (frame B = bigger orb, scattered sparks) and the staff is visible.
   - Job prop top-right (anchor 26,4) clear of the staff and orb hand on all 3 motifs, both frames, tiers 0 and 3.
   - Gear (armor, amulet, shield, boots) sits on body, not floating; tier 3 sparkle not on identity.
6. Fix anchors/identity boxes only if something is off. Identity `held` boxes at HEAD cover the orb hand (x 0-10, y 9-20), the staff head (x 22-25, y 0-5) and the staff shaft (x 23-24, y 6-28); head box x 7-22, y 0-14. Prefer leaving the pose untouched.
7. Temporary sprite-test run (tests are stale): write a scratchpad script that imports `classSprites.mage` and replays the `placements` check from `avatar-sprites.test.ts` (gear tiers x anchors x motifs vs identity boxes, on-canvas). Or defer to phase 02 and loop back here if red.
8. Budgets (needs phase 02 helpers, or scratch): <=16 colors/look, markup <=6 KB static / <=11 KB animated raw, <=2.5 KB gzip animated, silhouette IoU <=0.80 vs Warrior and Archer (same motif), jobs of a class differ >=12 px. Known good at HEAD for Mage vs old Warrior/Archer; recheck because Warrior/Archer sprites were not touched but the class set around them changed.
9. Re-read `classify-character.ts` against spec bullet by bullet (split, repoWeight, fallback, tie order, job credit). Verify `rankDomains` uses rounded scores and `total < minTotal || voters.length < minRepos` uses rounded scores.
10. `npm run character:explain` still runs; output sane.
11. Decision gate: if the vote model is wrong (not just a bug), stop and escalate (redo option, plan.md phase 0).

## Todo list
- [x] Mage rename done (restore pose, delete artificer file, rules/sprites/comment edited, grep empty)
- [x] Hero motif fix; `npm run check` clean outside tests
- [x] Invariant scratch check passes
- [x] Job credit rounded
- [x] xp-rules comment fixed
- [x] Sheet rendered, PNG reviewed (Mage, all 10 looks, both themes)
- [x] Art/anchors adjusted if needed; sprite constraints verified
- [x] Classifier re-read vs spec

## Success Criteria
- `npm run check`: 0 errors in `src/` + `scripts/`; `node scripts/render-avatar-sheet.ts out.html --png out.png` exits 0.
- Mage (restored pose) readable at 64px, distinct from Adventurer, no gear/prop on identity pixels (verified in phase 02 tests); zero `artificer` identifiers left in `src/` and `scripts/`.
- Spec-vs-code checklist (step 9) all ticked.

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Mage pose IoU vs Warrior/Archer >0.80 | silhouette test red | unlikely (passed at HEAD, others unchanged); if red, redraw the Mage pose, never raise the cap |
| Mage means DevOps but pose is a bearded wizard with an orb | art/role mismatch is only thematic | accepted by user choice; description text says "arcane orb", fits conjuring |
| Anchor tweak breaks other tests | churn | only edit the mage file; sprite tests catch it |
| Float tie flakiness | nondeterministic job | round3 credits, exact-tie tests |
| New palette key | token + both-theme test | reuse keys; if needed add token + `avatar-palette.ts` |

## Security Considerations
None new: pure build-time data, no user input. Class/job strings come from rules only; switcher allow-list parse unchanged (`parseLookKey`).

## Next steps
Phase 02 (tests) and 04 (real data) can start in parallel once `check` is clean.
