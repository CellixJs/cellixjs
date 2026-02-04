---
name: madr-enforcement
description: >
  Guide for enforcing MADR (Markdown Any Decision Records) compliance in CellixJS development. 
  Use this skill when: (1) creating new architectural decisions, (2) reviewing code changes that 
  may require architectural decisions, (3) validating that development aligns with documented MADRs, 
  (4) ensuring ADR documentation consistency and completeness.
license: MIT
compatibility: Works with any MADR-based project following MADR 3.0.0 specification
metadata:
  author: CellixJS Team
  version: "1.0"
  repository: https://github.com/CellixJs/cellixjs
allowed-tools: Bash(npm:*) Bash(npx:*) Bash(pnpm:*) Read Write Edit Glob Grep
---

# MADR Enforcement Skill

This skill provides comprehensive guidance for maintaining and enforcing Markdown Any Decision Records (MADR) 
in the CellixJS project. It ensures architectural decisions are properly documented, discoverable, and followed 
throughout the development lifecycle.

## When to Use This Skill

Use this skill when:

- **Creating new features or components** that introduce architectural decisions
- **Reviewing pull requests** to verify alignment with existing MADRs
- **Making technology choices** (frameworks, libraries, patterns, infrastructure)
- **Refactoring existing code** that may impact architectural decisions
- **Documenting decisions** about domain-driven design, microservices, or infrastructure
- **Validating compliance** with established architectural patterns
- **Onboarding new team members** to understand project decisions

## MADR Overview

### What is MADR?

