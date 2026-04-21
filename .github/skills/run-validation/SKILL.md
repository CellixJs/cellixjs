---
name: run-validation
description: Reusable validation procedure for build, test, lint, architecture, and security checks. Use when verifying changes before review completion or final handoff.
---

# Skill: Run Validation

Reusable procedure for validating changes before marking work as complete.

## When to Use

- After implementation, before marking a task done
- After fixing review or security findings
- Before the orchestrator declares completion
- Whenever targeted verification is needed

## Procedure

### 1. Build Check
```bash
pnpm run build
```
- Must exit 0
- If it fails, read the error output and fix the specific issue

### 2. Test Check
```bash
pnpm run test
```
- Must exit 0
- If specific packages changed, use a targeted command where possible

### 3. Lint Check
```bash
pnpm run lint
```
- Must exit 0
- Auto-fix is available through `pnpm run format`

### 4. Architecture Tests
```bash
pnpm --filter @ocom/archunit-tests test
pnpm --filter @cellix/archunit-tests test
```
- Use when domain, GraphQL, persistence, or architecture boundaries changed

### 5. Security Scan
```bash
pnpm run snyk
```
- Use for dependency or security-relevant changes when the environment supports it

### 6. Full Verification
```bash
pnpm run verify
```
- Use before final completion when broad verification is appropriate

## Validation Matrix

| Change Type | Build | Test | Lint | Arch | Snyk | Acceptance |
|------------|-------|------|------|------|------|------------|
| Domain logic | yes | yes | yes | yes | - | domain |
| GraphQL schema or resolver | yes | yes | yes | optional | - | graphql |
| Persistence layer | yes | yes | yes | optional | - | optional |
| UI components | yes | yes | yes | - | - | ui |
| Dependencies | yes | yes | yes | - | yes | - |
| Auth or security code | yes | yes | yes | optional | yes | yes |

## Failure Recovery

1. Read the error output carefully
2. Identify the root cause rather than the surface symptom
3. Fix the specific issue
4. Re-run the failing validation
5. Re-run earlier checks if the fix could have regressed them
