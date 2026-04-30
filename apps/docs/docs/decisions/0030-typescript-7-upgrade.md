---
sidebar_position: 30
sidebar_label: 0030 TypeScript 7.0 Upgrade
description: "Upgrading the monorepo from TypeScript 6.0.2 to the TypeScript 7.0 native Go compiler (tsgo), removal of all TS 6.0 deprecated options, and full TS 7.0 configuration."
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
- **Ecosystem compatibility**: Since `typescript@7.0` is not yet on npm, the `@typescript/native-preview` package is installed alongside `typescript@6.0.x` to provide the `tsgo` binary.

## Considered Options

- Install `typescript@6.0.x` (JS compiler) alongside `@typescript/native-preview` (tsgo binary) as two separate catalog entries
- Use npm alias (`typescript: "npm:@typescript/native-preview@7.x"`) to make `tsgo` the primary compiler across the workspace
- Wait for `typescript@7.0` to ship on npm before making any changes

## Decision Outcome

Chosen option: "Install `typescript@6.0.x` alongside `@typescript/native-preview` as two separate catalog entries", because it keeps the dependency tree simple (no npm aliases), provides the real JS compiler for tooling and programmatic API usage, and provides the `tsgo` binary for builds.

### Consequences

- Good, because all workspace builds use `tsgo` from `@typescript/native-preview` for ~10× faster type-checking.
- Good, because `typescript@6.0.x` provides the standard JS-based compiler API for tooling (archunit-tests, editor integration, programmatic usage).
- Good, because all deprecated options (`baseUrl`, `ignoreDeprecations: "6.0"`) have been removed — the codebase is fully TS 7.0 compliant.
- Good, because there are only two TypeScript packages with clear roles: `typescript` (JS compiler) and `@typescript/native-preview` (tsgo binary). No npm aliases or compat packages.
- Neutral, because `@typescript/native-preview` is a dev-channel release and must be pinned to specific versions for reproducibility.
- Neutral, because when `typescript@7.0` ships on npm, the catalog entry can be updated to `typescript: "7.0.0"` and `@typescript/native-preview` can be removed.

## Changes Made

### 1. Catalog: Two TypeScript packages with clear roles

Updated `pnpm-workspace.yaml` catalog with two entries (no npm aliases):

```yaml
typescript: 6.0.3
"@typescript/native-preview": 7.0.0-dev.20260428.1
```

- `typescript@6.0.3`: The real JS-based TypeScript compiler. Used by tooling, editor, programmatic API (e.g., `ts.createSourceFile`), and all workspace packages via `catalog:`.
- `@typescript/native-preview@7.0.0-dev.20260428.1`: Provides the `tsgo` binary for builds. Installed at the root only.

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

### 8. Archunit-tests use the standard `typescript` package

The archunit-tests packages (`@ocom/archunit-tests`, `@cellix/archunit-tests`) use the TypeScript compiler API programmatically (e.g., `ts.createSourceFile`, `ts.readConfigFile`). They import from `typescript` which resolves to the JS-based TypeScript 6.0.3 compiler via the catalog.

## tsgo Status

The `@typescript/native-preview` package provides the native Go compiler (`tsgo`). Key notes:

- **Current version**: `7.0.0-dev.20260428.1`
- **Binary**: `tsgo` (replaces `tsc`)
- **Compatibility**: Full compatibility with TS 6.0 tsconfig options (minus removed deprecations)
- **Parallelization**: Supports `--checkers` (default 4) and `--builders` flags for CI tuning
- **When stable ships**: Update `typescript` to `7.0.0` in the catalog and remove `@typescript/native-preview`

## Validation

- `pnpm run build`: All tasks pass with `tsgo` (TS 7.0.0-dev.20260428.1).
- `pnpm run test`: All test tasks pass.
- Zero `baseUrl` entries remain in any tsconfig.
- Zero `ignoreDeprecations` entries remain in any tsconfig.

## Future Optimization: Parallel Type-Checking

TypeScript 7.0 introduces `--checkers` and `--builders` flags for parallelizing type-checking within a project and building multiple projects simultaneously.

Since Turborepo already parallelizes builds *across* packages, and most individual packages are relatively small, the per-package benefit of `--checkers` is limited in our current setup. Adding the flag would require modifying all 34+ package build scripts.

When this becomes worth revisiting:
- If a single large package becomes a build bottleneck, add `--checkers 4` to its build script
- If Turborepo is ever replaced with a root-level `tsgo --build`, use both `--builders` and `--checkers` for full parallelism
- Monitor tsgo for a tsconfig-level equivalent of `--checkers` to avoid per-package script changes

Reference: [TypeScript 7.0 Beta — Project Reference Builder Parallelization](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-beta/)

## `@typescript/typescript6` Compatibility Alias

The TS 7.0 blog introduces `@typescript/typescript6` as a compatibility alias for tools that use TypeScript's programmatic JS API (e.g., `ts.createSourceFile`, `ts.readConfigFile`) when `typescript` in the catalog is bumped to 7.0.

**Why it is not needed now:**  
Our `pnpm-workspace.yaml` catalog currently pins `typescript: 6.0.3`. Tools like `knip`, `graphql-codegen`, and our `archunit-tests` packages all resolve `typescript` to `6.0.3` directly — no alias is required.

**When it will be needed:**  
Once the official `typescript@7.0.0` ships on npm and we update the catalog to point to it, `tsgo` becomes the default compiler. At that point, tools using the JS compiler API will break because `tsgo` does not export the same programmatic API. The fix is to add `@typescript/typescript6` to the catalog and reference it in those packages (archunit-tests, and any tooling that imports `typescript` for its API).

**Migration trigger:**  
Update the catalog entry `typescript: 7.0.x` → also add `@typescript/typescript6: 6.0.x` and update `archunit-tests/package.json` in both `packages/cellix` and `packages/ocom` to depend on it instead of `typescript` for their programmatic API usage.

## More Information

- [TypeScript 7.0 Beta Announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-beta/)
- [ADR-0027: TypeScript 6.0 Upgrade](./0027-typescript-6-upgrade.md)
- [ADR-0023: TypeScript Go (tsgo) Migration](./0023-tsgo-migration.md)
- [`@typescript/native-preview` on npm](https://www.npmjs.com/package/@typescript/native-preview)
