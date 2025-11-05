# Snyk Setup for CellixJS

This document explains how to enable and run Snyk Open Source (SCA), Snyk Code (SAST), and Snyk IaC scans locally and in CI. The goal is consistent developer experience + CI gating.

## Overview
- Use the Snyk CLI (`snyk`) for local and CI scans. It supports Open Source (SCA), Code (SAST), and IaC scanning.
- Developers install the CLI and authenticate with a Snyk token (recommended: store `SNYK_TOKEN` in the environment or use `snyk auth`).
- CI will use a secret `SNYK_TOKEN` to run scans in the build stage.

## Prerequisites
- Node.js (v18+ recommended) and pnpm/yarn/npm available.
- Snyk account (free for open-source projects) and an API token.

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

SCA (Open Source dependency scanning):

```bash
# fast dependency test
snyk test --all-projects

# generate SBOM (CycloneDX JSON)
snyk sbom generate --format=cx
```

Snyk Code (SAST):

```bash
# static code analysis for TypeScript/JS and other languages
snyk code test
```

IaC scan (Terraform, Kubernetes, CloudFormation, ARM templates):

```bash
# scan all IaC files under iac/
snyk iac test iac/ --severity-threshold=low
```

Run all (SCA + Code + IaC):

```bash
snyk test --all-projects || true
snyk code test || true
snyk iac test iac/ --severity-threshold=low || true
```

> Note: Use `|| true` while first enabling to prevent early CI failures until you triage results.

## Recommended package.json scripts (developer ergonomics)

Add to your `package.json` (docs only; do not commit without review):

```json
"scripts": {
  "snyk:auth": "snyk auth",
  "snyk:sca": "snyk test --all-projects",
  "snyk:code": "snyk code test",
  "snyk:iac": "snyk iac test iac/",
  "snyk:all": "pnpm run snyk:sca && pnpm run snyk:code && pnpm run snyk:iac"
}
```

## CI Integration

Two options: Azure Pipelines (your repo has) and GitHub Actions. Below are examples.

### Azure Pipelines example (job step)

Place this snippet in the pipeline job that runs tests/build (use secure pipeline variables):

```yaml
- task: NodeTool@0
  inputs:
    versionSpec: '18.x'
  displayName: 'Install Node'

- script: |
    npm ci
    npx snyk auth $(SNYK_TOKEN)
    npx snyk test --all-projects
    npx snyk code test || true
    npx snyk iac test iac/ --severity-threshold=low || true
  displayName: 'Run Snyk scans'
  env:
    SNYK_TOKEN: $(SNYK_TOKEN)
```

Set `SNYK_TOKEN` as a pipeline secret variable in Azure DevOps.

### GitHub Actions example (optional)

```yaml
name: Snyk Scan
on: [push, pull_request]
jobs:
  snyk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18
      - name: Install deps
        run: npm ci
      - name: Authenticate Snyk
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        run: |
          npx snyk auth $SNYK_TOKEN
      - name: Snyk SCA
        run: npx snyk test --all-projects
      - name: Snyk Code
        run: npx snyk code test || true
      - name: Snyk IaC
        run: npx snyk iac test iac/ --severity-threshold=low || true
```

## Snyk Monitor (optional)

To keep track of SCA results over time, call `snyk monitor` and upload results to Snyk UI:

```bash
npx snyk monitor --all-projects
```

## Failure policy suggestions

- SCA: Fail the build for high/critical Snyk findings. Use `--severity-threshold=high` to exit non-zero only for high+.
- Code/SAST: Initially run as advisory (do not fail CI) until you triage results; later fail on `high` or `critical` severity.
- IaC: Fail for `high`+ or enforce fix policies via PR bot.

## Developer & Agent usage

- Developers should `npm ci` and run `pnpm run snyk:all` locally.
- AI agents should authenticate using `SNYK_TOKEN` env var in the execution environment, and then run `npx snyk code test` and `npx snyk test --all-projects`.

## Notes & Troubleshooting

- If `snyk code test` doesn't report results in CI, ensure the CLI is up-to-date and the project has source files for supported languages.
- For multi-package monorepos, `--all-projects` will auto-detect manifests (package.json, pom.xml, etc.). If it misses packages, specify `--file` per-project.
- Snyk Support: https://support.snyk.io/

---

If you'd like, I can also:
- Add a CI step to your `azure-pipelines.yml` now (I'll only do it if you confirm).
- Add a GitHub Actions workflow file.
- Add a small npm script into `packages/arch-unit-tests/package.json` or repo root `package.json` to make running Snyk local easier.

Which of the above would you like me to do next?