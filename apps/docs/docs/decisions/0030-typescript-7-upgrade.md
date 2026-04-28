---
sidebar_position: 30
sidebar_label: 0030 TypeScript 7.0 Upgrade
description: "Upgrading the monorepo from TypeScript 6.0.2 to the TypeScript 7.0 native Go compiler (tsgo) via npm alias, removal of all TS 6.0 deprecated options, and full TS 7.0 configuration."
status: accepted
date: 2026-04-28
contact: nnoce14
deciders: gidich nnoce14
consulted:
informed:
---

# TypeScript 7.0 Upgrade (Native Go Compiler)

## Context and Problem Statement

TypeScript 7.0 is a ground-up rewrite of the TypeScript compiler in Go (`tsgo`), delivering approximately 10× faster type-checking and build performance. It is currently published as `@typescript/native-preview` on npm (the `typescript@7.0` package has not yet shipped). The CellixJS monorepo was on TypeScript 6.0.2 (see ADR-0027) and needed to migrate to the native compiler. Several previously-deprecated compiler options (`baseUrl`, `ignoreDeprecations: "6.0"`) were identified in ADR-0027 as requiring removal before TS 7.0. Reference: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-beta/

## Decision Drivers

- **Performance**: The native Go compiler offers ~10× faster type-checking and builds, significantly improving developer feedback loops and CI times.
- **TS 7.0 readiness**: ADR-0027 identified several deprecated options (`baseUrl`, `ignoreDeprecations: "6.0"`) that TS 7.0 removes entirely; these had to be cleaned up.
- **Breaking-change compliance**: TS 7.0 drops all TS 6.0 deprecated options, changes default behavior for `types` arrays (defaults to `[]`), and replaces `tsc` with `tsgo`.
- **Ecosystem compatibility**: Since `typescript@7.0` is not yet on npm, an npm alias strategy is needed so that tooling depending on the `typescript` package resolves to the native preview.

## Considered Options

- Use npm alias (`typescript: "npm:@typescript/native-preview@7.x"`) to make `tsgo` the primary compiler across the workspace
- Keep TypeScript 6.0.x as primary and install `@typescript/native-preview` only for parallel validation
- Wait for `typescript@7.0` to ship on npm before making any changes

## Decision Outcome

Chosen option: "Use npm alias to make `@typescript/native-preview` the primary TypeScript compiler", because it makes the codebase run on the TS 7.0 native compiler today, provides immediate ~10× build performance gains, and eliminates all deprecated configuration before the native compiler enforces their removal.

### Consequences

- Good, because all workspace builds now run on the TS 7.0 native Go compiler, with ~10× faster type-checking.
- Good, because all deprecated options (`baseUrl`, `ignoreDeprecations: "6.0"`) have been removed — the codebase is fully TS 7.0 compliant.
- Good, because `@typescript/typescript6` provides a fallback if any tooling requires the JS-based compiler during the transition.
- Neutral, because the npm alias approach (`typescript → @typescript/native-preview`) will need updating when `typescript@7.0` ships officially on npm (simply change the catalog entry back to a direct version).
- Neutral, because `@typescript/native-preview` is a dev-channel release and must be pinned to specific versions for reproducibility.

## Changes Made

### 1. Catalog: TypeScript aliased to `@typescript/native-preview@7.0.0-dev.20260428.1`

Updated `pnpm-workspace.yaml` catalog to use an npm alias:

```yaml
typescript: "npm:@typescript/native-preview@7.0.0-dev.20260428.1"
"@typescript/native-preview": 7.0.0-dev.20260428.1
"@typescript/typescript6": "^6.0.3"
```

All 32+ workspace packages reference TypeScript via `catalog:`, so this single change upgrades the entire monorepo. The `@typescript/typescript6` entry provides a JS-based compiler fallback.

### 2. All build scripts migrated from `tsc` to `tsgo`

TS 7.0 ships `tsgo` instead of `tsc`. All package `build` scripts were updated:

- `"build": "tsc --build"` → `"build": "tsgo --build"`
- `"build": "tsc --noEmit"` → `"build": "tsgo --noEmit"`
- `"typecheck": "tsc"` → `"typecheck": "tsgo"`

### 3. Removed `baseUrl` from all tsconfigs

Removed the deprecated `baseUrl` option from tsconfig files where it was used. TS 7.0 does not support `baseUrl`; `paths` mappings now work without it.

### 4. Removed all `ignoreDeprecations: "6.0"`

Removed every instance of `"ignoreDeprecations": "6.0"` across the monorepo. TS 7.0 does not honor this option.

### 5. Updated `paths` to work without `baseUrl`

Updated tsconfig `paths` mappings to use paths relative to the tsconfig file location instead of relying on `baseUrl`-relative resolution.

### 6. Added explicit `types` arrays

TS 7.0 defaults `types` to `[]` (no implicit global types). Added explicit `types` entries where needed:

- `@cellix/config-typescript/tsconfig.vitest.json`: `"types": ["vitest/globals"]`
- Node packages extend `@cellix/config-typescript/node` which sets `"types": ["node"]`
- UI packages already had explicit `"types": ["vite/client"]`

### 7. Bumped `@cellix/config-typescript` version

Version bumped from `1.0.0` → `1.0.3` to reflect the TS 7.0 configuration changes.

### 8. Migrated archunit-tests to `@typescript/typescript6`

The archunit-tests packages (`@ocom/archunit-tests`, `@cellix/archunit-tests`) use the TypeScript compiler API programmatically (e.g., `ts.createSourceFile`, `ts.readConfigFile`). Since `@typescript/native-preview` does not export a `"."` entry (it uses subpath exports like `typescript/sync`), these packages now import from `@typescript/typescript6` which provides the JS-based TypeScript 6.0 API.

### 9. Added `build:tsgo` and `typecheck:tsgo` convenience scripts

Root `package.json` now includes:

- `build:tsgo`: `tsgo --build` — direct workspace-wide build
- `typecheck:tsgo`: `tsgo --noEmit` — type-checking only

## tsgo Status

The `@typescript/native-preview` package provides the native Go compiler (`tsgo`). Key notes:

- **Current version**: `7.0.0-dev.20260428.1`
- **Binary**: `tsgo` (replaces `tsc`)
- **Compatibility**: Full compatibility with TS 6.0 tsconfig options (minus removed deprecations)
- **Parallelization**: Supports `--checkers` (default 4) and `--builders` flags for CI tuning
- **When stable ships**: Replace the npm alias with `typescript: "7.0.0"` in the catalog

## Validation

- `pnpm run build`: All tasks pass with `tsgo` (TS 7.0.0-dev.20260428.1).
- `pnpm run test`: All test tasks pass.
- Zero `baseUrl` entries remain in any tsconfig.
- Zero `ignoreDeprecations` entries remain in any tsconfig.

## More Information

- [TypeScript 7.0 Beta Announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-beta/)
- [ADR-0027: TypeScript 6.0 Upgrade](./0027-typescript-6-upgrade.md)
- [ADR-0023: TypeScript Go (tsgo) Migration](./0023-tsgo-migration.md)
- [`@typescript/native-preview` on npm](https://www.npmjs.com/package/@typescript/native-preview)
