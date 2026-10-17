# 02: Phase 00 spike results

Date: 2026-10-17. Spike branch `spike/github-graphql` (local deleted; remote delete blocked from this session, owner deletes in GitHub UI). Runs: [probe #1](https://github.com/xuanduynguyen96/portfolio-app/actions/runs/39051651680), [V8 dispatched deploy](https://github.com/xuanduynguyen96/portfolio-app/actions/runs/39051699674), probe #2 (Go profiles retry). Sources kept: [prototype grids](assets/02-silhouette-prototypes.ts.txt), [dry-run classifier](assets/02-dry-run-classifier.ts.txt), [sheet](assets/02-silhouette-prototypes.png).

## Verification (all with Actions `GITHUB_TOKEN`; no PAT configured or needed)
| # | Claim | Result | Evidence |
|---|---|---|---|
| V1 | GITHUB_TOKEN queries `user(login:)` public repos | **Verified** | owner 9/9 public repos; 5 other users OK |
| V2 | `contributionsCollection` + per-day calendar | **Verified** | 7 yearly windows owner; 53 weeks x days; byRepo list |
| V3 | Cost / budget | **Verified** | every query cost **1**; limit **5000**/h; owner refresh = 1 profile + 7 yearly windows = **8 points** |
| V4 | `object(expression:"HEAD:")` root tree, `.github`, `.github/workflows` | **Verified** | root on 8/9 (empty repo has none); workflows only on portfolio-app |
| V5 | `languages` excludes prose | **Verified** | no Markdown in ~230 repos; but **TeX, Rich Text Format, PostScript, Vim Script, Nix** appear → ignore list |
| V6 | `privacy: PUBLIC` + `isFork:false` | **Verified** | 0 private, 0 forks in all outputs |
| V7 | `pinnedItems` | **Verified** | owner: none pinned; others 4-6 |
| V8 | `gh workflow run deploy-to-github-pages.yml` with GITHUB_TOKEN + `actions: write` | **Verified** | dispatched run by `github-actions[bot]`, event `workflow_dispatch`, success |
| V9 | `contributionsCollection` max 1 year | **Verified** | 13-month → `VALIDATION: total time spanned ... must not exceed 1 year` |

Extra findings (feed phase 01/02):
- **HTTP 502 on heavy page**: `repositories(first: 50)` with history totalCount + 3 tree objects → 502 for mitchellh; `first: 25` OK. Fetcher: page size 25, retry 5xx with smaller page, then keep snapshot.
- Empty repo (`aspnet_framework_docker_ex`): no `defaultBranchRef`, no languages, no tree → keyword-only vote (works).
- Calendar weeks start **Sunday** (confirmed); streak must re-bucket by ISO week.
- Owner `restrictedContributionsCount` = 0 every year → no private counts leak today (Q3 currently moot).
- Owner activity is sparse: 6 commits last 12 months (all portfolio-app), 0 in 2024-10..2025-10. Streak/level will be low → tone must stay fun.
- portfolio-app languages via GraphQL: TS 163 KB, **Python 125 KB** (`.claude/`), Astro 76, JS 58, Shell 28, CSS 12 → `.gitattributes` fix confirmed needed.
- No repo has description/topics/license except 4 descriptions → keywords from names + descriptions matter.

## Classifier dry-run (one shared param set, [source](assets/02-dry-run-classifier.ts.txt))
| Login | Expected | half-life 24 mo | half-life 48 mo |
|---|---|---|---|
| mitchellh (Go/Zig/C) | Warrior | Warrior · Knight | Warrior · Knight |
| spf13 (Go) | Warrior | Warrior · Knight | Warrior · Knight |
| jakevdp (Python/Jupyter) | Mage | Mage · Sorcerer | Mage · Sorcerer |
| sindresorhus (JS/TS) | Archer | Archer · Ranger | Archer · Ranger |
| **owner, Python polluted** | n/a | Warrior · Vanguard (b 2.10 / f 1.96) | Warrior · Vanguard (3.37 / 2.72) |
| **owner, `.claude` excluded (real)** | n/a | **Archer · Warden** (f 2.13 / b 2.06, 3% margin) | **Warrior · Vanguard** (b 3.33 / f 2.89, 15% margin) |

Owner per-repo votes (hl 48): portfolio-app f1.11 b.21 · spring-jenkins b.72 · MiniWebServer b.66 · WeatherApp b.62 · aspnet_framework_docker_ex b.53 (keywords) · online-resume f.65 · ShopDemo f.45 b.24 · PersonalPortfolio f.41 · QrCodeScanner f.27 b.24 (Xamarin keyword).

Reading: owner is genuinely hybrid; result is a knife edge decided by half-life. Both values keep every comparison profile correct. Generic rationale for **48 months**: public repos of most devs are sparse/infrequent; 24 mo makes a 2-year-old project worth 1/2 and over-rewards whatever was pushed last (one active repo flips class). Proposed default: **48**, user decides (Q2).

## Silhouettes ([sheet](assets/02-silhouette-prototypes.png))
- Tier-0 Warrior (horned helm, pauldrons, greatsword + guard), Mage (pointed hat + brim, flared robe to ankles, staff + orb above head), Archer (hood + feather, bow arc, strap). Shared base body.
- Coverage 42-46%; 10-11 colors each (<=12 target).
- IoU (opaque masks, class looks only, no shared gear yet):

| Pair | 32x32 | 16x16 OR-pool |
|---|---|---|
| warrior-mage | 0.734 | 0.781 |
| warrior-archer | 0.717 | 0.771 |
| mage-archer | 0.646 | 0.680 |

All under candidate thresholds (0.75 / 0.80) but warrior-mage margin thin → phase 04: threshold 0.75@32, 0.80@16, and do not let gear (shared shield/boots) erase headgear/weapon differences (region test).
- Readable at 64 px and 32 px in both plates (agent check). Dark plate `#2a2320` swallows the near-black outline → phase 04 needs a lighter plate (~`#3a302a`) or a 1px light rim; measure 3:1.
- Blind-ID with people: **not done** (agent cannot recruit testers) → moved into user gate below.
- Canvas decision: **32x32** (detail fits, 4x/6x/8x integer scales).

## Update: art style changed (user reference, 2026-10-17)
User asked for a chibi die-cut sticker style. Redrawn 3 classes: [sheet](assets/03-sticker-style-prototypes.png). Sticker ring fixes the dark-theme outline problem (no portrait plate needed). After moving the warrior sword point-down (all 3 classes had a tall item on the left), IoU: w-m .705/.709, w-a .737/.733, m-a .722/.777 at 32/16, all under .75/.80. Colors 11-15 per avatar → cap 16. Phase 04 spec updated.
Pose follow-up (user ref): held items moved to the viewer's right, close to the body, archer holds bow out at arm's length. IoU w-m .720/.760, w-a .719/.719, m-a .707/.751; still under .75/.80.

## Decisions for next phases
- Token: `GITHUB_TOKEN` only; PAT path stays as documented fallback, not configured.
- Fetcher: page 25, 5xx retry (25 → 10), yearly windows from `createdAt`, cost ~8 points.
- Ignore languages add: TeX, Rich Text Format, PostScript, Vim Script, Nix, Nushell, Makefile, Shell, Dockerfile, PowerShell, Batchfile.
- Classifier defaults: hl 48 (pending Q2), minShare .1, primary bonus .3, notebook cap 200 KiB, keyword points .5 (xamarin/aspnet 1).
- 32x32 confirmed; prototypes are the start of phase 04 grids.

## Gate (user)
1. Owner class: accept **Warrior · Vanguard** (hl 48, default) or **Archer · Warden** (hl 24)?
2. Prototype sheet OK as art direction? Quick blind-ID: show the 3 small sprites to 2-3 people for 2 s, ask "warrior, mage or archer?"

## Unresolved questions
- Q2 half-life (above). Q1 private repos still public-only by default.
- 60-day schedule auto-disable: can bot commits keep it alive? Not verifiable in spike; refresh workflow keeps `workflow_dispatch` as manual fallback.
