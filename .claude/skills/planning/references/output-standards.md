# Output Standards & Quality

## Task Breakdown

- Transform complex requirements into manageable, actionable tasks
- Each task independently executable with clear dependencies
- Prioritize by dependencies, risk, business value
- Eliminate ambiguity in instructions
- Include specific file paths for all modifications
- Provide clear acceptance criteria per task
- Fully respect the `./docs/development-rules.md` file

### File Management
List affected files with:
- Full paths (not relative)
- Action type (modify/create/delete)
- Brief change description
- Dependencies on other changes

## Workflow Process

1. **Initial Analysis** → Read docs, understand context
2. **Research Phase** → Spawn researchers in parallel, investigate approaches
3. **Codebase Understanding** → Scout (or interactive scan), map integration points
4. **Synthesis** → Analyze reports, identify optimal solution
5. **Design Phase** → Create architecture, implementation design
6. **Plan Documentation** → Write comprehensive plan in Markdown
7. **Plan Mode Handoff** → Ready for Plan mode to orchestrate execution

## Output Requirements

### What Planners Do
- Create plans ONLY (no implementation)
- Provide plan file path and summary
- Self-contained plans with necessary context
- Code snippets/pseudocode when clarifying
- Multiple options with trade-offs when appropriate
- Fully respect the `./docs/development-rules.md` file

### Writing Style
**IMPORTANT:** Sacrifice grammar for concision
- Focus clarity over eloquence
- Use bullets and lists
- Short sentences
- Remove unnecessary words
- Prioritize actionable info
- Be direct and honest

### Unresolved Questions
**IMPORTANT:** List unresolved questions at end
- Questions needing clarification
- Technical decisions requiring input
- Unknowns impacting implementation
- Trade-offs requiring business decisions

## Quality Standards

### Thoroughness
- Thorough and specific in research/planning
- Consider edge cases, failure modes
- Think through entire user journey
- Document all assumptions
- Validate findings across sources when possible

### Maintainability
- Consider long-term maintainability
- Design for future modifications
- Document decision rationale
- Avoid over-engineering
- Fully respect the `./docs/development-rules.md` file

### Research Depth
- When uncertain, research more
- Multiple options with clear trade-offs
- Validate against best practices
- Consider industry standards
- Use WebSearch for current information

### Security & Performance
- Address all security concerns
- Identify performance implications
- Plan for scalability
- Consider resource constraints
- Follow OWASP guidelines

### Implementability
- Detailed enough for junior developers
- Validate against existing patterns
- Ensure codebase standards consistency
- Provide clear examples
- Anticipate common pitfalls

## Handoff to Plan Mode

When planning is complete:

1. **Artifacts created:**
   - Research reports in `./plans/*/research/`
   - Scout/analysis reports in `./plans/*/reports/`
   - Comprehensive plan.md with overview
   - Detailed phase files (phase-XX-*.md)

2. **Readiness check:**
   - All phases have clear dependencies
   - Success criteria defined for each phase
   - Risks identified and mitigated
   - No critical unresolved questions

3. **User confirmation:**
   - Summarize plan structure
   - Highlight key decisions and trade-offs
   - Confirm user is ready to proceed

4. **Transition to Plan mode:**
   - Provide plan directory path
   - Invite: "Planning phase complete. Ready for Plan mode to orchestrate implementation?"
   - Plan mode takes over for step-by-step execution

---

**Remember:** Plan quality determines implementation success. Be comprehensive, consider all solution aspects. Your plan enables Plan mode to efficiently orchestrate the implementation.
