---
name: research
description: Systematic technical research with multi-source validation. Use for evaluating libraries, investigating security vulnerabilities, comparing solution approaches, and creating evidence-based technical specs. Triggers on "research", "investigate", "compare", "evaluate", "which library", "best practice", "should we use".
allowed-tools: WebSearch, WebFetch, Read, Write, Edit, Glob, Grep, TodoWrite
---

# Research

Validate technical decisions with multi-source research before implementation. **Max 5 searches per task.**

## Core Principle

**Honor YAGNI, KISS, DRY. Research to eliminate uncertainty, not satisfy curiosity.**

Research is waste if it doesn't inform a decision. Before searching, know what decision depends on the answer. Focus on authoritative sources (docs, repos, CVEs), cross-reference for accuracy, prioritize last 12 months. Brutal honesty over diplomatic hedging.

## When to Use

Always for:
- Evaluating libraries/frameworks before adoption
- Investigating security vulnerabilities or best practices
- Comparing solution approaches with unclear trade-offs
- Creating technical specs that require evidence

Especially when:
- Team unfamiliar with technology (reduce guesswork)
- Security/performance critical (need benchmarks, CVEs)
- Multiple solutions exist (comparative analysis required)
- Legacy migration (must verify deprecation/compatibility)

## The Process

### 1. Define Scope + Decision Criteria

Before any search: What decision needs this research? What facts will change the outcome?

Set boundaries (depth, recency, sources).

**Example:** "Which auth lib for Next.js?" → Criteria: maintained, security track record, TypeScript support, <50kb.

### 2. Systematic Search (Max 5)

**Query fan-out** across:
- Official docs, GitHub repos, changelogs
- CVE databases (security topics)
- Recognized experts/conferences
- Benchmarks, case studies (performance)

Cross-reference minimum 3 sources. Check dates. Identify consensus vs. outliers.

**Search budget:**
- Search 1-2: Broad discovery (official docs, popular articles)
- Search 3-4: Deep dive (specific features, benchmarks, CVEs)
- Search 5: Edge cases / unresolved questions

### 2b. Special Considerations by Domain

Apply these guardrails based on research topic:

**Security Research:**
- Always check recent CVEs and security advisories (NVD, GitHub Security Advisories)
- Note any unpatched vulnerabilities or known exploits
- Include mitigation strategies for identified issues
- Flag End-of-Life (EOL) dates for software versions

**Performance Research:**
- Look for benchmarks and real-world case studies (not just theoretical performance)
- Compare against your actual use case (single thread vs. distributed, etc.)
- Note what changed between versions (optimization details, not just version numbers)
- Flag performance regressions or known bottlenecks

**Technology Adoption Research:**
- Assess community adoption and support levels
- Check GitHub stars, npm downloads, or similar metrics
- Review maintenance status (active, dormant, archived)
- Verify documentation quality and community responsiveness

**API & Integration Research:**
- Verify endpoint availability and authentication requirements
- Note rate limits, quotas, and usage restrictions
- Check for breaking changes in recent versions
- Document deprecation warnings and migration paths

**Deprecation & Migration Research:**
- Always note deprecation warnings and EOL dates
- Provide clear migration paths to alternatives
- Flag compatibility issues with current dependencies
- Include rollback strategies if applicable

### 3. Analyze + Synthesize

Compare: Pros/cons, maturity, adoption, security, performance, compatibility.

Flag: Deprecated features, breaking changes, unresolved issues.

Output: Actionable recommendation with evidence.

### 4. Generate Report

**Location:** Save to `plans/reports/YYMMDD-<topic>.md` (create `plans/reports/` if needed). Include the plan name in the path if available: `plans/<plan-name>/reports/YYMMDD-<topic>.md`.

**Report structure:**

ALWAYS use this exact template:

