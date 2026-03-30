# @cellix/config-rolldown

Shared Rolldown configuration and deployment helpers for Cellix Azure Functions applications.

## Purpose

This package provides the Cellix-standard way to bundle an Azure Functions API app with Rolldown and prepare the `deploy/` artifact used for local development and deployment.

It is intended to be reused across Cellix projects with minimal project-specific configuration.

## What It Owns

- A Rolldown config factory for Cellix Azure Functions apps
- A workspace dependency alias map that helps Rolldown bundle mixed workspace and npm dependencies
- The Cellix-standard Azure Functions deploy artifact preparation step
- A small CLI for `prepare:deploy`

## Current Assumptions

This package is portable across Cellix repos that follow these conventions:

- monorepo layout with workspace packages under `apps/` and `packages/`
- application bundle entry compiled to `dist/index.js`
- Azure Functions deploy artifact emitted to `deploy/dist/index.js`
- app-level `host.json` located at the app root
- shared framework packages use the `@cellix/` namespace
- app/workspace packages may use one or more project namespaces such as `@ocom/`

If a repo needs different paths, most of the important ones are configurable.

## Installation

Add it as a dev dependency in the Azure Functions app package:

```json
{
  "devDependencies": {
    "@cellix/config-rolldown": "workspace:*",
    "rolldown": "1.0.0-beta.55"
  }
}
```

## Rolldown Config Usage

Create a `rolldown.config.ts` in the app package:

```ts
import { defineConfig } from 'rolldown';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCellixAzureFunctionsRolldownConfig } from '@cellix/config-rolldown';

const appDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(appDir, '../..');

export default defineConfig(async () =>
  createCellixAzureFunctionsRolldownConfig({
    repoRoot,
    appPackageName: '@apps/api',
    applicationNamespaces: ['@ocom/'],
  }),
);
```

### Required Options

- `repoRoot`: absolute path to the monorepo root
- `appPackageName`: workspace package name of the Azure Functions app

### Common Project-Specific Options

- `applicationNamespaces`: workspace namespaces used by the application layer, for example `['@ocom/']`

### Optional Overrides

- `input`: defaults to `./dist/index.js`
- `outputDir`: defaults to `deploy/dist`
- `additionalExternal`: extra externals to preserve in the bundle
- `suppressEvalWarningsFor`: warning substrings to suppress for known Rolldown ecosystem noise

## Deploy Preparation

This package also owns the standard Cellix deploy artifact preparation step.

### CLI Usage

In the app package:

```json
{
  "scripts": {
    "prepare:deploy": "cellix-prepare-azure-functions-deploy"
  }
}
```

By default the CLI assumes:

- app directory is the current working directory
- bundle entry is `deploy/dist/index.js`
- `host.json` lives at `./host.json`
- deploy directory is `./deploy`

### Programmatic Usage

```ts
import { prepareCellixAzureFunctionsDeploy } from '@cellix/config-rolldown';

await prepareCellixAzureFunctionsDeploy({
  appDir: process.cwd(),
});
```

Optional overrides:

- `appDir`
- `deployDirName`
- `bundleEntryRelativePath`
- `hostJsonFilename`

## Recommended App Scripts

```json
{
  "scripts": {
    "build": "tsc --build && rolldown -c rolldown.config.ts",
    "prepare:deploy": "cellix-prepare-azure-functions-deploy",
    "prestart": "pnpm run clean && pnpm run build && pnpm run prepare:deploy"
  }
}
```

## What Projects Still Own

- the app package name, such as `@apps/api`
- project namespace configuration, such as `@ocom/`
- the app's `rolldown.config.ts`
- app runtime code and Azure Functions handlers
- whether to copy `local.settings.json` for local development

## Notes

- This package is intentionally Cellix-opinionated, not a general-purpose Rolldown wrapper.
- It is best suited for Azure Functions API apps that follow the Cellix workspace conventions.
- If a future Cellix repo diverges significantly in folder structure or deploy layout, this package may need small configuration additions rather than copy/paste changes.
