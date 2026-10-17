---
name: tech-lead-design
description: |
  When you need to make a technical design decision backed by research and trade-off analysis, use this skill to synthesize a complete Design Decision Document. 

  This skill is your technical leader for architectural decisions: it reads your business requirements, evaluates multiple design approaches side-by-side (including pros/cons), recommends the best option with clear rationale, and generates architecture diagrams. Use it whenever:
  - You have a PRD or feature spec and need to decide on architecture before implementation
  - You're choosing between competing approaches (monolith vs. microservices, different algorithms, data models, etc.)
  - You want a structured decision document for team review
  - You need to understand trade-offs between options for an architectural decision
  - You're starting a new module/service and need design guidance
  - You have a complex feature and need to think through the design implications

  This is not a code generator — it's a decision synthesizer. It produces a design decision document that guides implementation.
---

# Tech Lead Design Skill

## Overview

This skill synthesizes a complete **Design Decision Document (DDD)** that guides technical implementation. It reads your business requirements, evaluates multiple design approaches, recommends one backed by clear reasoning, and generates architecture diagrams.

The result is a 10-section decision document ready for team review:
1. **Context** — Problem, constraints, why this matters
2. **Options Evaluated** — 2–3 viable approaches with pros/cons
3. **Recommendation** — Clear choice + detailed rationale vs. alternatives
4. **Sub-Decisions** — Related architectural choices (data model, validation, testing strategy, etc.)
5. **Key Assumptions** — What must be true; risks if assumptions break
6. **Implementation Considerations** — Concrete guidance (testing, performance, integration)
7. **Database Schema / Artifacts** — With embedded diagrams
8. **Implementation Order** — Step-by-step phases + dependencies
9. **Next Steps** — Reviews, timing, blockers
10. **Decision Log** — Summary table of all choices

## How to Use This Skill

**Your input:** Plain text describing:
- Where your tech doc/PRD is (file path or pasted content)
- Where to store the output (e.g., `docs/designs/shift-assignments-engine/`)
- Whether to scan the codebase for consistency with existing patterns
- Any additional context (phase, team constraints, performance targets)

**Example input:**
```
Analyze docs/prd/shift-assignments-engine.md for architectural design decisions.
Store the decision doc in docs/designs/shift-assignments-engine/
Please scan the codebase to ensure we're consistent with existing patterns.
Context: Phase 1C, need <10s performance, greedy algorithm sufficient for MVP.
```

**What the skill does:**
1. Parses your input to extract: source file path, output folder, codebase scan flag, context
2. Scans codebase (if requested) — reads CLAUDE.md, ADRs, existing patterns
3. Delegates to `business-analyst` skill — extracts goals, requirements, constraints
4. Generates & evaluates options — creates 2–3 design approaches with trade-off analysis
5. Synthesizes recommendation — chooses best option, explains why vs. alternatives
6. Identifies sub-decisions — breaks down high-level choice into 3–5 related decisions
7. Delegates to `mermaid-diagrams` skill — generates schema ERD, architecture, workflow diagrams
8. Assembles Design Decision Document — all 10 sections + embedded diagrams
9. Writes output to `docs/designs/<design-name>/` with separate diagram files

**What you get:**
```
docs/designs/<design_name>/
├─ design_decision_doc.md         (10 sections, ready for team review)
└─ diagrams/
   ├─ schema.mmd                  (Database ERD if applicable)
   ├─ architecture.mmd            (Component topology + data flow)
   ├─ workflow.mmd                (State machine / critical workflow)
   └─ [others].mmd                (As needed: decision trees, sequence diagrams, etc.)
```

## Key Principles

**Options are evaluated fairly** — The skill generates 2–3 viable approaches and shows trade-offs honestly. It doesn't straw-man alternatives; each option has real pros and cons.

**Rationale is explicit** — The recommendation explains *why this option* and *compared to what*. Every decision is supported by constraints, team capability, or project context.

**Assumptions are surfaced** — Key assumptions are called out explicitly (e.g., "assumes greedy algorithm sufficient for MVP"). Risks are identified if assumptions break.

**Sub-decisions are addressed** — High-level decisions spawn 3–5 sub-decisions. Example: choosing "separate package for algorithm" → sub-decisions about constraint validation, fairness scoring, conflict detection, and state management.

**Implementation is practical** — The document includes concrete guidance: testing strategy, performance targets, build order, dependencies.

**Diagrams match narrative** — Schema diagrams match database sections; architecture diagrams match component descriptions.

## Input Parsing

The skill parses your plain-text input to extract:

