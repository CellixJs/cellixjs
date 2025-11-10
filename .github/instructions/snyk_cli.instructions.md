---
applyTo: "**"
description: Snyk CLI Usage and Security Scanning Workflow 
---

# Project security best practices

## When to Run Snyk Scans

- **During code generation**: Run `snyk_code_scan` MCP tool for new first-party code in Snyk-supported languages
- **Before committing changes**: Run Snyk CLI scans at least once before committing to a PR
- **After fixing security issues**: Always rescan to verify fixes

## Snyk Commands

```bash
pnpm run snyk        # Run all scans (SCA + SAST + IaC)
pnpm run snyk:code   # SAST - scan source code
pnpm run snyk:test   # SCA - scan dependencies
pnpm run snyk:iac    # IaC - scan Bicep templates
```

**DO NOT use** `snyk:monitor` or `snyk:code:report` (CI/CD only).

## Workflow

1. Generate/modify code
2. Run `snyk_code_scan` MCP tool on new code
3. Fix security issues using Snyk guidance
4. Rescan to verify fixes
5. Before commit: run `pnpm run verify` (includes Snyk scans)
6. Iterate until no issues remain
7. Commit

> Both Snyk security gate AND SonarCloud quality gate must pass before committing.

## Fixing Issues

**Priority**: Critical → High → Medium → Low (all must be investigated)

**Dependency vulnerabilities (SCA):**
```bash
pnpm install package-name@fixed-version --filter <workspace>  # Upgrade to patched version in affected workspace
pnpm run snyk:test                                            # Verify fix
```

**Code vulnerabilities (SAST):**
- Refactor following security best practices (input validation, parameterized queries, secure crypto)
- Run `snyk_code_scan` or `pnpm run snyk:code` to verify

**IaC misconfigurations:**
- Update Bicep templates per Snyk recommendations
- Run `pnpm run snyk:iac` to verify

**No fix available:**
1. Assess risk in your use case
2. Document in `.snyk` file with justification
3. Set expiration (6-12 months)
4. Get CODEOWNERS approval (required)

```yaml
version: v1.5.0
ignore:
  'SNYK-JS-PACKAGE-ID':
    - '* > package-name@version':
        reason: 'Clear justification of why not exploitable'
        expires: '2026-06-01T00:00:00.000Z'
        created: '2025-11-07T00:00:00.000Z'
```

## Troubleshooting

**PR failed Snyk gate:**
- Check Azure DevOps build logs
- Run `pnpm run snyk` locally
- Fix by priority, push changes

**Auth failed:**
```bash
pnpm exec snyk auth
```
