---
name: review-diff
description: Structured code-review procedure for changed files. Use when reviewing a diff for correctness, regressions, security, and test coverage.
---

# Skill: Review Diff

Reusable procedure for performing a structured code review on changes.

## When to Use

- After implementation tasks complete
- When the orchestrator delegates a review pass
- For cross-task final review of all session changes

## Procedure

### 1. Identify All Changed Files
- List all files that were created, modified, or deleted
- Group by package or area for systematic review

### 2. Read Changed Files in Full
- Read every changed file completely, not just diffs
- For deleted files, verify removal was intentional and no dangling references remain
- For new files, verify naming conventions and barrel export updates

### 3. Trace Dependencies
- Follow imports from changed files to understand their dependencies
- Follow imports to changed files to find callers that might break
- Check shared interfaces for consistency

### 4. Apply the Review Checklist

#### Security
- No raw user input in database queries
- Authorization checks on all domain operations
- No secrets or internal IDs leaked
- Input validation at system boundaries
- Error messages do not expose internals
- Tenant scoping on multi-tenant queries

#### Architecture and DDD
- No infrastructure imports in domain layer
- Aggregate invariants enforced in domain, not services
- Value objects are immutable
- Repository returns domain types, not Mongoose models
- Barrel exports updated for new files
- File naming follows conventions

#### Logic and Correctness
- Edge cases handled
- No logical errors
- Changes do not break existing callers
- TypeScript strict mode satisfied

#### Performance
- No database calls inside loops
- Large collections use pagination
- React components avoid unnecessary re-renders

#### Code Quality
- No duplicated logic
- Single responsibility per function or class
- Patterns match surrounding code
- No over-engineering for current needs

#### Testing
- Logic changes have corresponding test updates
- Tests verify behavior, not implementation
- Edge cases covered in tests

### 5. Devil's Advocate Pass
- What breaks with unexpected input?
- What breaks under concurrency?
- What breaks if external services fail?
- What assumptions will break over time?
- What would a malicious user exploit?

### 6. Classify Findings
- `blocker`: must fix before proceeding
- `major`: should fix
- `minor`: nice to fix
- `nit`: observation only

### 7. Report
Structure findings by severity, then by file:
```text
[severity] Category — file:line
Issue: what's wrong and why
Fix: concrete instruction
```
