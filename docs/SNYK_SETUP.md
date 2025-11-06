# Snyk Setup for CellixJS

This document explains how to enable and run Snyk Open Source (SCA), Snyk Code (SAST), and Snyk IaC scans locally and in CI. The goal is consistent developer experience + CI gating.

## Overview
- Use the Snyk CLI (`snyk`) for local and CI scans. It supports Open Source (SCA), Code (SAST), and IaC scanning.
- Developers install the CLI and authenticate with a Snyk token (recommended: store `SNYK_TOKEN` in the environment or use `snyk auth`).
- CI will use a secret `SNYK_TOKEN` to run scans in the build stage.

## Prerequisites
- Node.js (v22+ recommended, matching CI/CD pipeline) and pnpm available.
- Snyk account (free for open-source projects) and an API token.
- Snyk organization: `cellixjs`

Get token:
1. Sign into https://app.snyk.io
2. Settings -> Account -> API token

## Install Snyk CLI (local)

Using npm or pnpm:

```bash
# single-user global install (npm)
npm install -g snyk

# or using pnpm (local to repo dev dependencies)
pnpm add -D snyk
```

Authenticate once per machine:

```bash
# If installed globally
snyk auth <YOUR_TOKEN>
# or set env var in a shell session
export SNYK_TOKEN="<YOUR_TOKEN>"
```

## Local scan examples

From the repository root.

**SCA (Software Composition Analysis - dependency scanning)**:

```bash
# Test for dependency vulnerabilities (will fail on high/critical issues)
pnpm run snyk:test

# Or using snyk CLI directly:
snyk test --all-projects --org=cellixjs --remote-repo-url=https://github.com/CellixJs/cellixjs --policy-path=.snyk
```

**Snyk Code (SAST - static code analysis)**:

```bash
# Scan source code for security vulnerabilities
pnpm run snyk:code

# Or using snyk CLI directly:
snyk code test --org=cellixjs --remote-repo-url=https://github.com/CellixJs/cellixjs --policy-path=.snyk
```

**IaC scan (Infrastructure as Code - Bicep templates)**:

```bash
# Scan IaC files for security misconfigurations
pnpm run snyk:iac

# Or using snyk CLI directly:
snyk iac test
```

**Run all scans (recommended before committing)**:

```bash
pnpm run snyk
```

This runs all three scan types (SCA + SAST + IaC) using the npm script defined in `package.json`.

## NPM Scripts (Already Configured)

The following scripts are already configured in the root `package.json`:

```json
"scripts": {
  "snyk:test": "snyk test --all-projects --org=cellixjs --remote-repo-url=https://github.com/CellixJs/cellixjs --policy-path=.snyk",
  "snyk:monitor": "snyk monitor --all-projects --org=cellixjs --target-reference=main --remote-repo-url=https://github.com/CellixJs/cellixjs --policy-path=.snyk",
  "snyk:code": "snyk code test --org=cellixjs --remote-repo-url=https://github.com/CellixJs/cellixjs --policy-path=.snyk",
  "snyk:code:report": "snyk code test --org=cellixjs --remote-repo-url=https://github.com/CellixJs/cellixjs --target-reference=main --project-name=cellixjs-code --report --policy-path=.snyk",
  "snyk:iac": "snyk iac test",
  "snyk": "pnpm run snyk:test && pnpm run snyk:code && pnpm run snyk:iac"
}
```

**Script Explanations**:
- `snyk:test` - SCA scan for dependency vulnerabilities (used in PR builds)
- `snyk:monitor` - Upload SCA results to Snyk Web UI (used in main branch builds)
- `snyk:code` - SAST scan for code vulnerabilities (used in PR builds)
- `snyk:code:report` - SAST scan with Web UI reporting (used in main branch builds)
- `snyk:iac` - IaC scan for Bicep template misconfigurations
- `snyk` - Run all three scan types (convenience script for local development)

**Key flags**:
- `--org=cellixjs` - Associates scans with the CellixJS Snyk organization
- `--remote-repo-url` - Links results to the GitHub repository
- `--policy-path=.snyk` - Uses the `.snyk` policy file for ignore rules
- `--target-reference=main` - Tags results as main branch for tracking
- `--report` - Sends results to Snyk Web UI dashboard

## CI Integration (Azure Pipelines)

Snyk is integrated into the Azure Pipelines build stage with **different behavior for PR builds vs. main branch builds**.

### Implementation Location

The Snyk scan is configured in `build-pipeline/core/monorepo-build-stage.yml` as a Bash task.

### PR Builds (Security Gate)

For pull request builds, Snyk acts as a **security gate** - the build will **fail** if high or critical vulnerabilities are detected:

```yaml
- task: Bash@3
  displayName: 'Audit security vulnerabilities with Snyk CLI'
  inputs:
    targetType: 'inline'
    script: |
      set -euo pipefail
      
      # Authenticate Snyk CLI
      pnpm exec snyk auth "$SNYK_TOKEN"
      
      # PR build: Run security gate (fails on high/critical issues)
      if [ "$(Build.Reason)" = "PullRequest" ]; then
        pnpm run snyk:code      # SAST - will fail on high/critical
        pnpm run snyk:test      # SCA - will fail on high/critical
      fi
  env:
    SNYK_TOKEN: $(SNYK_TOKEN)
```

**PR Build Behavior**:
- Runs `snyk:code` (SAST) and `snyk:test` (SCA)
- **Fails the build** if high or critical vulnerabilities are found
- Provides immediate feedback in PR checks
- Works alongside SonarCloud quality gate (both must pass)

