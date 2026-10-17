# Codebase Understanding Phase

**When to skip:** If provided with scout reports, skip this phase.

## Core Activities

### Scout-First Strategy

**Primary approach:** Use `/scout:ext` (preferred) or `/scout` slash command
- Each scout locates files needed for specific task aspects
- Wait for all scout agents to report back before analysis
- Efficient for finding relevant code across large codebases

**Fallback (if scout unavailable):** Interactive LLM-driven exploration
1. Provide initial prompt to scan codebase structure
2. Ask user interactively for guidance:
   - "Which files, modules, or components are most critical for this feature?"
   - "Are there specific integration points I should focus on?"
   - "Which code patterns should I follow?"
3. User provides scoped guidance
4. Focus analysis on specified areas
5. Report findings and ask for clarification if needed

**Why interactive fallback works:**
- Users know their codebase best
- Avoids tool dependencies (works anywhere)
- Captures tacit knowledge ("the real logic is in middleware/")
- Prioritizes important patterns over exhaustive scanning

### Essential Documentation Review
ALWAYS read these files first:

1. **`./docs/development-rules.md`** (IMPORTANT)
   - File Name Conventions
   - File Size Management
   - Development rules and best practices
   - Code quality standards
   - Security guidelines

2. **`./docs/codebase-summary.md`**
   - Project structure and current status
   - High-level architecture overview
   - Component relationships

3. **`./docs/code-standards.md`**
   - Coding conventions and standards
   - Language-specific patterns
   - Naming conventions

4. **`./docs/design-guidelines.md`** (if exists)
   - Design system guidelines
   - Branding and UI/UX conventions
   - Component library usage

### Pattern Recognition
- Study existing patterns in codebase
- Identify conventions and architectural decisions
- Note consistency in implementation approaches
- Understand error handling patterns

### Integration Planning
- Identify how new features integrate with existing architecture
- Map dependencies between components
- Understand data flow and state management
- Consider backward compatibility

## Best Practices

- Start with documentation before diving into code
- Use scouts for targeted file discovery (when available)
- For fallback: ask focused questions, let user guide scope
- Document patterns found for consistency
- Note any inconsistencies or technical debt
- Consider impact on existing features
- Validate findings against development-rules.md
