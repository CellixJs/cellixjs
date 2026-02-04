---
applyTo: "**"
description: MADR (Markdown Any Decision Records) Enforcement in Code
---

# MADR Enforcement in Code

## Purpose

This instruction file ensures that all code written in CellixJS adheres to the architectural standards, 
patterns, and guidelines documented in our MADRs (Markdown Any Decision Records).

**Location of ADRs:** `apps/docs/docs/decisions/`

## Key Principle

**ADRs are binding architectural decisions that MUST be followed when writing, reviewing, or modifying code.**

## When to Apply MADR Standards

- **Writing new code** - Follow patterns documented in relevant ADRs
- **Reviewing pull requests** - Verify code compliance with ADR standards
- **Refactoring** - Align with current architectural decisions
- **Adding dependencies** - Check against technology choices in ADRs
- **Making design decisions** - Consult ADRs or create new ones

## Critical ADRs for Code Compliance

### ADR-0003: Domain-Driven Design

**Enforce in Code:**
- Organize code by bounded contexts in `packages/ocom/domain/contexts/{context-name}/`
- Entities in `{entity}.ts` with unique IDs and business logic
- Value objects in `{entity}.value-objects.ts` (immutable)
- Unit of Work in `{entity}.uow.ts` for persistence
- **Keep domain logic separate from infrastructure**

**Common Violation:** Database code in domain entities

### ADR-0012: Biome for Linting

**Enforce in Code:**
- Use Biome only (no ESLint or Prettier)
- Run `pnpm run lint` before commits
- Configuration in `biome.json`
- Tab indentation, strict TypeScript

**Common Violation:** Adding ESLint or Prettier configs

### ADR-0013: Test Suite Architecture

**Enforce in Code:**
- Use Vitest for unit tests
- Co-locate tests with source files
- Run `pnpm run test:coverage`
- Maintain coverage thresholds

**Common Violation:** Using Jest instead of Vitest

### ADR-0022: Snyk Security Integration

**Enforce in Code:**
- Run `pnpm run snyk` before commits
- Scan new dependencies with `gh-advisory-database` MCP tool
- Fix or document all vulnerabilities
- Use `.snyk` file for suppressions with expiration dates

**Common Violation:** Committing without security scan

### ADR-0019: MonoRepo and Turborepo

**Enforce in Code:**
- Use `pnpm run build` (not direct package builds)
- Use `workspace:*` protocol for internal dependencies
- Respect package boundaries
- Use affected builds: `pnpm run build:affected`

**Common Violation:** Bypassing Turborepo, using npm directly

### ADR-0011: Bicep for Infrastructure

**Enforce in Code:**
- Define Azure infrastructure in Bicep (not ARM or Terraform)
- Location: `iac/` directory
- Follow resource naming conventions (ADR-0021)

**Common Violation:** Using ARM templates or Terraform

## Code Review Workflow

When reviewing code, check:

1. **Which ADRs apply?** - Identify relevant architectural decisions
2. **Is code compliant?** - Verify patterns match documented standards
3. **Are violations present?** - Look for common anti-patterns
4. **Reference ADR in feedback** - Cite specific ADR when requesting changes

## Verification Before Commit

```bash
# Full verification (includes linting, tests, security, quality)
pnpm run verify
```

This enforces:
- **ADR-0012**: Biome linting
- **ADR-0013**: Test suite with Vitest
- **ADR-0022**: Snyk security scanning
- **ADR-0015**: SonarCloud quality gate

## Agent Skills Integration

For detailed enforcement guidance, see:

- **MADR Enforcement Skill**: `.agents/skills/madr-enforcement/SKILL.md`
- **Code Examples**: `.agents/skills/madr-enforcement/EXAMPLES.md`
- **All ADRs**: `apps/docs/docs/decisions/`

## Quick Reference

| ADR | Standard to Enforce | Common Violation |
|-----|---------------------|------------------|
| ADR-0003 | DDD patterns, layer separation | DB code in domain |
| ADR-0012 | Biome linting/formatting | Using ESLint/Prettier |
| ADR-0013 | Vitest testing | Using Jest |
| ADR-0022 | Snyk security scans | Skipping security checks |
| ADR-0019 | Turborepo builds | Direct package builds |
| ADR-0011 | Bicep IaC | Using ARM/Terraform |
| ADR-0014 | Azure Functions v4, Cellix DI | Manual service instantiation |

## References

- [MADR Enforcement Skill](../.agents/skills/madr-enforcement/SKILL.md)
- [Code Examples](../.agents/skills/madr-enforcement/EXAMPLES.md)
- [All ADRs](../apps/docs/docs/decisions/)
- [ADR-0001: MADR Process](../apps/docs/docs/decisions/0001-madr-architecture-decisions.md)
