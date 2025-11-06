---
applyTo: "**"
description: Snyk CLI Usage and Security Scanning Workflow 
---

# Project security best practices

## When to Run Snyk Scans

- **During code generation**: Run `snyk_code_scan` MCP tool for new first-party code in Snyk-supported languages
- **Before committing changes**: Run Snyk CLI scans after completing a coding session and before committing changes
- **After fixing security issues**: Always rescan to verify fixes and ensure no new issues were introduced

## Snyk Scan Commands for Developers

Use these npm scripts to run security scans (same commands developers use):

```bash
# Run all security scans (recommended before committing)
pnpm run snyk

# Or run individual scans:
pnpm run snyk:code    # SAST - scan source code for security vulnerabilities
pnpm run snyk:test    # SCA - scan dependencies for vulnerabilities  
pnpm run snyk:iac     # IaC - scan Bicep templates for misconfigurations
```

**DO NOT use** `snyk:monitor` or `snyk:code:report` - these are reserved for CI/CD pipeline only.

## Security Scan Workflow

1. **Generate/modify code** using appropriate tools and patterns
2. **Run `snyk_code_scan` MCP tool** on newly generated code for immediate feedback
3. **Fix any security issues** found by Snyk using the provided context and remediation guidance
4. **Rescan after fixes** to verify issues are resolved
5. **Before committing**, run `pnpm run snyk` to execute all security scans (SCA + SAST + IaC)
6. **Iterate on feedback** from the full scan and resolve any reported issues
7. **Repeat steps 5-6** until all scans pass with no security issues
8. **Only then commit** the changes

## Handling Security Issues

- Review Snyk output carefully for vulnerability details and remediation guidance
- Prioritize fixing high and critical severity issues
- For dependency vulnerabilities, upgrade to patched versions when available
- For code vulnerabilities, refactor code following Snyk's security recommendations
- If a vulnerability is a false positive or accepted risk, document it (do not ignore without justification)

## Integration with Development Workflow

This security-first approach ensures:
- Vulnerabilities are caught during code generation (shift-left security)
- All changes are scanned before commit (consistent with CI/CD pipeline)
- Security issues are fixed iteratively before code is committed
- The same scans that run in CI/CD are run locally, preventing PR failures
