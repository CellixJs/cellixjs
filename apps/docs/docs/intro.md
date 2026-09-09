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
- `portless` local HTTPS proxy support: see [ADR 0028 — Portless Local Development](./decisions/0028-portless-local-development.md) for TLS trust setup, OS-specific prompts, and troubleshooting. You can run `pnpm exec portless trust` beforehand to avoid interactive prompts on the first dev run, or run mock services on the non-privileged port 1355 and include `:1355` in BASE_URL to avoid requiring portless trust.

If you prefer non-privileged mode, see [ADR-0028 — Portless Local Development](./decisions/0028-portless-local-development.md) for the canonical proxy start/stop commands.


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

For detailed, OS-specific instructions and troubleshooting see ADR 0028 — [Portless Local Development](./decisions/0028-portless-local-development.md).

> Note: portless is installed automatically from the repo dependencies. Running the `pnpm exec portless trust` command manually before the first `pnpm run dev` is optional but recommended for a smoother experience. If you prefer not to run the trust command, you can instead run mock services on the non-privileged port 1355 and include `:1355` in the corresponding BASE_URLs.
## Install VSCode plugins
You will be prompted to install the [recommended VSCode Plugins](https://github.com/CellixJs/cellixjs/blob/main/.vscode/extensions.json) upon opening the project in VSCode. Go ahead and do so.

## Enable the workspace TypeScript language service in VS Code

CellixJS pins editor IntelliSense to the workspace `typescript@6.0.3` SDK (see [ADR-0034](./decisions/0034-typescript-language-service.md)). VS Code's built-in TypeScript support talks to `tsserver` directly; it does **not** use `typescript-language-server` (that binary is for Grok and other LSP clients).

The repo commits two workspace settings in `.vscode/settings.json`:

- `js/ts.tsdk.path` — the workspace SDK at `node_modules/typescript/lib`
- `js/ts.tsdk.promptToUseWorkspaceVersion` — ask each developer to use that SDK

**Each developer must opt in once on their machine.** VS Code will not switch IntelliSense to a workspace `tsserver` without a user action (that choice is stored locally and is not committed). Open the **repository root** as the workspace (not a nested package), run `pnpm i` if needed, open a `.ts` / `.tsx` file, then either:

- Accept the prompt **Use the workspace version of TypeScript?**, or
- Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) → **TypeScript: Select TypeScript Version...** → **Use Workspace Version**

Confirm it is enabled:

- With a TypeScript file focused, the status bar may only say **TypeScript**. That is normal in current VS Code: the version lives on the language status item (`{}` next to it). Hover or click `{}` — it should show **TypeScript Workspace Version 6.0.3**. Pin that item if you want the version number always visible.
- Run **TypeScript: Select TypeScript Version...** again. **Use Workspace Version** should be marked as the active choice and list **6.0.3**.
- **TypeScript: Open TS Server Log** is off by default (`js/ts.tsserver.log`). When VS Code says logging is off, click **Enable and restart TS server**, then run the command again. The log should load `tsserver` from this repo's `node_modules/typescript/lib/tsserver.js` (not VS Code's bundled TypeScript). Do not commit `js/ts.tsserver.log`; it is a local debug setting.
- Hover a symbol and use **Go to Definition** (`F12`). Types and navigation should resolve across workspace packages.

Do not enable a TypeScript 7 / native `tsgo` editor extension for this workspace. Builds use `tsgo`; editor and agent intelligence stay on TypeScript 6 until ADR-0034 is revisited.

## Grok CLI TypeScript LSP

Grok loads `.grok/lsp.json` in this repository and starts `pnpm exec typescript-language-server`. The model-visible `lsp` tool also needs `GROK_LSP_TOOLS=1` (exported by `mise.toml`) or `[features] lsp_tools = true` in `~/.grok/config.toml`.

1. From the repository root: `pnpm exec typescript-language-server --version` (expect `6.0.0`).
2. Trust the folder if Grok has not already (`/hooks-trust` in the TUI, or launch with `--trust`). Project LSP servers are skipped while the folder is untrusted.
3. Restart Grok from the repository root so it reloads `.grok/lsp.json`.
4. `grok inspect --json` should list a `typescript` entry under `lspServers` with `"source": { "type": "project" }`.

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

Or, if you prefer not to configure portless trust, run mock services on the non-privileged port 1355 and include `:1355` in the appropriate BASE_URL values. See ADR 0028 — [Portless Local Development](./decisions/0028-portless-local-development.md) for details about OS-specific prompts.

If you prefer non-privileged mode, see [ADR-0028 — Portless Local Development](./decisions/0028-portless-local-development.md) for the canonical proxy start/stop commands.


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
