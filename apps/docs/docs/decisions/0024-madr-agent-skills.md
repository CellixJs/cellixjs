---
sidebar_position: 24
sidebar_label: 0024 Agent Skills Integration
description: "Adopt Agent Skills framework for AI-assisted development with structured context and MADR enforcement"
status: accepted
contact: github-copilot
date: 2026-02-04
deciders: patrick, development-team
consulted: simnova-sharethrift-team
informed: all-developers
---

# Adopt Agent Skills Framework for AI-Assisted Development

## Context and Problem Statement

AI coding assistants like GitHub Copilot provide general programming assistance but lack project-specific architectural context and patterns. As the CellixJS project grows in complexity with Domain-Driven Design (DDD) architecture, MADR documentation, and established best practices, we need to ensure AI agents understand and enforce our architectural decisions.

Agent Skills provide structured, discoverable context in a standardized format that AI agents can consume effectively. Following the [Agent Skills specification](https://agentskills.io/specification), we can package domain-specific knowledge into reusable instructions that guide AI agents to generate code aligned with our established patterns and decisions.

The primary challenge is ensuring that our MADR (Markdown Any Decision Records) guidelines, documented in ADR-0001, are actively enforced during development. Without structured guidance, AI agents may suggest code that violates documented architectural decisions, leading to inconsistency and technical debt.

## Decision Drivers

- **MADR Enforcement**: Ensure AI agents understand and enforce MADR compliance per ADR-0001
- **Architectural Consistency**: AI-generated code must align with DDD patterns (ADR-0003), Biome linting (ADR-0012), and other established decisions
- **Developer Experience**: Reduce cognitive load by providing AI agents with project-specific context
- **Discoverability**: Make architectural decisions and patterns easily accessible to AI agents
- **Maintainability**: Use industry-standard format that's portable across AI agent products
- **Community Integration**: Benefit from community-maintained skills and share our expertise
- **Version Control**: Track skills changes alongside code in Git

## Considered Options

1. **Agent Skills Framework** (agentskills.io standard format)
2. **GitHub Copilot Instructions Only** (continue current approach)
3. **Custom Documentation System** (build our own format)
4. **No Structured Context** (rely on inline comments and PR reviews)

## Decision Outcome

Chosen option: **Agent Skills Framework**, because it provides a standardized, portable format for packaging domain-specific knowledge that AI agents can consume. The framework enables MADR enforcement through structured validation scripts and clear guidelines, while allowing integration with community-maintained skills from projects like simnova/sharethrift.

This decision aligns with ADR-0001 (MADR for architectural decisions) by providing a mechanism to actively enforce MADR compliance during AI-assisted development.

### Consequences

**Good:**
- AI agents automatically enforce MADR compliance per ADR-0001
- Structured skills format is portable across GitHub Copilot, Claude, Cursor, and other AI tools
- Can leverage community-maintained skills from simnova/sharethrift and other repositories
- Skills serve as living documentation for both AI and human developers
- Validation scripts provide automated compliance checking
- Skills tracked in Git alongside code changes
- Progressive loading means AI agents only load relevant skills

**Bad:**
- Team must maintain skills directory and keep content updated
- Learning curve for creating new skills
- Skills must be kept synchronized with MADR updates
- Additional repository structure to maintain

## Validation

Implementation validated by:

1. **MADR Enforcement**: AI agents reference MADR enforcement skill when reviewing code
2. **Code Reviews**: AI agents identify missing MADRs for architectural changes
3. **Skill Validation**: Scripts verify MADR format compliance
4. **Developer Feedback**: Team reports AI suggestions align with established patterns
5. **Documentation**: Skills content is discoverable and comprehensive

## Pros and Cons of the Options

### Agent Skills Framework (agentskills.io)

Standardized format for packaging AI agent context and capabilities.

**Good:**
- Industry-standard format (originally developed by Anthropic, adopted by GitHub, Cursor, etc.)
- Portable across multiple AI agent products
- Progressive loading (only relevant skills loaded per task)
- Community ecosystem of shareable skills
- Clear specification and documentation at agentskills.io
- Folder-based structure is simple and Git-friendly
- Can integrate skills from simnova/sharethrift project
- Enables validation scripts and automated compliance checking
- Perfect for MADR enforcement per ADR-0001

**Neutral:**
- Requires following specific folder structure (SKILL.md, scripts/, references/, assets/)
- Skill metadata defined in YAML frontmatter

**Bad:**
- Relatively new standard (but rapidly gaining adoption)
- Team must learn skill authoring conventions
- Skills must be maintained and kept current

### GitHub Copilot Instructions Only

Continue using `.github/copilot-instructions.md` and `.github/instructions/` without Agent Skills.

**Good:**
- Current approach, team already familiar
- No new structure to learn
- Works with GitHub Copilot

**Neutral:**
- GitHub-specific format

**Bad:**
- Not portable to other AI agent products (Cursor, Claude, etc.)
- No standardized validation or enforcement mechanisms
- Difficult to organize complex domain knowledge
- Can't leverage community-maintained skills
- No progressive loading (all instructions loaded always)
- Lacks structure for scripts, references, and assets
- Harder to enforce MADR compliance systematically

### Custom Documentation System

Build our own format for AI agent context.

**Good:**
- Full control over format and structure
- Tailored to CellixJS specific needs

**Neutral:**
- Custom design decisions

**Bad:**
- Reinventing existing standard
- Not portable across AI products
- No community ecosystem
- Maintenance burden
- Must build own tooling for validation
- Team must learn proprietary format
- Doesn't benefit from agentskills.io ecosystem improvements

### No Structured Context

Rely on inline comments, PR reviews, and existing documentation.

**Good:**
- No additional structure required
- Minimal overhead

**Neutral:**
- Status quo approach

**Bad:**
- AI agents lack architectural context
- MADR enforcement is manual and error-prone
- Inconsistent AI suggestions
- Higher review burden on human developers
- Risk of violating ADR-0001, ADR-0003, and other established patterns
- No systematic validation
- Difficult for AI to discover relevant patterns

## Implementation Strategy

### 1. Skill Directory Structure

Following Agent Skills specification:

```
.agents/skills/                      # Primary skills location
├── madr-enforcement/                # MADR compliance skill
│   ├── SKILL.md                    # Main skill instructions
│   ├── EXAMPLES.md                 # Complete MADR examples
│   ├── scripts/                    # Validation scripts
│   │   └── validate-madr.js        # MADR format validator
│   └── assets/                     # Templates and resources
│       ├── adr-template.md         # Full MADR template
│       └── adr-short-template.md   # Short MADR template
└── (future skills)/                # Additional skills as needed

.github/skills/                      # Symlinks for GitHub Copilot
└── madr-enforcement -> ../../.agents/skills/madr-enforcement
```

**Rationale:**
- `.agents/skills/` = Primary location (standard location per agentskills.io)
- `.github/skills/` = Symlinks for GitHub Copilot compatibility
- Symlink approach avoids duplication while supporting both locations

### 2. MADR Enforcement Skill

**Purpose:** Ensure MADR compliance per ADR-0001

**Capabilities:**
- Identify when new MADRs are required
- Validate MADR file format and structure
- Enforce MADR review workflow
- Verify code alignment with documented MADRs
- Provide MADR templates and examples

**Validation Script:**
```bash
node .agents/skills/madr-enforcement/scripts/validate-madr.js <madr-file>
```

**Integration with GitHub Copilot:**
- Instructions file: `.github/instructions/madr.instructions.md`
- References MADR enforcement skill for detailed guidance

### 3. Community Skills Integration

Investigate and integrate relevant skills from simnova/sharethrift:

**Already Available:**
- **apollo-client**: Apollo Client 4.x best practices
- **apollo-server**: Apollo Server 4.x patterns
- **graphql-operations**: GraphQL query/mutation conventions
- **graphql-schema**: GraphQL schema design
- **turborepo**: Turborepo task orchestration (aligns with ADR-0019)
- **vercel-react-best-practices**: React 19 patterns
- **enterprise-architecture-patterns**: DDD, CQRS, Event Sourcing (aligns with ADR-0003)

**Installation Method:**
```bash
# Using Skills CLI (when available)
pnpm dlx skills add simnova/sharethrift --skill <skill-name>

# Manual installation (current approach)
# Copy relevant skills from sharethrift repository
```

### 4. Skill Authoring Guidelines

When creating new skills for CellixJS:

**Required Elements:**
1. `SKILL.md` with YAML frontmatter (name, description, license, compatibility)
2. Clear "When to Use This Skill" section
3. Detailed instructions and patterns
4. Code examples
5. References to related MADRs

**Optional Elements:**
- `EXAMPLES.md` for comprehensive examples
- `scripts/` for validation or automation
- `references/` for extended documentation
- `assets/` for templates or configuration files

### 5. Integration with Existing ADRs

Skills must align with and reinforce existing MADRs:

- **ADR-0001**: MADR enforcement skill validates MADR compliance
- **ADR-0003**: Future DDD skill will enforce bounded contexts and aggregate patterns
- **ADR-0012**: Biome linting patterns referenced in TypeScript skills
- **ADR-0019**: Turborepo skill from community reinforces monorepo patterns
- **ADR-0022**: Snyk security skill (already exists as `.github/instructions/snyk_cli.instructions.md`)

## Migration Plan

### Phase 1: MADR Enforcement Skill (Completed)
- ✅ Create `.agents/skills/madr-enforcement/` with SKILL.md
- ✅ Add MADR validation script
- ✅ Copy MADR templates to assets/
- ✅ Create comprehensive EXAMPLES.md
- ✅ Add `.github/instructions/madr.instructions.md`
- ✅ Create symlink in `.github/skills/`

### Phase 2: Community Skills Integration (Next)
- [ ] Research available skills in simnova/sharethrift
- [ ] Identify applicable skills (apollo-client, turborepo, enterprise-architecture-patterns)
- [ ] Install or adapt skills for CellixJS context
- [ ] Document integration in README

### Phase 3: Additional CellixJS Skills (Future)
- [ ] Create DDD skill for bounded contexts and aggregates (aligns with ADR-0003)
- [ ] Create Azure Functions skill for serverless patterns (aligns with ADR-0014)
- [ ] Create Biome skill for linting conventions (aligns with ADR-0012)
- [ ] Create Mongoose skill for data persistence patterns

### Phase 4: Continuous Improvement (Ongoing)
- [ ] Update skills as MADRs evolve
- [ ] Gather developer feedback on AI suggestions
- [ ] Contribute useful skills back to community
- [ ] Monitor agentskills.io for standard updates

## More Information

### Skill Format Specification

Agent Skills follow this structure:

```markdown
---
name: skill-name
description: Brief description. Use when: (1) scenario 1, (2) scenario 2...
license: MIT
compatibility: Framework/version compatibility
metadata:
  author: CellixJS Team
  version: "1.0"
allowed-tools: Bash(npm:*) Read Write Edit Glob Grep
---

# Skill Title

Detailed instructions, patterns, and examples...
```

### MADR Enforcement Workflow

1. **During Development**: AI agent references MADR enforcement skill
2. **Code Review**: AI identifies architectural changes requiring MADR
3. **MADR Creation**: Developer uses templates from skill assets
4. **Validation**: Run validation script before committing
5. **Approval**: MADR reviewed per ADR-0001 workflow
6. **Implementation**: Code aligned with approved MADR

### Related MADRs

- [ADR-0001: MADR Architecture Decisions](./0001-madr-architecture-decisions.md) - This skill enforces the MADR process defined here
- [ADR-0003: Domain-Driven Design](./0003-domain-driven-design.md) - Future DDD skill will reinforce these patterns
- [ADR-0012: Biome Linting](./0012-linter.md) - Skills can reference Biome patterns
- [ADR-0019: MonoRepo and Turborepo](./0019-monorepo-turborepo.md) - Community turborepo skill aligns with this
- [ADR-0022: Snyk Security](./0022-snyk-security-integration.md) - Existing snyk_cli.instructions.md can be enhanced with Agent Skills format

### External References

- [Agent Skills Home](https://agentskills.io/home)
- [Agent Skills Specification](https://agentskills.io/specification)
- [Agent Skills GitHub](https://github.com/agentskills/agentskills)
- [simnova/sharethrift Repository](https://github.com/simnova/sharethrift)
- [simnova/sharethrift ADR-0024](https://github.com/simnova/sharethrift/blob/main/apps/docs/docs/decisions/0024-madr-agent-skills.md)
- [Skills CLI](https://github.com/skills-sh/skills)

### Future Considerations

- **Skills CLI Integration**: Use `pnpm dlx skills` commands for managing community skills
- **Automated Validation**: Integrate validation scripts into pre-commit hooks
- **Skill Versioning**: Track skill versions alongside code versions
- **Cross-Repository Skills**: Share CellixJS skills with broader community
- **Lock File Support**: Monitor Skills CLI for lock file feature (similar to package-lock.json)
