---
sidebar_position: 24
sidebar_label: 0024 Agent Skills Integration
description: "Adopt Agent Skills framework to enforce architectural standards defined in MADRs when writing, reviewing, or modifying code"
status: accepted
contact: github-copilot
date: 2026-02-04
deciders: patrick, development-team
consulted: simnova-sharethrift-team
informed: all-developers
---

# Adopt Agent Skills Framework to Enforce MADR Standards in Code

## Context and Problem Statement

CellixJS has documented 23+ architectural decisions in MADRs (Markdown Any Decision Records) covering Domain-Driven Design, linting standards, testing frameworks, security practices, and infrastructure choices. However, these documented standards are only enforced through manual code review, leading to inconsistent application of architectural patterns.

AI coding assistants like GitHub Copilot can generate code, but without structured context about our MADRs, they may suggest implementations that violate documented architectural decisions (e.g., using ESLint instead of Biome per ADR-0012, mixing domain and infrastructure code contrary to ADR-0003, or using Jest instead of Vitest contrary to ADR-0013).

We need a mechanism to provide AI agents with structured knowledge about our MADRs so they can automatically apply and enforce architectural standards when generating, reviewing, or modifying code.

## Decision Drivers

- **Consistent ADR Enforcement**: Ensure code adheres to architectural standards documented in MADRs
- **AI-Assisted Compliance**: Enable AI agents to understand and apply MADR guidelines automatically
- **Reduced Review Burden**: Catch ADR violations during code generation, not just during review
- **Developer Experience**: Provide clear guidance on applying ADR patterns in code
- **Discoverability**: Make architectural standards easily accessible to AI agents
- **Maintainability**: Use industry-standard format that's portable across AI agent products
- **Community Integration**: Benefit from community-maintained skills and share our expertise

## Considered Options

1. **Agent Skills Framework** (agentskills.io standard format) - Structured skill files
2. **GitHub Copilot Instructions Only** (continue current approach) - Markdown instructions
3. **Custom Documentation System** (build our own format) - Proprietary format
4. **Manual Code Review Only** (rely on human review) - No AI assistance

## Decision Outcome

Chosen option: **Agent Skills Framework**, because it provides a standardized, portable format for packaging ADR enforcement guidance that AI agents can consume. The framework enables:

1. **Code-Level Enforcement**: AI agents apply ADR standards when writing/reviewing code
2. **Portable Format**: Works across GitHub Copilot, Claude, Cursor, and other AI tools
3. **Structured Guidance**: Clear examples of correct/incorrect implementations per ADR
4. **Community Integration**: Can leverage and contribute to community skills

This decision aligns with ADR-0001 (MADR for architectural decisions) by providing a mechanism to **enforce** documented standards in code, not just document them.

### Consequences

**Good:**
- AI agents automatically apply ADR standards when generating code
- Catch violations (e.g., using ESLint vs Biome, domain code mixing with infrastructure) during coding
- Reduce manual code review burden for ADR compliance
- Standardized format works across multiple AI agent products
- Can leverage community skills from trusted upstream repositories
- Skills serve as both AI guidance and developer documentation

**Bad:**
- Team must maintain skills directory and keep content synchronized with ADRs
- Learning curve for understanding Agent Skills format
- Skills must be updated when ADRs change or new ADRs are created

## Validation

Implementation validated by:

1. **Code Generation**: AI agents reference MADR enforcement skill when writing code
2. **Code Reviews**: AI agents identify ADR violations (e.g., ESLint usage, DDD pattern violations)
3. **Examples Provided**: Skill includes correct/incorrect code examples for each ADR
4. **Developer Feedback**: Team reports AI suggestions align with documented standards

## Pros and Cons of the Options

### Agent Skills Framework (agentskills.io)

Standardized format for packaging AI agent context and capabilities.

**Good:**
- Industry-standard format (originally developed by Anthropic, adopted by GitHub, Cursor, etc.)
- Portable across multiple AI agent products
- Progressive loading (only relevant skills loaded per task)
- Community ecosystem of shareable skills
- Clear specification at agentskills.io
- Folder-based structure is simple and Git-friendly
- Can integrate skills from trusted upstream community repositories
- Perfect for enforcing ADR standards in code

**Neutral:**
- Requires following specific folder structure (SKILL.md, assets/, etc.)
- Skill metadata defined in YAML frontmatter

**Bad:**
- Relatively new standard (but rapidly gaining adoption)
- Team must learn skill authoring conventions
- Skills must be maintained and kept current with ADR changes

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
- No standardized format for code examples and anti-patterns
- Difficult to organize complex enforcement guidance
- Can't leverage community-maintained skills
- No progressive loading (all instructions loaded always)
- Lacks structure for organizing examples and references

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
- Must build own tooling
- Team must learn proprietary format
- Doesn't benefit from agentskills.io ecosystem improvements

