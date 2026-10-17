# Plan Creation & Organization

## Directory Structure

### Plan Location
Save plans in `./plans` directory with timestamp and descriptive name.

**Format:** `plans/YYYYMMDD-HHmm-your-plan-name/`

**Example:** `plans/20260801-1430-feature-authentication-implementation/`

### File Organization

```
plans/
├── 20260801-1430-feature-authentication-implementation/
│   ├── research/
│   │   ├── researcher-01-auth-approaches-report.md
│   │   └── researcher-02-security-analysis.md
│   ├── reports/
│   │   ├── scout-report.md
│   │   └── synthesis-findings.md
│   ├── plan.md                           # Overview access point
│   ├── phase-01-setup-environment.md     # Environment setup
│   ├── phase-02-database-schema.md       # Database models
│   ├── phase-03-auth-service.md          # Authentication service
│   ├── phase-04-api-endpoints.md         # API endpoints
│   ├── phase-05-frontend-integration.md  # UI components
│   ├── phase-06-security-testing.md      # Security tests
│   └── phase-07-deployment.md            # Deployment steps
└── ...
```

## File Structure

### Overview Plan (plan.md)
- Keep generic and under 80 lines
- List each phase with status/progress
- Link to detailed phase files
- High-level timeline
- Key dependencies
- Quick reference for stakeholders

### Phase Files (phase-XX-name.md)
Fully respect the `./docs/development-rules.md` file.
Each phase file should contain:

**Context Links**
- Links to related reports, files, documentation

**Overview**
- Date and priority
- Current status
- Brief description

**Key Insights**
- Important findings from research
- Critical considerations

**Requirements**
- Functional requirements
- Non-functional requirements

**Architecture**
- System design
- Component interactions
- Data flow

**Related Code Files**
- List of files to modify
- List of files to create
- List of files to delete

**Implementation Steps**
- Detailed, numbered steps
- Specific instructions
- Code examples where helpful

**Todo List**
- Checkbox list for tracking

**Success Criteria**
- Definition of done
- Validation methods

**Risk Assessment**
- Potential issues
- Mitigation strategies

**Security Considerations**
- Auth/authorization
- Data protection

**Next Steps**
- Dependencies
- Follow-up tasks