### Main Branch Builds (Monitoring)

For main branch builds, Snyk **updates the Snyk Web UI project** with the current security snapshot:

```yaml
      # Main branch: Report to Snyk dashboard and monitor
      else
        pnpm run snyk:code:report  # SAST with dashboard reporting
        pnpm run snyk:monitor       # Update Snyk Web UI project
      fi
```

**Main Branch Behavior**:
- Runs `snyk:code:report` (SAST with Web UI reporting)
- Runs `snyk:monitor` (updates Snyk Web UI with current dependency snapshot)
- Does NOT fail the build
- Enables continuous monitoring and trend tracking in Snyk Web UI
- Team can view vulnerability history and remediation progress

### Secret Configuration

The `SNYK_TOKEN` is stored as a pipeline secret variable in the Azure DevOps variable group `snyk-credential-cellixjs`.

**To configure**:
1. Go to Azure DevOps -> Pipelines -> Library -> Variable groups
2. Find or create `snyk-credential-cellixjs` variable group
3. Add `SNYK_TOKEN` variable with your Snyk API token
4. Mark it as secret (lock icon)

## Snyk Web UI Project Monitoring

**Main branch builds automatically update the CellixJS project in Snyk Web UI**.

This is accomplished via:
- `snyk:monitor` - Uploads current dependency snapshot to Snyk Web UI
- `snyk:code:report` - Uploads SAST results to Snyk Web UI

The Snyk Web UI project provides:
- **Vulnerability trends over time** - Track security improvements/regressions
- **Historical snapshots** - See when vulnerabilities were introduced
- **Proactive alerting** - Get notified when new CVEs affect your dependencies
- **Remediation tracking** - Monitor progress on fixing security issues
- **Executive reporting** - Security dashboards and metrics

You can manually update the Snyk project locally:

```bash
pnpm run snyk:monitor
pnpm run snyk:code:report
```

However, this is primarily handled automatically by CI/CD main branch builds.

## Failure Policy

The project uses Snyk's default failure behavior:

**PR Builds (Security Gate)**:
- **SCA (`snyk:test`)**: Fails on ANY vulnerability by default
- **SAST (`snyk:code`)**: Fails on high or critical vulnerabilities
- **Build blocks PR merge** if either scan fails

**Main Branch Builds (Monitoring Only)**:
- Does NOT fail the build
- Only reports results to Snyk Web UI for tracking

**Policy Management**:

The `.snyk` policy file allows you to ignore specific vulnerabilities:

```yaml
version: v1.5.0
ignore:
  'SNYK-JS-SIRV-12558119':
    - '* > sirv@2.0.4':
        reason: 'Transitive dependency in Docusaurus; not exploitable in context'
        expires: '2026-11-20T00:00:00.000Z'
        created: '2024-11-06T15:57:00.000Z'
```

**Best practices for ignores**:
- Document the business reason
- Set expiration dates to force periodic review
- Only ignore false positives or accepted risks

## Developer & AI Agent Usage

**Developers**:

Before committing code, run all Snyk scans:

```bash
pnpm run snyk
```

This runs SCA, SAST, and IaC scans using the same commands that CI uses.

**AI Agents (GitHub Copilot)**:

AI agents are configured via `.github/instructions/snyk_rules.instructions.md` to automatically:
1. Run `snyk_code_scan` tool after generating code
2. Detect security issues in newly generated code
3. Attempt to fix issues automatically
4. Rescan after fixes to verify resolution
5. Repeat until no issues remain

This enables **"security at inception"** - catching vulnerabilities during code generation before they're even committed.

**Manual AI agent authentication** (if needed):

```bash
export SNYK_TOKEN="<YOUR_TOKEN>"
pnpm exec snyk auth "$SNYK_TOKEN"
pnpm run snyk:code
pnpm run snyk:test
```

## Notes & Troubleshooting

**Monorepo Support**:
- The `--all-projects` flag automatically detects all `package.json` files in the workspace
- Snyk will scan all workspace packages for vulnerabilities
- No additional configuration needed for Turborepo/pnpm workspaces

**Policy File**:
- The `.snyk` file in the repository root contains ignore rules
- All npm scripts reference it via `--policy-path=.snyk`
- Edit this file to add new ignore rules with expiration dates

**Snyk CLI Version**:
- Currently using `snyk@1.1300.2` as a dev dependency
- Update via: `pnpm add -D snyk@latest`

**IaC Scanning**:
- Automatically scans Bicep files (`.bicep`) in the repository
- No path or severity threshold configured (scans all files, all severities)
- Customize via `snyk:iac` script if needed

**CI/CD Integration**:
- Already fully configured in Azure Pipelines
- See `build-pipeline/core/monorepo-build-stage.yml` for implementation
- Variable group `snyk-credential-cellixjs` contains the `SNYK_TOKEN` secret

**Resources**:
- Snyk CLI Documentation: https://docs.snyk.io/snyk-cli
- Snyk for Azure Pipelines: https://docs.snyk.io/integrations/ci-cd-integrations/azure-pipelines-integration
- Snyk Policy File: https://docs.snyk.io/snyk-cli/test-for-vulnerabilities/the-.snyk-file
- Snyk for Monorepos: https://docs.snyk.io/scan-applications/supported-languages-and-frameworks/monorepos
- Snyk Support: https://support.snyk.io/