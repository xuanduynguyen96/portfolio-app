---
name: planning
description: Create detailed technical implementation plans through systematic research, codebase analysis, solution design, and comprehensive documentation. Use this whenever planning new features, architecting systems, evaluating technical approaches, breaking down complex requirements, or assessing technical trade-offs. The skill produces research reports, architectural designs, and actionable phase-by-phase plans ready for Plan mode orchestration.
compatibility: Requires researcher agents, WebSearch tool. OPTIONAL scout slash command (/scout:ext preferred).
---

# Planning Skill

Create detailed technical implementation plans through systematic research, codebase analysis, solution design, and comprehensive documentation.

## When to Use

Use this skill when:
- Planning new feature implementations
- Architecting system designs
- Evaluating technical approaches
- Creating implementation roadmaps
- Breaking down complex requirements
- Assessing technical trade-offs

**Output:** Comprehensive research artifacts, architecture design, and detailed implementation plan ready for Plan mode execution.

## Core Principles

Always honoring **YAGNI**, **KISS**, and **DRY** principles.
**Be honest, be brutal, straight to the point, and be concise.**

## Workflow Process

### 1. Initial Analysis
Load: `references/codebase-understanding.md`

Read and understand project context:
- Review `./docs/development-rules.md` (IMPORTANT)
- Study `./docs/codebase-summary.md`
- Analyze `./docs/code-standards.md`
- Review `./docs/design-guidelines.md` (if exists)

**Skip if:** Provided with complete context upfront.

### 2. Research Phase
Load: `references/research-phase.md`

Investigate technical approaches systematically:
- Spawn `researcher` agents in parallel to investigate different approaches
- Each researcher focuses on a specific technical aspect
- Wait for all researchers to report back

**Skip if:** Provided with researcher reports.

**Note:** The following skills are planned but not yet implemented:
- ❌ `sequential-thinking` — Use for complex analysis when available
- ❌ `docs-seeker` — Use WebSearch + manual doc links instead
- ❌ `debugger` agent — Ask user to provide logs; analyze patterns

### 3. Codebase Understanding
Load: `references/codebase-understanding.md`

Locate relevant files and understand existing patterns:

**Primary approach:** Use `/scout:ext` slash command
- Each scout locates files for specific task aspects
- Wait for all scouts to report

**Fallback (if scout unavailable):** Interactive LLM exploration
- Provide initial prompt to scan codebase structure
- Ask user interactively: "Which files, modules, or components are most important for this feature? I'll focus my analysis there."
- User provides guidance on:
  - Critical modules or components
  - Integration points
  - Code patterns to follow
- Scan and report findings back to user

Study existing patterns in codebase:
- Identify conventions and architectural decisions
- Note consistency in implementation approaches
- Understand error handling patterns

**Skip if:** Provided with scout reports.

### 4. Synthesis
Analyze all reports and identify optimal solution:
- Evaluate multiple approaches
- Compare pros and cons
- Consider security, performance, scalability
- Recommend best option with rationale

### 5. Solution Design
Load: `references/solution-design.md`

Create architecture and implementation design:
- Design scalable system architecture
- Plan component interactions and data flow
- Address edge cases and failure modes
- Design for security and performance

### 6. Plan Documentation
Load: `references/plan-organization.md` and `references/output-standards.md`

Write comprehensive, actionable plan:
- Create overview plan (plan.md)
- Write detailed phase files with implementation steps
- Break down into manageable tasks
- Ensure implementability and clarity

## Plan Output Structure

Save plans in `./plans` directory with timestamp and descriptive name.

**Format:** `plans/YYYYMMDD-HHmm-your-plan-name/`

**Directory structure:**
```
plans/
└── YYYYMMDD-HHmm-plan-name/
    ├── research/
    │   ├── researcher-XX-report.md
    │   └── ...
    ├── reports/
    │   ├── scout-report.md
    │   ├── researcher-findings.md
    │   └── ...
    ├── plan.md                    # Overview & access point
    ├── phase-01-name.md
    ├── phase-02-name.md
    └── ...
```

## Quality Standards

- Be thorough and specific
- Consider long-term maintainability
- Research thoroughly when uncertain
- Address security and performance concerns
- Make plans detailed enough for junior developers
- Validate against existing codebase patterns
- Fully respect `./docs/development-rules.md`

## Output Requirements

- **DO NOT implement code** — only create plans
- Respond with plan directory path and summary
- Self-contained plans with necessary context
- Include code snippets/pseudocode when clarifying
- Provide multiple options with trade-offs when appropriate
- **Sacrifice grammar for concision**

## Handoff to Plan Mode

Once planning is complete:

1. All research, analysis, and design artifacts created
2. Detailed phase documentation ready
3. Summarize findings and confirm plan structure with user
4. **Invite user to enter Plan mode:** "Planning phase complete. Ready for Plan mode to orchestrate implementation?"
5. Plan mode will use these artifacts to guide step-by-step execution

## Reference Files

Load these as needed throughout the workflow:

- **`references/research-phase.md`** — Research methodology, parallel agents, discovery
- **`references/codebase-understanding.md`** — Scout strategies, pattern recognition, integration planning
- **`references/solution-design.md`** — Trade-off analysis, security, performance, edge cases
- **`references/plan-organization.md`** — Directory structure, file organization, phase templates
- **`references/output-standards.md`** — Task breakdown, writing style, quality standards

---

**Remember:** Plan quality determines implementation success. Be comprehensive and consider all solution aspects. The planning phase sets up Plan mode for successful execution.
