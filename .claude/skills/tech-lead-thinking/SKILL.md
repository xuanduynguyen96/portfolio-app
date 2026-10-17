---
name: tech-lead-thinking
description: >
  Orchestrates technical decisions by routing to research (fact-gathering) and brainstorm 
  (option evaluation) skills, then synthesizes findings into actionable recommendations. 
  Use whenever you face architectural decisions, technology choices, or trade-off evaluations 
  with unclear best paths. Triggers on: "should we use X or Y", "evaluate these options", 
  "compare solutions", "how should we structure", "is this worth the complexity", 
  "what's the best approach". Also use when a decision spans both facts AND opinions — 
  the skill prevents bikeshed brainstorming (endless discussion without evidence) and 
  analysis paralysis (endless research without deciding). If the user explicitly names 
  /brainstorm or /research, defer and suggest that skill directly instead of wrapping it.
---

# Technical Leader Skill

You are a decision coordinator. Your job is to recognize when a technical decision needs *both* evidence and evaluation, route to the right skill(s), wait for results, then synthesize everything into a clear, defensible recommendation.

## Core Workflow

Every decision follows this path:

### 1. Scout
Before routing anywhere, read the relevant code, architecture docs, recent decisions, or project context. You want to understand the landscape so your routing is informed, not generic. If it's unclear whether facts or options matter more, read until it's clear.

### 2. Detect Routing Needs
Classify the decision:

- **Research-first**: Facts are uncertain and will change the outcome. Examples: "which library?", "is X production-ready?", "what are the security implications?" Route to `/research` first, then optionally `/brainstorm` with research findings in hand.

- **Brainstorm-first**: Options are clear but trade-offs are unclear. Examples: "which of these 3 approaches?", "scope vs speed trade-off", "is this worth the complexity?". Route to `/brainstorm` first. Optionally follow with `/research` to validate the top choice.

- **Parallel**: Research and brainstorm need to happen simultaneously because they inform different aspects. Example: "Compare 5 frameworks for integration, and brainstorm how each fits our architecture". Route both at the same time, then synthesize.

- **No-op**: The decision is already clear from context, or facts are irrelevant. Example: User says "I already know we need X, just help me decide between A, B, C implementations". Skip orchestration — suggest `/brainstorm` directly instead of wrapping it. This prevents over-engineering.

### 3. Invoke Skill(s) — Sequential
If routing research → brainstorm:
1. Invoke `/research` with the decision context
2. Wait for research findings
3. Invoke `/brainstorm` with research summary in the prompt

If routing brainstorm → research:
1. Invoke `/brainstorm` with the decision context
2. Wait for brainstorm findings
3. Invoke `/research` on the top option to validate it

If routing parallel (rare):
- Invoke both simultaneously, wait for both, synthesize together

### 4. Synthesize
Combine findings into a **unified decision report**. The report has two levels:

**Summary level** (what you read first):
- Clear recommendation with 1-2 sentence rationale
- Key trade-offs from brainstorm (pros/cons of top options)
- Critical facts from research (validation, risks, constraints)

**Detail level** (for reference):
- Full research findings (methodology, all facts gathered, trade-offs)
- Full brainstorm analysis (all options evaluated, YAGNI/KISS/DRY assessment)

This structure lets the user quickly understand the recommendation, but have detailed evidence to review if needed.

### 5. Flag Uncertainties
If research discovered constraints that weren't obvious in the brainstorm, or if assumptions changed, *note them explicitly*. Don't auto-loop or re-brainstorm — the user can revisit if needed, but you're documenting the gap for transparency.

## Decision Report Template

Save to `plans/reports/tech-lead-analysis-<DATE>-<title>.md`. Use this structure:

```markdown
# Decision: [Title]

## Recommendation
[Clear statement: "Use [option] because [core reason]". 2-3 sentences max.]

## Summary Evidence

### Research Summary
[Synthesized key facts, 3-5 bullets. Lead with what mattered most for the decision.]

### Brainstorm Summary
[Synthesized trade-offs, 3-5 bullets. Top option vs. runner-up.]

## Key Assumptions
[What needs to be true for this recommendation to hold. If assumptions change, revisit.]

## Uncertainties Noted
[Any gaps between research and brainstorm, or constraints discovered after initial analysis.]

---

## Detailed Findings

### Research Findings
[Full research output from /research skill. Preserve methodology, sources, all facts gathered.]

### Brainstorm Analysis
[Full brainstorm output from /brainstorm skill. Preserve all options evaluated, YAGNI/KISS/DRY assessment.]

## Next Steps
[Concrete actions to validate or implement the recommendation.]
```

## When NOT to Invoke This Skill

- **User explicitly names a skill**: They said "run brainstorm on X" or "research this library". Defer — suggest invoking that skill directly.
- **Decision is already made**: They know what they want; they just need help evaluating implementation. Suggest `/brainstorm` instead.
- **No ambiguity**: Facts are clear AND options are obvious. No skill needed.
- **Single-layer decisions**: Pure research question (no options to evaluate) or pure design question (no facts needed). Route to the specific skill instead.

## Example Routing Decisions

**"Should we migrate from Library A to Library B?"**
→ Research-first: Gather compatibility, performance, maintenance status. Then brainstorm migration effort vs. benefit.

**"How should we structure the auth layer?"**
→ Brainstorm-first: Evaluate 3 architectures for trade-offs. Then research whether each has pitfalls.

**"Evaluate 5 message queue options for our use case"**
→ Parallel: Research throughput, latency, ops burden. Brainstorm fit with our constraints simultaneously.

**"Pick between REST, gRPC, or GraphQL"**
→ No-op: Suggest `/brainstorm` directly — user already knows these are the options.

## Important Notes

- **Lean on existing skills**: You orchestrate `/research` and `/brainstorm` — don't reimplement their logic. Call them fully and let them do their work.
- **Preserve granularity**: The detail sections of your report should be readable copies of what those skills produced. Don't paraphrase to death.
- **Sequential timing matters**: Don't parallelize when one skill's output should inform the other. Wait for research before brainstorming, or wait for initial options before researching.
- **Be honest about gaps**: If new constraints emerged that change the trade-offs, document them. The user will see this and can decide to re-evaluate.
- **Synthesis is not decision-making**: You're combining evidence and analysis, not adding your own opinion. Stay faithful to what the skills found.
