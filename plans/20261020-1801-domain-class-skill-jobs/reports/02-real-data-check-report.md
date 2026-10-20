# Report 02: real-data check (phase 04, 2026-10-20)

Method: HEAD exported to scratchpad (old engine), same snapshot file (`asOf` 2026-10-19), new tree = working tree. Read-only; no rule tuned to the result.

## Class / job
| | Old (HEAD) | New |
|---|---|---|
| Result | Warrior · Vanguard | **Warrior · Knight** |
| Scores | backend 3.377, data 0, frontend 2.696 | backend 2.877, frontend 2.364, devops 0.974 |
| Job driver | secondary archetype (frontend) | repos proving csharp/dotnet (MiniWebServer, WeatherApp, ...) beat Java and web-servers repos |

## Quests (quest.max 6, overrides: portfolio-app)
- Old: portfolio-app, spring-jenkins, online-resume, MiniWebServer, WeatherApp, aspnet_framework_docker_ex
- New: portfolio-app, spring-jenkins, **ShopDemo**, online-resume, MiniWebServer, WeatherApp
- Diff: ShopDemo in (was ranked out: only a small old class vote); aspnet_framework_docker_ex out (oldest repo, 0 commits). Boss unchanged (portfolio-app).

## Skill matches that voted (voting skills only)
| Repo | Proven | Note |
|---|---|---|
| aspnet_framework_docker_ex | dotnet, web-servers, docker | web-servers via `asp`/`mvc` keyword: fine |
| MiniWebServer | csharp, web-servers | `server` in name: fine |
| online-resume | html, css, web-sites | language-only HTML/CSS + `resume` |
| PersonalPortfolio | csharp, html, web-sites | |
| portfolio-app | astro, web-sites, github-actions, playwright | 2 frontend + 2 devops = 50/50 split (devops 0.617 = 63% of the devops score) |
| QrCodeScanner | csharp, mobile | `mobile` keyword, description says Xamarin: correct |
| ShopDemo | csharp, html, css | |
| spring-jenkins | java, spring, web-servers, jenkins | `api`/`rest` in description: correct here |
| WeatherApp | csharp | |
No false positive found on this snapshot. Generic words (`rest`, `server`, `api`, `mobile`, `landing`, `website`) only matched meaningful cases. Language-only votes: C# (4 repos), Java, HTML, CSS (2 repos).

## Flip sensitivity (informational)
| Scenario | Result | Scores |
|---|---|---|
| asOf -1 month / +1 month / +6 months | Warrior · Knight | backend 2.92/2.84/2.64, frontend 2.39/2.33/2.17 |
| without portfolio-app | Warrior · Knight | backend 2.877, frontend 1.747, devops 0.357 |
| without online-resume | Warrior · Knight | frontend 1.696 |
| without ShopDemo | Warrior · Knight | backend 2.636, frontend 1.883 |
Frontend stays ~82% of backend across time shifts (both decay together). Removing any one repo widens the gap. A flip needs a new strong frontend repo (about +0.5 weight). Accepted risk; documented, not tuned.

## Genericity
`grep -rn "xuanduynguyen96\|portfolio-app\|MiniWebServer\|WeatherApp" src/data/character-*.ts src/utils/github-character src/utils/avatar` -> none.

## Recommendation
Accept. No keyword tightening needed for this snapshot (open question 6 stays out of scope). Owner line for docs: "Warrior · Knight on the 2026-10-19 snapshot (dated example)".

## Unresolved
- None new.