MADR (Markdown Any Decision Records) is a lightweight format for capturing architectural decisions. 
CellixJS follows [MADR 3.0.0 specification](https://adr.github.io/madr/) as documented in 
[ADR-0001](../../../apps/docs/docs/decisions/0001-madr-architecture-decisions.md).

### Why MADR?

- **Consistency**: Standardized format for all architectural decisions
- **Transparency**: Decisions and rationale are visible to all team members
- **Discoverability**: Easy to find and understand past decisions
- **Version Control**: Decisions tracked alongside code in Git
- **Collaboration**: Git-based review process for decision approval

## MADR Location and Structure

### File Location

All MADRs are stored in:
```
apps/docs/docs/decisions/
```

### Naming Convention

```
NNNN-title-with-dashes.md
```

Where:
- `NNNN` = Sequential 4-digit number (e.g., 0001, 0023, 0024)
- `title-with-dashes` = Lowercase, hyphen-separated title

**Examples:**
- `0001-madr-architecture-decisions.md`
- `0003-domain-driven-design.md`
- `0022-snyk-security-integration.md`

### MADR File Structure

Every MADR must include:

1. **YAML Frontmatter** (required)
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

2. **Title** (H1 heading)
   ```markdown
   # Use [Technology/Pattern] for [Purpose]
   ```

3. **Context and Problem Statement**
   - Describe the problem in 2-3 sentences
   - Explain why a decision is needed

4. **Decision Drivers**
   - List key factors influencing the decision
   - Forces, concerns, requirements

5. **Considered Options**
   - List all alternatives evaluated
   - Minimum 2 options (including "do nothing")

6. **Decision Outcome**
   - State the chosen option
   - Provide clear justification

7. **Pros and Cons of Options**
   - Detailed analysis of each option
   - Good/Neutral/Bad aspects

8. **More Information** (optional)
   - Links, references, validation criteria
   - Implementation notes

## Existing MADRs in CellixJS

The following architectural decisions are documented and must be followed:

### Infrastructure & DevOps
- **0001**: MADR Architecture Decisions
- **0002**: OpenTelemetry for observability
- **0011**: Bicep for Infrastructure as Code
- **0014**: Azure Infrastructure Deployments
- **0018**: Docusaurus Azure Pipeline Stages
- **0020**: Azure DevOps Monorepo Pipeline
- **0021**: Bicep Resource Scoping Strategy

### Code Quality & Security
- **0012**: Biome for linting
- **0013**: Test suite architecture
- **0015**: SonarCloud integration
- **0016**: SonarCloud code duplication checks
- **0022**: Snyk security integration

### Architecture & Design
- **0003**: Domain-Driven Design (DDD)
- **0004**: Identity and Access Management
- **0005**: Authorization patterns
- **0019**: MonoRepo and Turborepo

### Technology Choices
- **0006**: Maps integration
- **0007**: SerenityJS for testing
- **0008**: White-label architecture
- **0009**: Cache purging strategy
- **0010**: React Router loaders
- **0017**: Chrome content overrides
- **0023**: TsGo migration

## MADR Enforcement Rules

### Rule 1: When to Create a New MADR

Create a new MADR when making decisions about:

✅ **Required MADR Scenarios:**
- Adopting new frameworks or libraries
- Changing architectural patterns (DDD, CQRS, Event Sourcing)
- Selecting infrastructure technologies (databases, message queues, caching)
- Modifying build/deployment pipelines
- Changing code quality tools (linters, formatters, test frameworks)
- Introducing new security practices or tools
- Altering authentication/authorization mechanisms
- Restructuring monorepo or package organization
- Selecting new UI component libraries or state management
- Changing API design patterns (REST, GraphQL, gRPC)

❌ **Does NOT Require MADR:**
- Bug fixes
- Refactoring without architectural impact
- Documentation updates (unless changing documentation strategy)
- Minor dependency updates
- UI styling changes
- Performance optimizations (unless requiring architectural change)

### Rule 2: MADR Status Lifecycle

1. **proposed** - Initial state, under review
2. **accepted** - Decision approved by deciders
3. **rejected** - Alternative not chosen (optional to document)
4. **deprecated** - No longer recommended, but not superseded
5. **superseded by [ADR-NNNN]** - Replaced by newer decision

### Rule 3: Required Reviewers

All MADRs must include:
- **Deciders**: People who approve the decision (required reviewers in PR)
- **EM and patrick**: Must be listed as deciders or informed
- **Consulted**: Subject matter experts who provided input
- **Informed**: Stakeholders who need to know about the decision

### Rule 4: Template Selection

Choose the appropriate template:

- **Full Template**: `apps/docs/docs/decisions/adr-template.md`
  - Use for complex decisions
  - Multiple options with detailed analysis
  - Significant architectural impact

- **Short Template**: `apps/docs/docs/decisions/adr-short-template.md`
  - Use for simpler decisions
  - Fewer options
  - Clear winner among alternatives

## MADR Creation Workflow

### Step 1: Check for Existing PRs

Before creating a new MADR:
```bash
# Check for open PRs to ensure correct sequence number
gh pr list --repo CellixJs/cellixjs --state open --search "ADR"
```

### Step 2: Copy Template

```bash
# Navigate to decisions directory
cd apps/docs/docs/decisions/

# Determine next number (check highest existing)
ls -1 | grep -E '^[0-9]{4}' | sort | tail -1

# Copy appropriate template
cp adr-template.md 0024-your-decision-title.md
# or
cp adr-short-template.md 0024-your-decision-title.md
```

### Step 3: Fill Out MADR

1. Update YAML frontmatter:
   - Set `status: proposed`
   - Add yourself as `contact`
   - List `deciders` (include EM and patrick)
   - Set current date
   - Add appropriate `sidebar_position` and `sidebar_label`

2. Write clear problem statement

3. List decision drivers

4. Document all considered options

5. State decision outcome with justification

6. Provide pros/cons analysis

7. Add validation criteria and references

### Step 4: Create Pull Request

```bash
# Stage and commit
git add apps/docs/docs/decisions/0024-your-decision-title.md
git commit -m "docs: Add ADR-0024 for [decision topic]"

# Create PR with deciders as required reviewers
gh pr create \
  --title "ADR-0024: [Decision Title]" \
  --body "Proposes [brief description]. Deciders: @user1 @user2" \
  --reviewer user1,user2
```

### Step 5: Review and Approval

1. Deciders must be listed as required reviewers
2. PR approval = decision approval
3. Update `status: accepted` and `date` before merging
4. Merge PR to main branch

### Step 6: Communicate Decision

- Inform all stakeholders listed in MADR
- Update relevant documentation
- Create implementation tasks if needed

## MADR Validation Checklist

Use this checklist when reviewing MADRs:

### Format Validation
- [ ] Correct filename format: `NNNN-title-with-dashes.md`
- [ ] Sequential number (no gaps or duplicates)
- [ ] YAML frontmatter present and complete
- [ ] All required sections included
- [ ] Proper markdown formatting

### Content Validation
- [ ] Problem statement is clear and concise
- [ ] Decision drivers are listed
- [ ] At least 2 options considered
- [ ] Decision outcome explicitly stated
- [ ] Justification is clear and compelling
- [ ] Pros/cons documented for each option
- [ ] Validation criteria included (if applicable)

### Process Validation
- [ ] Status starts as `proposed`
- [ ] Deciders include EM and patrick (or informed)
- [ ] Contact person identified
- [ ] Current date in frontmatter
- [ ] PR created with deciders as required reviewers
- [ ] Status updated to `accepted` before merge
- [ ] Date updated when status changes

### Compliance Validation
- [ ] No conflicts with existing MADRs
- [ ] Aligns with established patterns (DDD, Biome, etc.)
- [ ] References related ADRs where applicable
- [ ] Includes migration/implementation plan if needed

## Code Review MADR Enforcement

When reviewing code changes, check for MADR compliance:

### Identifying MADR-Required Changes

Look for changes that introduce:
- New dependencies or libraries
- New architectural patterns
- Infrastructure modifications
- Security/authentication changes
- New testing frameworks
- Build/deployment changes

### Enforcement Actions

If code changes require MADR documentation:

1. **Comment on PR:**
   ```
   This change introduces [new pattern/technology]. Per ADR-0001, 
   this requires an architectural decision record. Please create 
   a new MADR following the process in apps/docs/docs/decisions/adr-template.md
   ```

2. **Block merge** until MADR is created and approved

3. **Link to relevant MADRs** if decision already documented

### Verifying MADR Alignment

For changes claiming to follow existing MADRs:

1. **Identify referenced MADR**
   ```bash
   # Search for MADR mentions in PR
   grep -r "ADR-[0-9]" .
   ```

2. **Verify implementation matches MADR**
   - Check that chosen option is implemented
   - Ensure best practices from MADR are followed
   - Validate that constraints are respected

3. **Check for deviations**
   - If implementation differs from MADR, require explanation
   - Consider if deviation warrants MADR update or superseding

## MADR Search and Discovery

### Finding Relevant MADRs

```bash
# Search by topic
grep -r "domain-driven" apps/docs/docs/decisions/

# List all MADRs
ls -1 apps/docs/docs/decisions/*.md | grep -E '^[0-9]{4}'

# Search by status
grep -l "status: accepted" apps/docs/docs/decisions/*.md

# Find superseded decisions
grep -l "superseded by" apps/docs/docs/decisions/*.md
```

### MADR Index

Current MADRs cover these domains:
- **Architecture**: DDD, Monorepo, Event patterns
- **Infrastructure**: Azure, Bicep, Pipelines
- **Quality**: Testing, Linting, SonarCloud, Snyk
- **Technology**: React, GraphQL, OpenTelemetry, Maps
- **Security**: Identity, Authorization, Snyk

## Common MADR Anti-Patterns

### Anti-Pattern 1: Vague Problem Statement
❌ **Bad:**
> "We need to decide on a database."

✅ **Good:**
> "Our current MongoDB setup struggles with complex relational queries needed for the billing 
> domain. Query performance degrades with >10K users, and we lack ACID guarantees for financial 
> transactions."

### Anti-Pattern 2: Single Option
❌ **Bad:**
> Considered Options:
> - Use PostgreSQL

✅ **Good:**
> Considered Options:
> - PostgreSQL with Prisma ORM
> - Keep MongoDB and optimize queries
> - Hybrid: PostgreSQL for billing, MongoDB for other domains

### Anti-Pattern 3: Missing Justification
❌ **Bad:**
> Decision Outcome: Use React Query

✅ **Good:**
> Decision Outcome: Use React Query because it provides built-in caching, automatic refetching, 
> and optimistic updates, reducing boilerplate by ~40% compared to manual state management. 
> Aligns with ADR-0003 (DDD) by separating data fetching from domain logic.

### Anti-Pattern 4: No Validation Criteria
❌ **Bad:**
> (No validation section)

✅ **Good:**
> Validation:
> - Code review checks for proper error boundaries
> - 80% test coverage for data fetching logic
> - Performance testing shows <100ms query response times
> - ArchUnit tests verify separation of concerns

### Anti-Pattern 5: Forgetting to Update Status
❌ **Bad:**
> Status remains `proposed` after merge

✅ **Good:**
> Update status to `accepted` and date to merge date before merging PR

## Integration with Other Tools

### Biome Linting (ADR-0012)
MADRs should reference Biome patterns when relevant:
```markdown
This decision aligns with ADR-0012 (Biome linting) by using standard 
TypeScript patterns that Biome can validate.
```

### Domain-Driven Design (ADR-0003)
When making DDD-related decisions:
```markdown
Per ADR-0003 (Domain-Driven Design), this bounded context follows 
the aggregate pattern with the User entity as the aggregate root.
```

### Snyk Security (ADR-0022)
Security-related decisions should reference:
```markdown
Security scanning via Snyk (ADR-0022) will validate this implementation 
for known vulnerabilities.
```

## MADR Maintenance

### Reviewing Existing MADRs

Periodically review MADRs for:
- **Relevance**: Is this decision still applicable?
- **Accuracy**: Does code still follow this pattern?
- **Completeness**: Are validation criteria met?
- **Supersession**: Should this be replaced?

### Superseding MADRs

When replacing an existing MADR:

1. Create new MADR (e.g., ADR-0025)
2. Update old MADR status:
   ```yaml
   status: superseded by [ADR-0025](0025-new-decision.md)
   ```
3. In new MADR, reference the old one:
   ```markdown
   This decision supersedes [ADR-0015](0015-old-decision.md) because...
   ```

### Deprecating MADRs

If a decision is no longer recommended but not replaced:

```yaml
status: deprecated
```

Add note explaining why:
```markdown
## Deprecation Notice

This decision is deprecated as of 2024-12-15 due to [reason]. 
No replacement is required; the practice is no longer followed.
```

## References and Resources

### Internal Documentation
- [ADR-0001: MADR Architecture Decisions](../../../apps/docs/docs/decisions/0001-madr-architecture-decisions.md)
- [ADR Template](../../../apps/docs/docs/decisions/adr-template.md)
- [ADR Short Template](../../../apps/docs/docs/decisions/adr-short-template.md)
- [All ADRs](../../../apps/docs/docs/decisions/)

### External Resources
- [MADR Project](https://adr.github.io/madr/)
- [MADR 3.0.0 Specification](https://github.com/adr/madr)
- [Architectural Decision Records (adr.github.io)](https://adr.github.io/)
- [Microsoft Semantic Kernel ADRs](https://github.com/microsoft/semantic-kernel/tree/main/docs/decisions)

## Examples

See [EXAMPLES.md](./EXAMPLES.md) for complete MADR examples covering:
- Technology selection
- Pattern adoption
- Infrastructure decisions
- Tool selection
- Migration strategies
