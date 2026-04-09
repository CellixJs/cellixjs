# CellixJS Agent Skills

This directory contains Agent Skills that provide AI agents with structured, project-specific context for CellixJS development. Skills follow the [Agent Skills specification](https://agentskills.io/specification) and are compatible with GitHub Copilot, Claude, Cursor, and other AI coding assistants.

## What are Agent Skills?

Agent Skills are folders of instructions and resources that AI agents can discover and use to perform tasks more accurately and efficiently. They provide:

- **Domain Expertise**: Specialized knowledge about CellixJS architecture and patterns
- **Enforcement Guidance**: How to apply documented architectural decisions in code
- **Reusable Context**: Structured information AI agents can load on-demand
- **Best Practices**: Examples and anti-patterns for common scenarios

## Directory Structure

CellixJS skills follow the agentskills.io directory convention:

```
.agents/skills/                      # Primary skills location and source of truth
├── madr-enforcement/                # CellixJS-authored ADR enforcement skill
├── turborepo/                       # Community skill for Turborepo workflows
├── vitest/                          # Community skill for Vitest workflows
├── ant-design/                      # Community skill for Ant Design component guidance
├── antd/                            # Community skill for @ant-design/cli workflows
├── mongodb-connection/              # Community skill for MongoDB connection tuning
├── mongodb-mcp-setup/               # Community skill for MongoDB MCP configuration
├── mongodb-query-optimizer/         # Community skill for MongoDB query/index performance
├── mongodb-schema-design/           # Community skill for MongoDB schema modeling
└── turbo-graph-optimization/        # CellixJS-authored skill for Turborepo task graph optimization

.github/skills/                      # Symlinks for GitHub Copilot discovery
└── <skill-name> -> ../../.agents/skills/<skill-name>

skills-lock.json                     # Upstream source + hash metadata for installed community skills
.vscode/mcp.json                     # Workspace MongoDB MCP configuration for local development
```

**Structure Pattern:**
- `SKILL.md` - Main instructions with YAML frontmatter (required for all skills)
- `EXAMPLES.md` - Detailed code examples and patterns (optional)
- `assets/` or `references/` - Supporting materials like templates or extended docs (optional)
- Skills can have additional subdirectories as needed (e.g., `command/` for CLI tools)

**Why two locations?**
- `.agents/skills/` is the standard location per agentskills.io specification
- `.github/skills/` provides symlinks for GitHub Copilot discovery
- The `.github/skills/` entries are symlinks only, not duplicate copies of skill contents

**Managed skill set:**
- A skill is considered part of the managed repo skill set when it has a source directory in `.agents/skills/`, a matching symlink in `.github/skills/`, and if community-installed, an entry in `skills-lock.json`

## Available Skills

### CellixJS-Authored Skills

#### MADR Enforcement

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

### Turborepo Task Graph Optimization

**Purpose:** Autonomously analyze and optimize Turborepo task graphs to eliminate unnecessary transitive dependencies and improve build performance.

**Use Cases:**
- Build slowdown investigation (identifying task graph bloat)
- New package added pulling in unnecessary upstream tasks
- Periodic hygiene (quarterly/semi-annual reviews)
- Pre-release verification of build targets
- CI/CD optimization to reduce pipeline build time

**What This Skill Does:**
- Discovers build targets dynamically via `turbo query` (repo-agnostic)
- Analyzes transitive dependencies and identifies unnecessary tasks
- Proposes optimizations verified via static import analysis
- Applies safe changes and verifies build succeeds
- Flags unsafe changes (dynamic imports, runtime deps) for human review
- Generates before/after comparison tables with results

**Key Features:**
- Fully autonomous workflow (no user confirmation steps)
- Works with any Turborepo 2.9+ monorepo (not hardcoded to CellixJS)
- Safety verification through import analysis and build testing
- Formatted results with task type breakdown and percentages

**References:**
- [SKILL.md](turbo-graph-optimization/SKILL.md) - Complete skill documentation
- [ADR-0019: Monorepo Structure and Turborepo](../../apps/docs/docs/decisions/0019-monorepo-turborepo.md) - CellixJS context
- [ADR-0024: Agent Skills Framework](../../apps/docs/docs/decisions/0024-madr-agent-skills.md) - Skills framework

### Installed Community Skills

| Skill | Source | Why it is kept in this repo |
|-------|--------|-----------------------------|
| **turborepo** | [vercel/turborepo](https://github.com/vercel/turborepo) | Monorepo task graph, caching, pipeline, and workspace orchestration guidance aligned with ADR-0019 |
| **vitest** | [antfu/skills](https://github.com/antfu/skills) | Testing patterns, mocking, filtering, and coverage guidance aligned with the repo's Vitest test suite |
| **ant-design** | [ant-design/antd-skill](https://github.com/ant-design/antd-skill) | Ant Design component selection, theming, and UI guidance for repo UI work |
| **antd** | [ant-design/antd-skill](https://github.com/ant-design/antd-skill) | `@ant-design/cli` workflow guidance for offline API lookups, linting, and migrations |
| **mongodb-connection** | [mongodb/agent-skills](https://github.com/mongodb/agent-skills) | Connection and pool tuning guidance for the repo's Mongoose and Cosmos/local MongoDB connection setup |
| **mongodb-mcp-setup** | [mongodb/agent-skills](https://github.com/mongodb/agent-skills) | MongoDB MCP setup and troubleshooting guidance for the committed local MCP workflow in `.vscode/mcp.json` |
| **mongodb-query-optimizer** | [mongodb/agent-skills](https://github.com/mongodb/agent-skills) | Query and index performance guidance for repository and read-model work using MongoDB/Mongoose |
| **mongodb-schema-design** | [mongodb/agent-skills](https://github.com/mongodb/agent-skills) | Schema and modeling guidance for the repo's Mongoose model layer |
| **browser-testing-with-devtools** | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | Chrome DevTools MCP guidance for live browser testing: DOM inspection, console/network tracing, screenshots, and performance profiling |

**Intentionally excluded community MongoDB skills:**
- Atlas Stream Processing was not installed because the repo does not implement Atlas stream processing workflows
- Atlas Search / Vector Search guidance was not kept because the repo does not currently use Atlas Search or semantic/vector search workflows
- MongoDB natural-language query generation was removed because it is not a strong fit for routine code work in this repo

## Integration with GitHub Copilot

Skills are integrated with GitHub Copilot through two mechanisms:

### 1. Agent Skills Format
Skills in `.agents/skills/` and `.github/skills/` are automatically discovered by GitHub Copilot and other AI agents that support the Agent Skills specification.
For this repo, `.agents/skills/` remains the source of truth and `.github/skills/` mirrors the managed set through symlinks only. Can be extended for other AI providers in the future as needed.

### 2. Copilot Instructions
Skills are referenced in `.github/instructions/` files:
- `.github/instructions/madr.instructions.md` - MADR enforcement in code

## Community Skill Sources

The current community skills committed to this repo come from these upstream sources:

| Upstream source | Installed skills |
|----------------|------------------|
| [vercel/turborepo](https://github.com/vercel/turborepo) | `turborepo` |
| [antfu/skills](https://github.com/antfu/skills) | `vitest` |
| [ant-design/antd-skill](https://github.com/ant-design/antd-skill) | `ant-design`, `antd` |
| [mongodb/agent-skills](https://github.com/mongodb/agent-skills) | `mongodb-connection`, `mongodb-mcp-setup`, `mongodb-query-optimizer`, `mongodb-schema-design` |

The exact upstream hashes currently installed in the repo are tracked in [skills-lock.json](../../skills-lock.json).

## Creating New Skills

When creating a new skill for CellixJS, follow the patterns already present in this directory and the broader community skills ecosystem:

### 1. Choose Your Structure Pattern

Choose the structure pattern that best matches the skill you are adding:

**Pattern A: SKILL.md + EXAMPLES.md** (for skills with extensive code examples)
```
my-skill/
├── SKILL.md        # Main instructions with YAML frontmatter
├── EXAMPLES.md     # Comprehensive code examples
└── assets/         # Templates or resources (optional)
```
*Use for:* Code enforcement and pattern guidance (like madr-enforcement)

**Pattern B: SKILL.md + references/** (for skills with topical documentation)
```
my-skill/
├── SKILL.md        # Main instructions with YAML frontmatter
└── references/     # Extended documentation organized by topic
    ├── setup.md
    ├── patterns.md
    └── troubleshooting.md
```
*Use for:* Framework integrations, API usage (like mongodb-schema-design)

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
- See [ADR-0024](../../apps/docs/docs/decisions/0024-madr-agent-skills.md) for how the repo adopts Agent Skills
- Review the current local skills in this directory for structure examples
- Use the upstream sources recorded in [skills-lock.json](../../skills-lock.json) when evaluating additional community skills

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

- **[vercel/turborepo](https://github.com/vercel/turborepo)** - Source for the installed Turborepo skill
- **[antfu/skills](https://github.com/antfu/skills)** - Source for the installed Vitest skill
- **[ant-design/antd-skill](https://github.com/ant-design/antd-skill)** - Source for the installed Ant Design skills
- **[mongodb/agent-skills](https://github.com/mongodb/agent-skills)** - Source for the installed MongoDB skills

## Contributing

To contribute a new skill:

1. **Identify Need**: Does this skill enforce standards not covered by existing skills?
2. **Check Existing**: Look for similar skills in community repositories
3. **Create Skill**: Follow creation guidelines above
4. **Document Decision**: Create ADR if introducing new enforcement pattern
5. **Test Thoroughly**: Verify AI agents can use the skill effectively
6. **Share Knowledge**: Consider contributing useful skills upstream when appropriate

## Questions?

- **Agent Skills Format**: See [agentskills.io/specification](https://agentskills.io/specification)
- **ADRs and Standards**: See [apps/docs/docs/decisions/](../../apps/docs/docs/decisions/)
- **CellixJS Patterns**: See [Copilot Instructions](../../.github/copilot-instructions.md)
- **Community Skills**: See the upstream sources listed in [skills-lock.json](../../skills-lock.json)