| Parameter | How it's detected | Example |
|-----------|-------------------|---------|
| `source_path` | File path mentioned | `docs/prd/shift-assignments.md` |
| `design_name` | From output folder path | `"shift-assignments-engine"` from `docs/designs/shift-assignments-engine/` |
| `scan_codebase` | Keywords like "scan", "check patterns", "consistency" | "please scan the codebase" |
| `project_context` | Phase, constraints, targets mentioned | "Phase 1C, <10s performance, 3 engineers" |

## Integration with Other Skills

This skill orchestrates:
- **business-analyst** — To extract requirements, constraints, user impact from your source doc
- **mermaid-diagrams** — To generate architecture, schema, and workflow diagrams

## Design Decision Document Structure

The output document always includes these 10 sections:

### 1. Context
- Problem statement
- Why this decision matters
- Key constraints (performance, timeline, team size, tech debt)
- Success criteria

### 2. Options Evaluated
For each option (A, B, C):
- Description
- Pros (real benefits)
- Cons (honest drawbacks)
- YAGNI/KISS/DRY verdict

### 3. Recommendation
- Clear choice (e.g., "Use Option B: Separate package for algorithm")
- Rationale (why this option)
- Trade-off analysis (vs. other options)
- How it respects constraints + team capability

### 4. Sub-Decisions
Related architectural choices, each with the same structure:
- Option A, B, C (or just the chosen sub-decision with rationale)
- Examples: data model design, constraint validation strategy, testing approach

### 5. Key Assumptions
- What must be true for this design to work
- Risks if assumptions break
- Example: "Assumes greedy algorithm sufficient for MVP; if <10s target is missed, need backtracking"

### 6. Implementation Considerations
- Testing strategy (unit tests, integration tests, performance validation)
- Performance targets and how to validate
- Integration points with existing code
- Team readiness assessment

### 7. Database Schema / Artifacts
- SQL schema (if applicable)
- Code sketches
- Embedded Mermaid diagrams with captions

### 8. Implementation Order
- Step-by-step phases
- Build dependencies
- Critical path items
- Effort estimates (rough)

### 9. Next Steps
- Design reviews needed
- Timeline
- Blockers to resolve
- Who decides what

### 10. Decision Log
Summary table:
| Decision | Option Chosen | Rationale |
|----------|---------------|-----------|

## Output Location

Always write output to `docs/designs/<design_name>/`:

```
docs/designs/<design_name>/
├─ design_decision_doc.md
└─ diagrams/
   ├─ schema.mmd
   ├─ architecture.mmd
   ├─ workflow.mmd
   └─ [additional diagrams as needed]
```

If the directory doesn't exist, create it.

## Quality Standards

Before considering the skill "done," verify:
- [ ] All 3+ options evaluated fairly (not straw-manned)
- [ ] Recommendation clearly states **why** vs. alternatives
- [ ] Assumptions called out explicitly with risk assessment
- [ ] Diagrams match narrative (schema ↔ database section, architecture ↔ components)
- [ ] Implementation order is feasible (dependencies clear)
- [ ] Team can execute the plan (aligns with capability, timeline realistic)
- [ ] Sub-decisions are fully addressed (not left hanging)

## Common Pitfalls to Avoid

- ❌ Straw-manning alternatives — Evaluate all options fairly
- ❌ Vague rationale — "It's better" is not enough; explain *why* and *compared to what*
- ❌ Hidden assumptions — Call them out explicitly
- ❌ Diagrams that don't match narrative — Verify alignment
- ❌ Missing implementation order — A decision is incomplete without clear steps
- ❌ Ignoring YAGNI/KISS — Recommend the simplest approach that respects actual complexity
- ❌ Skipping team readiness — Can the team build and maintain this?
- ❌ Too many options — 2–3 is usually enough

## Examples

### Example 1: Shift Assignments Engine
Input: "Analyze docs/prd/shift-assignments-engine.md for design decisions. Store in docs/designs/shift-assignments-engine/"

Output: Design Decision Document evaluating:
- Option A: Embed algorithm in service layer
- Option B: Separate `pkg/assignments/engine` package ✅ RECOMMENDED
- Option C: Use CSP solver (OR-Tools)

Recommendation: Option B (testable, clear, reusable)
Sub-decisions: Constraint validation, fairness scoring, conflict detection, state management

### Example 2: Authentication System
Input: "We need to redesign auth to meet new compliance requirements. Design decision doc in docs/designs/auth-compliance/"

Output: Evaluates:
- Option A: Enhance existing middleware
- Option B: Migrate to external auth service (Clerk, Auth0)
- Option C: Build custom OAuth provider

Recommendation chosen with explicit trade-offs vs. alternatives

## Notes

- The skill relies on business-analyst skill being available to extract requirements
- The skill relies on mermaid-diagrams skill for visual documentation
- Output is always a Design Decision Document—not code, not an implementation plan, but a decision guide
- The document is a living artifact; update it as implementation progresses if assumptions change
