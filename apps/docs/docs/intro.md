---
sidebar_position: 1
---

# Introduction 👋

Let's discover **CellixJs in less than 5 minutes**.

## Getting Started

Get started by **exploring the CellixJs platform**.

CellixJs is a Domain-Driven Design (DDD) monorepo built on Azure Functions, implementing a modular architecture with strict separation of concerns.

### What you'll need

- [Node.js](https://nodejs.org/en/download/) version 22.0 or above (recommended):
  - When installing Node.js, you are recommended to check all checkboxes related to dependencies.
  - Note: the portless local HTTPS proxy requires Node 20+; CellixJs recommends Node 22+ for development.
- [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local) for local development

    * `func --version`
        * should return 4.0.6610 or greater
    * [Install Guide](https://github.com/Azure/azure-functions-core-tools#installing)
        * to upgrade: (mac)
        * `brew upgrade azure-functions-core-tools@4`

- [MongoDB](https://www.mongodb.com/try/download/community) or access to a MongoDB instance
- `portless` local HTTPS proxy support:
  - installed automatically from repo dependencies
  - You can either:
    - Run `pnpm exec portless trust` beforehand (recommended for a smooth developer experience — avoids a prompt when starting dev), OR
    - Start with `pnpm run dev` and allow the first run to prompt you to trust the local CA.
  - Platform note: the trust prompt varies by OS (macOS: system password or Keychain dialog; Windows: UAC/admin prompt; Linux: sudo prompt). Re-running `pnpm exec portless trust` is safe/harmless if needed.

## Clone and Setup

Clone the CellixJs repository and set up the development environment:

```bash
git clone https://github.com/CellixJs/cellixjs.git
cd cellixjs
```



Install dependencies and build the project: (we recommend using NVM)

```bash
# Install Node.js v22
nvm install v22

# Install Latest NPM (v11+)
nvm install-latest-npm

# Use Node.js v22
nvm use v22

# Clean, install dependencies, and build
npm run clean
npm install 
npm run build
```

### Configure TLS for Development (one-time)

Before starting the development environment for the first time, configure TLS trust for local custom domains used by the portless HTTPS proxy. This is a one-time setup per machine and is a prerequisite for a smooth development experience.

You have two options (choose one):

- Run the trust command before starting the development environment (recommended):

```bash
pnpm exec portless trust
```

  Running the command beforehand configures your system to trust certificates for .localhost domains (for example: https://ownercommunity.localhost). This avoids any interactive prompts when you later run `pnpm run dev`.

- Or let `pnpm run dev` start the proxy and prompt you to trust the CA on its first run. The prompt will appear only the first time; subsequent runs will not prompt again.

Platform behaviour note: the trust prompt is OS-specific — macOS may show a system password or Keychain dialog; Windows will show a UAC/admin prompt; Linux typically shows a sudo prompt. Re-running `pnpm exec portless trust` is safe/harmless if you need to do it again.

> Note: portless is installed automatically from the repo dependencies. Running the command manually before the first `pnpm run dev` is optional but recommended for a smoother experience.

## Install VSCode plugins
You will be prompted to install the [recommended VSCode Plugins](https://github.com/CellixJs/cellixjs/blob/main/.vscode/extensions.json) upon opening the project in VSCode. Go ahead and do so.

## Local SonarCloud Analysis

- Create a SonarCloud API token from your [SonarCloud account](https://sonarcloud.io/account/security/)
- Run the following command using your token in the terminal

```bash
echo "export SONAR_TOKEN=<your-token>" >> ~/.zshrc
source ~/.zshrc
```

## Local Snyk Security Scanning

Authenticate Snyk CLI once per machine (login with your GitHub account):

```bash
pnpm exec snyk auth
```

This will open a browser window to authenticate with your GitHub account and grant access to Snyk.

**Run security scans before committing code:**

```bash
# Run all security scans (SCA + SAST + IaC)
pnpm run snyk

# Or run individual scans:
pnpm run snyk:code    # SAST - scan source code for security vulnerabilities
pnpm run snyk:test    # SCA - scan dependencies for vulnerabilities
pnpm run snyk:iac     # IaC - scan Bicep templates for misconfigurations
```

**Expected output for successful scan:**
```bash
✓ Tested for known issues, no vulnerable paths found.
```

**If vulnerabilities are found:**
- Review Snyk output for vulnerability details and remediation guidance
- Prioritize by severity: Critical → High → Medium → Low
- Fix issues using upgrade paths or code refactoring
- If no fix is available, document in `.snyk` file (requires CODEOWNERS approval)
- Re-run `pnpm run snyk` to verify fixes

> **Note**: Only use the npm scripts listed above. Other Snyk scripts (`snyk:monitor`, `snyk:code:report`) are reserved for CI/CD pipeline use only.

## Start Development

Run the development environment:

```bash
pnpm run dev
```

This command will:
- Stop and start the local portless HTTPS proxy
- Start Azurite for Azure Storage
- Launch the API, UI, docs, and mock-service app `dev` tasks

Builds happen through the Turbo task graph because each app `dev` task depends on its corresponding `build` task.

The development server will be available at:
- **Frontend**: https://ownercommunity.localhost
- **API**: https://data-access.ownercommunity.localhost
- **GraphQL endpoint**: https://data-access.ownercommunity.localhost/api/graphql
- **Mock OIDC**: https://mock-auth.ownercommunity.localhost/.well-known/openid-configuration
- **Docs**: https://docs.ownercommunity.localhost

If your browser or OS has not yet trusted the local portless certificate authority, run:

```bash
pnpm exec portless trust
```

Note: the trust prompt is OS-dependent — macOS may show a system password or Keychain dialog; Windows will show a UAC/admin prompt; Linux typically shows a sudo prompt. Re-running this command is safe if needed.

## Verify Code Quality Locally

Run all verification steps (lint, build, test, sonarcloud quality gate):

```bash
npm run verify
```
 Expected output:
```bash
> ...
> Quality Gate passed.
```

If there are any failing builds, tests, or sonarcloud analysis issues, this command will report them. Please address any issues before pushing code to simulate the CI pipeline and ensure checks will pass on the remote repository.

> **Note**: The `verify` command requires a valid `SONAR_TOKEN` environment variable for SonarCloud analysis. See the [Local SonarCloud Analysis](#local-sonarcloud-analysis) section for setup instructions.

**For security scanning**, run Snyk separately:

```bash
pnpm run snyk
```

This runs security scans (SCA, SAST, IaC) to catch vulnerabilities before committing. The CI pipeline will run these scans automatically on PRs and block merges if security issues are found.

### Before Committing to a PR

**Both quality gates must pass:**
1. ✅ **Snyk security gate**: (no vulnerabilities found)
2. ✅ **SonarCloud quality gate**: (quality gate passed)

Use the `pnpm run verify` command locally to ensure both gates pass before pushing code.

**If your PR fails a gate in CI/CD:**
- Check the build logs on Azure DevOps to see which issues were detected
- Rerun `pnpm run verify` to reproduce the issues locally
- Fix the issues and push your changes

## Architecture Overview

CellixJs follows these core patterns:

- **Application Packages**:
    - **API**: Azure Functions backend application `apps/api`
    - **UI**: React frontend application `apps/ui-community`
    - **Docs**: Documentation site using Docusaurus `apps/docs`

- **Library Packages**:
    - **Cellix**: Core framework and seedwork libraries used across projects `packages/cellix/*`
    - **Ocom**: Application-specific libraries used by frontend and backend `packages/ocom/*`

Open any file in the `apps/` or `packages/` directory and start exploring: the project uses hot reloading for rapid development!