```markdown
# Research: [Topic]

## Executive Summary
[2-3 paragraphs: overview of key findings and recommendations]

## Research Methodology
- Sources consulted: [number and types]
- Date range: [earliest to most recent]
- Key search terms: [list]

## Key Findings

### Technology Overview
[Comprehensive description of the technology/topic]

### Current State & Trends
[Latest developments, version info, adoption trends]

### Best Practices
[Recommended practices with explanations]

### Security Implications
[Vulnerabilities, security considerations, mitigation strategies]

### Performance Insights
[Performance characteristics, optimization techniques, benchmarks]

## Comparative Analysis
[If applicable: comparison table or detailed analysis of different solutions/approaches]

## Implementation Recommendations

### Quick Start Guide
[Step-by-step getting started instructions]

### Code Examples
[Relevant code snippets with explanations]

### Common Pitfalls
[Mistakes to avoid and their solutions]

## Resources & References

### Official Documentation
- [Linked list of official docs]

### Recommended Tutorials
- [Curated list with descriptions]

### Community Resources
- [Forums, Discord servers, Stack Overflow tags]

### Further Reading
- [Advanced topics and deep dives]

## Appendices

### A. Glossary (if needed)
[Technical terms and definitions]

### B. Compatibility Matrix (if applicable)
[Version compatibility or dependency information]

### C. Raw Research Notes (optional)
[Detailed notes from research process for future reference]

## Unresolved Questions
[Open questions that remain, if any]
```

**Guidelines:**
- Use bullet points over paragraphs
- Lead with recommendation, evidence second
- Use code blocks with syntax highlighting (e.g., ```javascript```, ```sql```)
- Include ASCII diagrams or mermaid charts where helpful
- Include a table of contents for reports with multiple sections
- Sacrifice grammar for concision

## Common Use Cases

### Auth Library Selection
```
"Research Next.js auth solutions. Need: Prisma integration, OAuth providers, session management, TypeScript. Compare NextAuth vs Clerk vs Supabase Auth. Recommend one."
```

### Performance Optimization
```
"React dashboard renders slowly. Research: Code splitting strategies, lazy loading patterns, bundle analysis tools. Focus on Vite-specific optimizations and real-world benchmarks."
```

### Database Migration
```
"Migrating from Postgres 12 to 16. Research breaking changes, performance improvements, migration tools. Check for issues with Prisma 5.x compatibility."
```

### Security Vulnerability Assessment
```
"CVE-2024-XXXX affects our Express version. Research: Impact scope, exploit difficulty, patching strategy, workaround options."
```

### Framework Evaluation
```
"Evaluate Astro vs Next.js for content site. Priorities: Build speed, SEO, partial hydration, markdown support. Need hard data on build times."
```

## Quality Standards

Ensure all research meets these acceptance criteria:

**Accuracy**: Information verified across 3+ independent sources. Claims are fact-checked against official documentation.

**Currency**: Prioritize information from the last 12 months for fast-moving technology. Note when historical context is needed. Flag outdated information.

**Completeness**: Address all aspects requested by the user. Don't leave implicit assumptions — state them. Cover edge cases and gotchas.

**Actionability**: Provide practical, implementable recommendations. Include quick start guides, code examples, and step-by-step instructions. Avoid purely theoretical analysis.

**Clarity**: Use clear language, define technical terms, provide examples. Assume technical audience but explain unfamiliar concepts. Organize information hierarchically.

**Attribution**: Always cite sources with links for verification. Include publication dates. Distinguish between primary sources (official docs) and secondary sources (blog posts, discussions).

## Quality Checklist

Before delivering the report:
- [ ] 3+ authoritative sources cross-referenced
- [ ] Code examples included (if applicable)
- [ ] Security implications addressed
- [ ] Performance data cited (if relevant)
- [ ] Migration/compatibility notes clear
- [ ] Recommendation leads, evidence follows
- [ ] Abbreviations and jargon defined
- [ ] Formatting uses code blocks with syntax highlighting

## Red Flags

Stop and reconsider if:
- Only one source for a critical claim
- Dates >2 years old for fast-moving tech
- Vague claims without examples or data
- Report reads like a survey, not a recommendation

## Output Requirements

Your final report must:

1. **Be saved as markdown** with a descriptive filename in `plans/reports/YYMMDD-<topic>.md` format
2. **Include a timestamp** of when the research was conducted (in the filename or metadata)
3. **Provide clear section navigation** — use hierarchical headings and include a table of contents for longer reports
4. **Use code blocks with syntax highlighting** — specify the language (e.g., ```javascript```, ```sql```, ```bash```)
5. **Include diagrams where helpful** — use ASCII art or mermaid diagrams for architecture, comparisons, or flow
6. **Conclude with specific, actionable next steps** — not generic statements, but concrete actions the user can take
7. **Sacrifice grammar for concision** — prioritize clarity and brevity over perfect prose

## Notes for LLMs

- Think before each search — 5 is the hard limit
- Always end with a clear, opinionated recommendation
- List unresolved questions at the end if any remain
- Assume a technical audience — skip obvious background
- Anticipate follow-up questions and provide comprehensive coverage of edge cases
- Research should provide strategic technical intelligence that enables informed decision-making