### Manual Code Review Only

Rely on human code review to catch ADR violations.

**Good:**
- No additional structure required
- Minimal overhead

**Neutral:**
- Status quo approach

**Bad:**
- AI agents lack context about ADR standards
- Violations only caught during manual review (late in process)
- Inconsistent enforcement across reviewers
- Higher review burden on human developers
- Risk of violating ADR-0003 (DDD), ADR-0012 (Biome), ADR-0022 (Snyk), etc.
- No systematic enforcement

## Implementation Strategy

### 1. Skill Directory Structure

Following Agent Skills specification:

```
.agents/skills/                      # Primary skills location
└── madr-enforcement/                # MADR standards enforcement in code
    ├── SKILL.md                    # Main enforcement instructions
    ├── EXAMPLES.md                 # Code examples following ADRs
    └── assets/                     # MADR templates
        ├── adr-template.md         # Full template (for creating new ADRs)
        └── adr-short-template.md   # Short template (for creating new ADRs)

.github/skills/                      # Symlinks for GitHub Copilot
└── madr-enforcement -> ../../.agents/skills/madr-enforcement
```

**Rationale:**
- `.agents/skills/` = Primary location (standard per agentskills.io)
- `.github/skills/` = Symlinks for GitHub Copilot compatibility
- Symlink approach avoids duplication while supporting both locations

### 2. MADR Enforcement Skill

**Purpose:** Enforce architectural standards defined in MADRs when writing code

**What It Enforces:**
- **ADR-0003**: Domain-Driven Design patterns (entities, value objects, aggregate roots, Unit of Work)
- **ADR-0012**: Biome linting/formatting (not ESLint/Prettier)
- **ADR-0013**: Vitest testing framework (not Jest)
- **ADR-0022**: Snyk security scanning before commits
- **ADR-0019**: Turborepo build system usage
- **ADR-0011**: Bicep for infrastructure (not ARM/Terraform)
- **ADR-0014**: Azure Functions v4 with Cellix DI
- And all other documented ADRs...

**What It Does NOT Do:**
- ❌ Does NOT validate MADR document format
- ❌ Does NOT check MADR frontmatter or markdown syntax
- ✅ DOES enforce the standards documented IN the MADRs

**Capabilities:**
- Comprehensive ADR index with enforcement checklists
- Code examples showing correct vs. incorrect implementations
- Common violation patterns and how to fix them
- Layer separation enforcement (domain vs. infrastructure per ADR-0003)
- Technology choice enforcement (Biome vs ESLint per ADR-0012)

**Integration with GitHub Copilot:**
- Skill location: `.agents/skills/madr-enforcement/`
- Instructions file: `.github/instructions/madr.instructions.md`
- Symlink: `.github/skills/madr-enforcement`

### 3. Community Skills Integration

Community skills should be installed from trusted upstream repositories and then kept in the repo under the standard CellixJS layout.

**Current examples:**
- **vercel/turborepo**: `turborepo`
- **mongodb/agent-skills**: `mongodb-connection`, `mongodb-mcp-setup`, `mongodb-query-optimizer`, `mongodb-schema-design`
- **ant-design/antd-skill**: `ant-design`, `antd`
- **antfu/skills**: `vitest`

**Standard workflow for adding a community skill:**

1. Confirm the skill matches current CellixJS tooling and does not conflict with existing ADRs.
2. Install it into the managed skills directory using the Skills CLI pattern documented by Vercel, adapted for this pnpm workspace:

   ```bash
   pnpm dlx skills add <owner/repo> --dir .agents/skills
   pnpm dlx skills add <owner/repo> --skill <skill-name> --dir .agents/skills
   ```

3. Verify the installed skill exists at `.agents/skills/<skill-name>/SKILL.md` and that `skills-lock.json` records the upstream source.
4. Create the matching GitHub Copilot symlink:

   ```bash
   ln -s ../../.agents/skills/<skill-name> .github/skills/<skill-name>
   ```

5. Document why the skill is kept, which upstream it came from, and any local constraints or adaptations.
6. If upstream guidance conflicts with CellixJS ADRs, add a local wrapper or companion skill instead of editing the vendorized community skill in place.

**Optional discovery command:**

```bash
pnpm dlx skills find <query>
```

### 4. Skill Authoring Guidelines

Skills created for CellixJS must:

