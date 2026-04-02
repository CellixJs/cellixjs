# CellixJS Agent Skills

This directory contains Agent Skills that provide AI agents with structured, project-specific context for CellixJS development. Skills follow the [Agent Skills specification](https://agentskills.io/specification) and are compatible with GitHub Copilot, Claude, Cursor, and other AI coding assistants.

## What are Agent Skills?

Agent Skills are folders of instructions and resources that AI agents can discover and use to perform tasks more accurately and efficiently. They provide:

- **Domain Expertise**: Specialized knowledge about CellixJS architecture and patterns
- **Enforcement Guidance**: How to apply documented architectural decisions in code
- **Reusable Context**: Structured information AI agents can load on-demand
- **Best Practices**: Examples and anti-patterns for common scenarios

## Directory Structure

CellixJS skills follow the same structure as community skills in [simnova/sharethrift](https://github.com/simnova/sharethrift/.agents/skills), aligning with the agentskills.io specification:

```
.agents/skills/                      # Primary skills location (agentskills.io standard)
├── cellix-tdd/                      # Consumer-first TDD workflow for @cellix packages
│   ├── SKILL.md                    # Main workflow and rules
│   ├── rubric.md                   # Artifact scoring rubric
│   ├── references/                 # Manifest/docs guidance
│   ├── fixtures/                   # Evaluation scenarios
│   └── evaluator/                  # Rubric-based checker
├── madr-enforcement/                # Enforces ADR standards in code
│   ├── SKILL.md                    # Main skill instructions (required)
│   ├── EXAMPLES.md                 # Comprehensive code examples (recommended)
│   └── assets/                     # Additional resources (optional)
│       ├── adr-template.md         # Full MADR template
│       └── adr-short-template.md   # Short MADR template
└── (future skills)/                # Additional skills as needed

.github/skills/                      # Symlinks for GitHub Copilot
├── cellix-tdd -> ../../.agents/skills/cellix-tdd
└── madr-enforcement -> ../../.agents/skills/madr-enforcement
```

**Structure Pattern (aligned with sharethrift community skills):**
- `SKILL.md` - Main instructions with YAML frontmatter (required for all skills)
- `EXAMPLES.md` - Detailed code examples and patterns (recommended, following sharethrift pattern)
- `assets/` or `references/` - Supporting materials like templates or extended docs (optional)
- Skills can have additional subdirectories as needed (e.g., `command/` for CLI tools)

**Why two locations?**
- `.agents/skills/` is the standard location per agentskills.io specification
- `.github/skills/` provides symlinks for GitHub Copilot discovery
- This dual approach is also used in simnova/sharethrift

## Available Skills

### Cellix TDD

**Purpose:** Drive consumer-first, TDD-based development for `@cellix/*` framework packages while keeping `manifest.md`, `README.md`, TSDoc, tests, and release hardening aligned.

**Use Cases:**
- Adding or changing public behavior in an existing `@cellix/*` package
- Refactoring internals while preserving the public contract
- Starting a new `@cellix/*` package from consumer usage first
- Repairing drift between package docs and the shipped API
- Narrowing leaky or overbroad public exports before release

**What This Skill Does:**
- Requires discovery of consumer usage and package intent before implementation
- Forces public-contract-first testing instead of internal helper testing
- Requires `manifest.md`, consumer-facing `README.md`, and public-export TSDoc alignment
- Adds release-hardening and validation expectations to package work
- Ships fixtures plus an evaluator for rubric-based artifact scoring

**What This Skill Does NOT Do:**
- ❌ Does NOT treat tests as a post-implementation cleanup step
- ❌ Does NOT allow deep-import testing of internals
- ❌ Does NOT treat `README.md` as maintainer-only design notes
- ✅ DOES bias toward minimal, intentional public APIs

**Key Features:**
- Required workflow sections for package maturity work summaries
- Manifest and documentation templates captured inside the skill
- Mixed pass/fail fixtures covering the expected edge cases
- A standalone evaluator for public-contract and docs-alignment checks

**References:**
- [SKILL.md](cellix-tdd/SKILL.md) - Workflow, rules, and output structure
- [rubric.md](cellix-tdd/rubric.md) - Artifact scoring rubric
- [fixtures/README.md](cellix-tdd/fixtures/README.md) - Included scenario coverage

**Verification Commands:**
- `pnpm run test:skill:cellix-tdd` - run the fixture regression suite
- `pnpm run skill:cellix-tdd:check -- --package <pkg>` - scaffold the summary if needed, then evaluate it

### MADR Enforcement

**Purpose:** Ensure code adheres to architectural standards defined in MADRs (ADR-0003, ADR-0012, ADR-0013, ADR-0022, etc.)

**Use Cases:**
- Writing new code that follows documented architectural patterns
- Reviewing code for compliance with ADR standards
- Refactoring to align with current architectural decisions
- Identifying when new ADRs are needed

**What This Skill Does:**
- Enforces Domain-Driven Design patterns (ADR-0003) in code
- Ensures Biome linting is used (ADR-0012), not ESLint/Prettier
- Verifies Vitest testing framework (ADR-0013), not Jest
- Requires Snyk security scanning (ADR-0022) before commits
- Validates Turborepo usage (ADR-0019) for builds
- Checks Bicep usage (ADR-0011) for infrastructure

**What This Skill Does NOT Do:**
- ❌ Does NOT validate MADR document format/structure
- ❌ Does NOT check MADR frontmatter or markdown syntax
- ✅ DOES enforce the standards documented IN the MADRs

**Key Features:**
- Comprehensive ADR index with enforcement guidelines
- Code examples showing correct and incorrect implementations
- Common violation patterns and how to fix them
- Review checklists organized by ADR

**References:**
- [SKILL.md](madr-enforcement/SKILL.md) - Complete enforcement documentation
- [EXAMPLES.md](madr-enforcement/EXAMPLES.md) - Code examples following ADRs
- [All ADRs](../../apps/docs/docs/decisions/) - Source of architectural standards

## Integration with GitHub Copilot

Skills are integrated with GitHub Copilot through two mechanisms:

### 1. Agent Skills Format
Skills in `.agents/skills/` and `.github/skills/` are automatically discovered by GitHub Copilot and other AI agents that support the Agent Skills specification.

### 2. Copilot Instructions
Skills are referenced in `.github/instructions/` files:
- `.github/instructions/madr.instructions.md` - MADR enforcement in code

Some skills, such as `cellix-tdd`, are intentionally discoverable through `.agents/skills/` and `.github/skills/` only so they stay on-demand instead of adding always-on instructions to unrelated tasks.

## Community Skills from ShareThrift

The [simnova/sharethrift](https://github.com/simnova/sharethrift) repository maintains a collection of community skills that our madr-enforcement skill aligns with structurally. ShareThrift skills follow the same agentskills.io specification and provide excellent examples of skill organization.

**ShareThrift Community Skills:**

| Skill | Source | Purpose | Structure |
|-------|--------|---------|-----------|
| **apollo-client** | [apollographql/skills](https://github.com/apollographql/skills) | Apollo Client 4.x patterns | SKILL.md + references/ |
| **apollo-server** | [apollographql/skills](https://github.com/apollographql/skills) | Apollo Server 4.x patterns | SKILL.md + references/ |
| **graphql-operations** | [apollographql/skills](https://github.com/apollographql/skills) | GraphQL query/mutation patterns | SKILL.md + references/ |
| **graphql-schema** | [apollographql/skills](https://github.com/apollographql/skills) | GraphQL schema design | SKILL.md + references/ |
| **turborepo** | [vercel/turborepo](https://github.com/vercel/turborepo) | Turborepo orchestration (aligns with ADR-0019) | SKILL.md + command/ + references/ |
| **vercel-react-best-practices** | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | React 19 patterns | SKILL.md + references/ |
| **enterprise-architecture-patterns** | Community | DDD, CQRS, Event Sourcing (aligns with ADR-0003) | SKILL.md + EXAMPLES.md |

**Structure Patterns Observed:**
- **SKILL.md** - Always present, contains main instructions with YAML frontmatter
- **EXAMPLES.md** - Used for comprehensive code examples (enterprise-architecture-patterns, madr-enforcement)
- **references/** - Directory for extended documentation organized by topic (apollo-client, turborepo)
- **command/** - Directory for CLI-related skills (turborepo)
- Flexibility in organization while maintaining discoverability

**Our Alignment:**
The madr-enforcement skill follows the **SKILL.md + EXAMPLES.md + assets/** pattern, similar to:
- `enterprise-architecture-patterns` (SKILL.md + EXAMPLES.md for comprehensive examples)
- While other skills use `references/` for extended docs, we use `assets/` for MADR templates

**To explore ShareThrift skills:**
Visit [simnova/sharethrift/.agents/skills/](https://github.com/simnova/sharethrift/tree/main/.agents/skills)

## Creating New Skills

When creating a new skill for CellixJS, follow the structure patterns from sharethrift community skills:

### 1. Choose Your Structure Pattern

Based on sharethrift community skills, choose the appropriate pattern:

**Pattern A: SKILL.md + EXAMPLES.md** (for skills with extensive code examples)
```
my-skill/
├── SKILL.md        # Main instructions with YAML frontmatter
├── EXAMPLES.md     # Comprehensive code examples
└── assets/         # Templates or resources (optional)
```
*Use for:* Code enforcement, pattern guidance (like madr-enforcement, enterprise-architecture-patterns)

**Pattern B: SKILL.md + references/** (for skills with topical documentation)
```
my-skill/
├── SKILL.md        # Main instructions with YAML frontmatter
└── references/     # Extended documentation organized by topic
    ├── setup.md
    ├── patterns.md
    └── troubleshooting.md
```
*Use for:* Framework integrations, API usage (like apollo-client, graphql-operations)

**Pattern C: SKILL.md + command/** (for CLI-focused skills)
```
my-skill/
├── SKILL.md        # Main instructions with YAML frontmatter
├── command/        # CLI command documentation
└── references/     # Additional docs (optional)
```
*Use for:* Build tools, CLI utilities (like turborepo)

### 2. Create Skill Directory

```bash
mkdir -p .agents/skills/my-skill/{references,assets}
# or choose the structure that fits your need
```

### 3. Create SKILL.md (Required)

All skills must have a SKILL.md file following agentskills.io specification:

```markdown
---
name: my-skill
description: >
  Brief description. Use when: (1) scenario 1, (2) scenario 2...
license: MIT
compatibility: Compatibility info
metadata:
  author: CellixJS Team
  version: "1.0"
  repository: https://github.com/CellixJs/cellixjs
allowed-tools: Bash(npm:*) Read Write Edit Glob Grep
---

# Skill Title

## When to Use This Skill

- Scenario 1
- Scenario 2

## Instructions

Detailed guidance, patterns, and examples...
```

### 4. Add Supporting Files (Based on Pattern)

**For Pattern A (SKILL.md + EXAMPLES.md):**
- **EXAMPLES.md** - Comprehensive code examples with correct/incorrect implementations
- **assets/** - Templates, configuration files, or other resources

**For Pattern B (SKILL.md + references/):**
- Create markdown files in `references/` organized by topic
- Each reference file covers a specific aspect of the skill

**For Pattern C (SKILL.md + command/):**
- Document CLI commands and usage patterns
- Include command-specific examples

### 5. Create GitHub Copilot Symlink

```bash
ln -s ../../.agents/skills/my-skill .github/skills/my-skill
```

### 6. Document in MADR

Create an ADR documenting why the skill is needed, what it enforces, and how it aligns with existing patterns.

**Example References:**
- See [ADR-0024](../../apps/docs/docs/decisions/0024-madr-agent-skills.md) for how madr-enforcement skill was documented
- Review [sharethrift skills](https://github.com/simnova/sharethrift/tree/main/.agents/skills) for structural inspiration

## Skill Development Best Practices

### Content Guidelines

1. **Focus on Enforcement**: Show how to apply standards in code, not how to write documents
2. **Concrete Examples**: Provide correct and incorrect code examples
3. **MADR Alignment**: Reference specific ADRs being enforced
4. **Common Violations**: Include anti-patterns and how to fix them
5. **Maintenance**: Keep skills synchronized with MADR updates

### Technical Guidelines

1. **YAML Frontmatter**: Always include complete metadata
2. **Markdown Format**: Use clear headings and structure
3. **Tool Permissions**: Specify allowed-tools appropriately
4. **Version Control**: Track skills alongside code in Git
5. **Testing**: Verify AI agents can discover and use the skill

## Architectural Decision

The adoption of Agent Skills framework for CellixJS is documented in:

**[ADR-0024: Agent Skills Integration](../../apps/docs/docs/decisions/0024-madr-agent-skills.md)**

This decision covers:
- Why Agent Skills format was chosen
- How skills enforce standards defined in ADRs
- Integration with community skills
- Future skill development plans

## Resources

### Agent Skills Ecosystem

- **[Agent Skills Home](https://agentskills.io/home)** - Overview and introduction
- **[Agent Skills Specification](https://agentskills.io/specification)** - Technical specification
- **[Agent Skills GitHub](https://github.com/agentskills/agentskills)** - Open standard repository
- **[Skills CLI](https://github.com/skills-sh/skills)** - Command-line tool for managing skills

### CellixJS Documentation

- **[ADR-0024: Agent Skills Integration](../../apps/docs/docs/decisions/0024-madr-agent-skills.md)** - Decision to adopt Agent Skills
- **[ADR-0001: MADR Architecture Decisions](../../apps/docs/docs/decisions/0001-madr-architecture-decisions.md)** - MADR framework
- **[Copilot Instructions](../../.github/copilot-instructions.md)** - GitHub Copilot development guide

### Community Resources

- **[simnova/sharethrift](https://github.com/simnova/sharethrift)** - Community skills and examples
- **[sharethrift ADR-0024](https://github.com/simnova/sharethrift/blob/main/apps/docs/docs/decisions/0024-madr-agent-skills.md)** - Similar implementation

## Contributing

To contribute a new skill:

1. **Identify Need**: Does this skill enforce standards not covered by existing skills?
2. **Check Existing**: Look for similar skills in community repositories
3. **Create Skill**: Follow creation guidelines above
4. **Document Decision**: Create ADR if introducing new enforcement pattern
5. **Test Thoroughly**: Verify AI agents can use the skill effectively
6. **Share Knowledge**: Consider contributing useful skills to simnova/sharethrift

## Questions?

- **Agent Skills Format**: See [agentskills.io/specification](https://agentskills.io/specification)
- **ADRs and Standards**: See [apps/docs/docs/decisions/](../apps/docs/docs/decisions/)
- **CellixJS Patterns**: See [Copilot Instructions](../.github/copilot-instructions.md)
- **Community Skills**: See [simnova/sharethrift](https://github.com/simnova/sharethrift)
