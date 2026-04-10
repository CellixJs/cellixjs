---
sidebar_position: 1
---

# Introduction 👋

Let's discover **CellixJs in less than 5 minutes**.

## Getting Started

Get started by **exploring the CellixJs platform**.

CellixJs is a Domain-Driven Design (DDD) monorepo built on Azure Functions, implementing a modular architecture with strict separation of concerns.

### What you'll need

- [Node.js](https://nodejs.org/en/download/) version 22.0 or above:
  - When installing Node.js, you are recommended to check all checkboxes related to dependencies.
- [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local) for local development

    * `func --version`
        * should return 4.0.6610 or greater
    * [Install Guide](https://github.com/Azure/azure-functions-core-tools#installing)
        * to upgrade: (mac)
        * `brew upgrade azure-functions-core-tools@4`

- [MongoDB](https://www.mongodb.com/try/download/community) or access to a MongoDB instance
- `portless` local HTTPS proxy support:
  - installed automatically from repo dependencies
  - on first use, trust the local CA when `pnpm run dev` starts the proxy

## Clone and Setup

Clone the CellixJs repository and set up the development environment:

```bash
git clone https://github.com/CellixJs/cellixjs.git
cd cellixjs
```



Prerequisites

Before you clone or build the project, install these tools and ensure they are available on your system:

- mise (Node version manager)
  - macOS (recommended): brew install mise
  - Fallback (any OS): curl https://mise.run | sh
  - After installation, ensure mise is activated (restart your shell or run the activation command shown by the installer), e.g.:
    eval "$(~/.local/bin/mise activate zsh)"
- Node.js: managed by mise. The workspace root mise.toml pins node = "22.22.2" — mise install will provision this version for the project
- pnpm: recommended via Corepack (preferred):
  corepack enable && corepack prepare pnpm@10.30.1 --activate
  or install globally: npm i -g pnpm (or brew install pnpm on macOS)
- Git (for cloning and pushing)
- Azure Functions Core Tools (func) — required for local Functions runtime; follow the official install guide linked above
- MongoDB (local or remote) or use Azurite for local Azure storage emulation (used by this repo)

Clone and Setup

```bash
# Clone the repo
git clone https://github.com/CellixJs/cellixjs.git
cd cellixjs

# Install workspace tools (installs Node 22.22.2 per mise.toml)
# On macOS (recommended):
brew install mise || true
# Fallback (any OS):
curl https://mise.run | sh
# Activate mise if needed (restart your shell or run the activation command shown by the installer)
# e.g., eval "$(~/.local/bin/mise activate zsh)"

# Install tools specified in mise.toml (Node will be installed automatically)
mise install

# Ensure pnpm is available (recommended):
corepack enable && corepack prepare pnpm@10.30.1 --activate
# Alternative: npm i -g pnpm

# Clean, install dependencies, and build
pnpm run clean
pnpm install
pnpm run build
```

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

## Verify Code Quality Locally

Run all verification steps (lint, build, test, sonarcloud quality gate):

```bash
pnpm run verify
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