**Required Elements:**
1. `SKILL.md` with YAML frontmatter (name, description, license, compatibility)
2. Clear "When to Use This Skill" section
3. Detailed enforcement guidelines with code examples
4. Correct and incorrect implementation examples
5. References to specific ADRs being enforced

**Optional Elements:**
- `EXAMPLES.md` for comprehensive code examples
- `assets/` for templates or configuration files
- `references/` for extended documentation

### 5. Integration with Existing ADRs

The MADR enforcement skill references and enforces:

- **ADR-0003**: Domain-Driven Design patterns
- **ADR-0012**: Biome linting (not ESLint/Prettier)
- **ADR-0013**: Vitest testing (not Jest)
- **ADR-0022**: Snyk security scanning
- **ADR-0019**: Turborepo monorepo builds
- **ADR-0011**: Bicep infrastructure as code
- **ADR-0014**: Azure Functions v4 patterns
- And all other documented ADRs

## Migration Checklist

### Phase 1: MADR Enforcement Skill (Completed)
- ✅ Create `.agents/skills/madr-enforcement/` with SKILL.md
- ✅ Add comprehensive code examples in EXAMPLES.md
- ✅ Include enforcement checklists for each ADR
- ✅ Copy MADR templates to assets/ (for creating new ADRs)
- ✅ Add `.github/instructions/madr.instructions.md`
- ✅ Create symlink in `.github/skills/`

### Phase 2: Community Skills Integration (Completed)
- ✅ Install approved community skills into `.agents/skills/` with `pnpm dlx skills add ... --dir .agents/skills`
- ✅ Create matching `.github/skills/` symlinks for Copilot discovery
- ✅ Track installed upstream sources in `skills-lock.json`
- ✅ Add repo-specific dependencies and configuration required by installed skills
- ✅ Document the managed community skills and their purpose

### Ongoing Checklist for Future Community Skill Adoption
- [ ] Confirm the skill fits current tooling and existing ADRs
- [ ] Install with `pnpm dlx skills add <owner/repo> --dir .agents/skills`
- [ ] Use `--skill <skill-name>` when the upstream repository contains multiple skills
- [ ] Verify `.agents/skills/<skill-name>/SKILL.md` and `skills-lock.json`
- [ ] Add `.github/skills/<skill-name>` -> `../../.agents/skills/<skill-name>`
- [ ] Document the upstream source, purpose, and any local wrapper or adaptation

### Phase 3: Additional CellixJS Skills (Future)
- [ ] Create additional enforcement skills as needed for new ADRs
- [ ] Extend MADR enforcement skill with new ADR standards
- [ ] Monitor developer feedback on AI code generation quality

### Phase 4: Continuous Improvement (Ongoing)
- [ ] Update skills when ADRs are created or modified
- [ ] Gather developer feedback on AI enforcement accuracy
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

Instructions on enforcing standards, code examples, anti-patterns...
```

### Code Enforcement Workflow

1. **AI generates code** → References MADR enforcement skill
2. **Code follows ADR patterns** → Correct DDD structure, Biome usage, Vitest tests, etc.
3. **Violations identified** → AI flags ESLint usage, domain/infrastructure mixing, etc.
4. **Developer review** → Verify ADR compliance with reduced manual burden

### Related MADRs

- [ADR-0001: MADR Architecture Decisions](./0001-madr-architecture-decisions.md) - Process for documenting decisions that this skill helps enforce
- [ADR-0003: Domain-Driven Design](./0003-domain-driven-design.md) - DDD patterns enforced by this skill
- [ADR-0012: Biome Linting](./0012-linter.md) - Biome usage enforced by this skill
- [ADR-0013: Test Suite](./0013-test-suite.md) - Vitest usage enforced by this skill
- [ADR-0019: MonoRepo and Turborepo](./0019-monorepo-turborepo.md) - Turborepo patterns enforced by this skill
- [ADR-0022: Snyk Security](./0022-snyk-security-integration.md) - Security scanning enforced by this skill

### External References

- [Agent Skills Home](https://agentskills.io/home)
- [Agent Skills Specification](https://agentskills.io/specification)
- [Agent Skills GitHub](https://github.com/agentskills/agentskills)
- [Vercel Agent Skills Docs](https://vercel.com/docs/agent-resources/skills#installing-skills)
- [Skills CLI](https://github.com/skills-sh/skills)

### Future Considerations

- **Skills CLI Usage**: Continue using `pnpm dlx skills` commands for skill management
- **Skill Versioning**: Track skill versions alongside ADR versions
- **Cross-Repository Skills**: Share CellixJS skills with broader community
- **Lock File Support**: Monitor Skills CLI for lock file feature
