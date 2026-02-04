---
applyTo: "**"
description: MADR (Markdown Any Decision Records) Compliance and Enforcement
---

# MADR Compliance Requirements

## When to Create a MADR

**REQUIRED** - Create a new MADR when making architectural decisions about:

- Adopting new frameworks, libraries, or significant dependencies
- Changing architectural patterns (DDD, CQRS, Event Sourcing, etc.)
- Selecting or changing infrastructure technologies (databases, message queues, caching, cloud services)
- Modifying build, test, or deployment pipelines
- Changing code quality tools (linters, formatters, test frameworks, security scanners)
- Introducing new security practices, authentication, or authorization mechanisms
- Restructuring monorepo or package organization
- Selecting UI component libraries or state management solutions
- Changing API design patterns (REST, GraphQL, gRPC)
- Adopting new development patterns or best practices

**NOT REQUIRED** for:
- Bug fixes
- Refactoring without architectural impact
- Documentation updates (unless changing documentation strategy)
- Minor dependency updates
- UI styling changes
- Performance optimizations (unless requiring architectural change)

## MADR File Structure

### Location
All MADRs must be placed in:
```
apps/docs/docs/decisions/
```

### Naming Convention
```
NNNN-title-with-dashes.md
```
- NNNN = Sequential 4-digit number (check existing files for next number)
- title-with-dashes = lowercase, hyphen-separated

### Required Frontmatter
```yaml
---
sidebar_position: <number>
sidebar_label: <NNNN Title>
description: "Brief description"
status: proposed | rejected | accepted | deprecated | superseded by [ADR-NNNN]
contact: <person proposing>
date: YYYY-MM-DD
deciders: <list of approvers>
consulted: <list of consultants>
informed: <list of stakeholders>
---
```

### Required Sections
1. **Title** (H1) - Clear statement of decision
2. **Context and Problem Statement** - What problem are we solving?
3. **Decision Drivers** - What factors influence this decision?
4. **Considered Options** - List at least 2 alternatives
5. **Decision Outcome** - Which option was chosen and why?
6. **Pros and Cons of the Options** - Detailed analysis

### Recommended Sections
- **Validation** - How will compliance be verified?
- **More Information** - References, migration plans, related ADRs

## MADR Workflow

### Creating a MADR

1. Check for next available number:
   ```bash
   ls apps/docs/docs/decisions/ | grep -E '^[0-9]{4}' | sort | tail -1
   ```

2. Copy appropriate template:
   ```bash
   # Full template (complex decisions)
   cp apps/docs/docs/decisions/adr-template.md apps/docs/docs/decisions/0024-your-title.md
   
   # Short template (simple decisions)
   cp apps/docs/docs/decisions/adr-short-template.md apps/docs/docs/decisions/0024-your-title.md
   ```

3. Fill out all required sections

4. Set status to `proposed`

5. List deciders (must include EM and patrick)

6. Create PR with deciders as required reviewers

7. Update status to `accepted` and date before merging

### Validating a MADR

Use the validation script:
```bash
node .agents/skills/madr-enforcement/scripts/validate-madr.js apps/docs/docs/decisions/0024-your-title.md
```

## Code Review MADR Enforcement

When reviewing code changes:

1. **Check for architectural impact** - Does this introduce new patterns, libraries, or infrastructure?

2. **Verify MADR exists** - If architectural change, ensure corresponding MADR is created/referenced

3. **Validate compliance** - If MADR referenced, verify implementation follows documented decision

4. **Request MADR if missing** - Comment on PR:
   ```
   This change introduces [pattern/technology]. Per ADR-0001, this requires an 
   architectural decision record. Please create a MADR following the template at 
   apps/docs/docs/decisions/adr-template.md
   ```

## Existing MADRs to Reference

Key architectural decisions already documented:

### Architecture & Patterns
- **ADR-0001**: MADR for architectural decisions
- **ADR-0003**: Domain-Driven Design (DDD)
- **ADR-0019**: MonoRepo and Turborepo

### Infrastructure & DevOps
- **ADR-0002**: OpenTelemetry for observability
- **ADR-0011**: Bicep for Infrastructure as Code
- **ADR-0014**: Azure Infrastructure Deployments
- **ADR-0020**: Azure DevOps Monorepo Pipeline
- **ADR-0021**: Bicep Resource Scoping Strategy

### Code Quality & Security
- **ADR-0012**: Biome for linting
- **ADR-0013**: Test suite architecture
- **ADR-0015**: SonarCloud integration
- **ADR-0016**: SonarCloud code duplication checks
- **ADR-0022**: Snyk security integration

### Technology & Tools
- **ADR-0004**: Identity and Access Management
- **ADR-0005**: Authorization patterns
- **ADR-0006**: Maps integration
- **ADR-0007**: SerenityJS for testing
- **ADR-0010**: React Router loaders
- **ADR-0023**: TsGo migration

## MADR Best Practices

### Problem Statement
- Be specific and measurable
- Include quantitative impact when possible
- Explain why decision is needed now

### Options Analysis
- List at least 2 options (including status quo or "do nothing")
- Provide honest pros and cons
- Include concrete examples or code snippets
- Reference related ADRs for alignment

### Decision Justification
- Clearly state chosen option
- Explain why this option was selected
- Quantify benefits when possible
- Address major concerns

### Validation Criteria
- Define measurable success criteria
- Include code review checkpoints
- Specify automated validation (tests, linters, ArchUnit)
- Set timelines for validation

## Agent Skills Integration

This MADR enforcement skill is part of the CellixJS Agent Skills framework:

- **Skill Location**: `.agents/skills/madr-enforcement/`
- **GitHub Integration**: `.github/skills/madr-enforcement` (symlink)
- **Validation Script**: `.agents/skills/madr-enforcement/scripts/validate-madr.js`
- **Templates**: `.agents/skills/madr-enforcement/assets/`
- **Examples**: `.agents/skills/madr-enforcement/EXAMPLES.md`

## References

- [MADR Project](https://adr.github.io/madr/)
- [ADR-0001: MADR Architecture Decisions](../../apps/docs/docs/decisions/0001-madr-architecture-decisions.md)
- [MADR Enforcement Skill](../.agents/skills/madr-enforcement/SKILL.md)
- [Agent Skills Specification](https://agentskills.io/specification)
