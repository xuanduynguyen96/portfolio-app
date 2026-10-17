# 01: Owner GitHub data reality check (xuanduynguyen96)

Date: 2026-10-17. Source: GitHub search API via session MCP (token sees private repos; CI `GITHUB_TOKEN` will NOT). Repo metadata only (primary language), no bytes/topics/files/contributions fetched.

## Repos (16 owned, 0 forks, 0 archived, 0 stars total)
| Repo | Vis | Primary lang | Created | Last update |
|---|---|---|---|---|
| portfolio-app | public | TypeScript | 2026-10 | 2026-10 |
| ai-setup | private | Python | 2026-06 | 2026-08 |
| shift-scheduler | private | TypeScript | 2026-03 | 2026-04 |
| note-bite | private | TypeScript | 2025-12 | 2025-12 |
| spring-jenkins | public | Java | 2024-06 | 2024-06 |
| ecommerce | private | TypeScript | 2024-05 | 2024-05 |
| basic-shop | private | TypeScript | 2024-04 | 2024-04 |
| ShopDemo | public | HTML | 2024-04 | 2024-04 |
| MiniBlog | private | C# | 2023-10 | 2023-10 |
| WeatherApp | public | C# | 2023-08 | 2023-08 |
| MiniWebServer | public | C# | 2023-07 | 2023-07 |
| aspnet_framework_docker_ex | public | (none) | 2023-02 | 2023-02 |
| online-resume | public | HTML | 2022-06 | 2022-06 |
| QrCodeScanner | public | C# (Xamarin) | 2022-06 | 2022-06 |
| PersonalPortfolio | public | JavaScript | 2022-05 | 2022-05 |
| Study_DuyShopee | private | CSS | 2022-03 | 2022-03 |

## Counts by primary language (repo count)
- Public only (9): C# 3, HTML 2, TypeScript 1, Java 1, JavaScript 1, none 1.
- All (16): TypeScript 5, C# 4, HTML 2, Java 1, JavaScript 1, Python 1, CSS 1, none 1.

## Implications for the plan
1. **Public vs private flips the class.** Public-only -> backend/.NET-heavy (Warrior). Incl. private + recency weighting -> TypeScript/web-heavy (recent 2024-2026 work is TS). Recency weighting on public-only: portfolio-app (TS, 2026) dominates recent; C# all 2022-2023. Result will be borderline; tie-break + "secondary archetype" matters.
2. **Private repos = privacy decision.** Including them needs a PAT with private read; snapshot is committed to a PUBLIC repo -> must never store private repo names/descriptions. Option: aggregate-only (language counts/weights, no names) for private; or exclude entirely (default, safest).
3. **Owner is genuinely hybrid (C# backend + TS web).** Single-label classifier loses this. Strong case for Job = secondary archetype (see below).
4. **Sparse/low signals.** 0 stars, few public repos, mostly single-day repos (created==updated). Level will be low; hygiene signals (SECURITY.md, CodeQL, tests) likely absent except portfolio-app (has CI workflow + tests). Tier 0 gear must look good, not "naked/shameful". Level curve must not humiliate; fun tone.
5. **Repo "language: none"** (aspnet_framework_docker_ex) -> fall back to name/description/topic keywords (`aspnet`, `docker`) or skip.
6. **Primary-language-only would be wrong for Xamarin** (QrCodeScanner = mobile, but C#). Topics/description keywords ("Xamarin Mobile App") are needed for archetype, not just language.
7. **Mono-day repos** (created==pushed same day) = imported/uploaded code; activity signal must come from contributionsCollection (commit weeks), not repo count alone.

## Proposed classifier shape (for planner to evaluate)
- Archetype scores (backend / data-ai / frontend-mobile, + infra/devops as gear not class) from: language weight per repo (capped, recency-decayed) + keyword/topic hits.
- **Class = top archetype; Job = (class, secondary archetype) pair** -> exactly 3x3 = 9 jobs incl. "pure" (secondary weak/absent). Deterministic, explainable ("Warrior because C# x3; Spellblade because TypeScript web secondary"). Owner likely lands on a hybrid job, which is the most honest result.
- Fallback "Adventurer" (no class) when total signal < threshold.

## Unresolved
- Include private repos (aggregate-only) or public only?
- Should recency decay favor recent TS work enough to flip class? (Owner preference: user's example ".NET -> Warrior" suggests they self-identify as Warrior.)
