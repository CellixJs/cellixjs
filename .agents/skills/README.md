# CellixJS Agent Skills

This directory contains Agent Skills that provide AI agents with structured, project-specific context for CellixJS development. Skills follow the [Agent Skills specification](https://agentskills.io/specification) and are compatible with GitHub Copilot, Claude, Cursor, and other AI coding assistants.

## What are Agent Skills?

Agent Skills are folders of instructions, scripts, and resources that AI agents can discover and use to perform tasks more accurately and efficiently. They provide:

- **Domain Expertise**: Package specialized knowledge about CellixJS architecture and patterns
- **Procedural Knowledge**: Step-by-step workflows for common tasks (creating MADRs, validating compliance)
- **Reusable Context**: Structured information AI agents can load on-demand
- **Validation Tools**: Scripts to verify compliance with project conventions

## Directory Structure

```
.agents/skills/                      # Primary skills location (standard)
├── madr-enforcement/                # MADR compliance and enforcement
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

**Why two locations?**
- `.agents/skills/` is the standard location per agentskills.io specification
- `.github/skills/` is used by GitHub Copilot for skill discovery
- Symlinks avoid duplication while supporting both standards

## Available Skills

### MADR Enforcement

**Purpose:** Ensure compliance with MADR (Markdown Any Decision Records) per [ADR-0001](../apps/docs/docs/decisions/0001-madr-architecture-decisions.md)

**Use Cases:**
- Creating new architectural decision records
- Validating MADR format and structure
- Reviewing code changes for architectural decisions
- Enforcing MADR workflow (proposal → review → acceptance)

**Key Features:**
- Comprehensive MADR guidelines and templates
- Validation script for automated compliance checking
- Complete examples of well-structured MADRs
- Integration with existing ADR-0001 workflow

**Usage:**
```bash
# Validate a MADR file
node .agents/skills/madr-enforcement/scripts/validate-madr.js apps/docs/docs/decisions/0024-example.md

# AI agents automatically reference this skill when:
# - Creating new architectural decisions
# - Reviewing code changes
# - Identifying missing MADRs
```

**References:**
- [SKILL.md](.agents/skills/madr-enforcement/SKILL.md) - Complete skill documentation
- [EXAMPLES.md](.agents/skills/madr-enforcement/EXAMPLES.md) - MADR examples
- [ADR-0001](../apps/docs/docs/decisions/0001-madr-architecture-decisions.md) - MADR framework decision

## Integration with GitHub Copilot

Skills are integrated with GitHub Copilot through two mechanisms:

### 1. Agent Skills Format
Skills in `.agents/skills/` and `.github/skills/` are automatically discovered by GitHub Copilot and other AI agents that support the Agent Skills specification.

### 2. Copilot Instructions
Skills are referenced in `.github/instructions/` files:
- `.github/instructions/madr.instructions.md` - MADR compliance requirements

## Community Skills

The simnova/sharethrift project maintains additional skills that may be relevant:

**Available Skills:**
- **apollo-client** - Apollo Client 4.x best practices
- **apollo-server** - Apollo Server 4.x patterns
- **graphql-operations** - GraphQL query/mutation conventions
- **graphql-schema** - GraphQL schema design
- **turborepo** - Turborepo task orchestration (aligns with ADR-0019)
- **vercel-react-best-practices** - React 19 patterns
- **enterprise-architecture-patterns** - DDD, CQRS, Event Sourcing (aligns with ADR-0003)

**To explore:**
Visit [simnova/sharethrift/.agents/skills/](https://github.com/simnova/sharethrift/tree/main/.agents/skills)

## Creating New Skills

When creating a new skill for CellixJS:

### 1. Create Skill Directory

```bash
mkdir -p .agents/skills/my-skill/{scripts,references,assets}
```

### 2. Create SKILL.md

```markdown
---
name: my-skill
description: Brief description. Use when: (1) scenario 1, (2) scenario 2...
license: MIT
compatibility: Compatibility info
metadata:
  author: CellixJS Team
  version: "1.0"
allowed-tools: Bash(npm:*) Read Write Edit Glob Grep
---

# Skill Title

## When to Use This Skill

- Scenario 1
- Scenario 2

## Instructions

Detailed guidance, patterns, and examples...
```

### 3. Add Supporting Files

- **EXAMPLES.md** - Comprehensive examples (recommended)
- **scripts/** - Validation or automation scripts (optional)
- **references/** - Extended documentation (optional)
- **assets/** - Templates or configuration files (optional)

### 4. Create GitHub Copilot Symlink

```bash
ln -s ../../.agents/skills/my-skill .github/skills/my-skill
```

### 5. Document in MADR

Create an ADR documenting why the skill is needed and how it should be used.

## Skill Development Best Practices

### Content Guidelines

1. **Clear "When to Use"**: Explicitly state scenarios where skill applies
2. **Concrete Examples**: Provide code examples and complete workflows
3. **MADR Alignment**: Reference related ADRs (e.g., ADR-0003 for DDD patterns)
4. **Validation**: Include scripts or checklists for compliance verification
5. **Maintenance**: Keep skills synchronized with MADR updates

### Technical Guidelines

1. **YAML Frontmatter**: Always include complete metadata
2. **Markdown Format**: Use clear headings and structure
3. **Tool Permissions**: Specify allowed-tools appropriately
4. **Version Control**: Track skills alongside code in Git
5. **Testing**: Verify AI agents can discover and use the skill

## Validation

Ensure skills are working correctly:

### Manual Testing

1. **Ask AI agent about skill topic** - Does it reference the skill?
2. **Request code generation** - Does output align with skill guidance?
3. **Run validation scripts** - Do they execute successfully?

### Automated Validation

```bash
# Validate MADR files
node .agents/skills/madr-enforcement/scripts/validate-madr.js apps/docs/docs/decisions/*.md

# (Future) Validate skill format
# node scripts/validate-skill.js .agents/skills/my-skill/SKILL.md
```

## Architectural Decision

The adoption of Agent Skills framework for CellixJS is documented in:

**[ADR-0024: Agent Skills Integration](../apps/docs/docs/decisions/0024-madr-agent-skills.md)**

This decision covers:
- Why Agent Skills format was chosen
- How skills enforce MADR compliance
- Integration with community skills
- Future skill development plans

## Resources

### Agent Skills Ecosystem

- **[Agent Skills Home](https://agentskills.io/home)** - Overview and introduction
- **[Agent Skills Specification](https://agentskills.io/specification)** - Technical specification
- **[Agent Skills GitHub](https://github.com/agentskills/agentskills)** - Open standard repository
- **[Skills CLI](https://github.com/skills-sh/skills)** - Command-line tool for managing skills

### CellixJS Documentation

- **[ADR-0024: Agent Skills Integration](../apps/docs/docs/decisions/0024-madr-agent-skills.md)** - Decision to adopt Agent Skills
- **[ADR-0001: MADR Architecture Decisions](../apps/docs/docs/decisions/0001-madr-architecture-decisions.md)** - MADR framework
- **[Copilot Instructions](../.github/copilot-instructions.md)** - GitHub Copilot development guide

### Community Resources

- **[simnova/sharethrift](https://github.com/simnova/sharethrift)** - Community skills and examples
- **[sharethrift ADR-0024](https://github.com/simnova/sharethrift/blob/main/apps/docs/docs/decisions/0024-madr-agent-skills.md)** - Similar implementation

## Contributing

To contribute a new skill:

1. **Identify Need**: Does this skill fill a gap in AI agent knowledge?
2. **Check Existing**: Look for similar skills in community repositories
3. **Create Skill**: Follow creation guidelines above
4. **Document Decision**: Create ADR if introducing new pattern
5. **Test Thoroughly**: Verify AI agents can use the skill effectively
6. **Share Knowledge**: Consider contributing useful skills to simnova/sharethrift

## Questions?

- **Agent Skills Format**: See [agentskills.io/specification](https://agentskills.io/specification)
- **MADR Process**: See [ADR-0001](../apps/docs/docs/decisions/0001-madr-architecture-decisions.md)
- **CellixJS Patterns**: See [Copilot Instructions](../.github/copilot-instructions.md)
- **Community Skills**: See [simnova/sharethrift](https://github.com/simnova/sharethrift)
