---
sidebar_position: 27
sidebar_label: 0027 TypeScript 6.0 Upgrade
description: "Upgrading the monorepo to TypeScript 6.0 and documenting breaking-change handling, config adjustments, and TypeScript 7.0 readiness validation."
status: accepted
date: 2026-04-01
contact: nnoce14
deciders: gidich nnoce14
consulted:
informed:
---

# TypeScript 6.0 Upgrade

## Context and Problem Statement

TypeScript 6.0 was released as a significant transition release designed to act as the bridge between TypeScript 5.x and the upcoming TypeScript 7.0 native Go port. The release introduces several breaking changes, deprecations, and new features — and explicitly documents how projects should prepare for TypeScript 7.0. This ADR records the decisions made while upgrading the CellixJS monorepo from TypeScript 5.9.3 to TypeScript 6.0.2.

## Decision Drivers

- **TS 7.0 preparation**: TypeScript 6.0 is the last JS-based release; TS 7.0 will be the native Go port and this upgrade is the on-ramp.
- **Breaking-change compliance**: TS 6.0 hard-deprecated several legacy options and syntax forms that could silently cause issues if not addressed now.
- **Third-party compatibility**: Some dependency type declarations use syntax that TS 6.0 now errors on; these must be resolved.
- **Strict type hygiene**: The shared base config keeps `"skipLibCheck": false`; package-level overrides should remain exceptional and narrowly scoped.

## Considered Options

- Upgrade to TypeScript 6.0.2 with all necessary config and dependency fixes
- Stay on TypeScript 5.9.3 and defer until TS 7.0 is released
- Upgrade TypeScript but suppress all new errors with `ignoreDeprecations: "6.0"`

## Decision Outcome

Chosen option: "Upgrade to TypeScript 6.0.2 with targeted fixes", because it resolves breaking changes at their source, fully validates TS 7.0 readiness, and keeps the codebase aligned with the path documented in ADR-0023.

### Consequences

- Good, because the monorepo is now on the current TypeScript release and one step closer to TS 7.0.
- Good, because `stableTypeOrdering` validation confirmed zero ordering-related type differences between TS 6.0 and TS 7.0 ordering semantics across all 54 test:coverage tasks.
- Good, because Playwright tooling was aligned on 1.59.0, resolving deprecated `module` namespace declarations in `playwright-core` while keeping the test runner and runtime in sync.
- Neutral, because the `DOM.Iterable` removal from UI tsconfigs is a cosmetic simplification with no runtime impact.
- Neutral, because the docs package's `@docusaurus/tsconfig` still depends on the deprecated `baseUrl` option; this is suppressed with `ignoreDeprecations: "6.0"` until Docusaurus ships an updated config.

## Changes Made

### 1. Catalog: TypeScript `5.9.3` → `6.0.2`

Updated `pnpm-workspace.yaml` catalog entry. All 32 workspace packages reference TypeScript via `catalog:`, so this single change updates the entire monorepo.

### 2. Playwright aligned to `1.59.0` (`@playwright/test` + pnpm overrides)

`playwright-core@1.57.0` uses the `module Foo {}` namespace declaration syntax which TypeScript 6.0 hard-errors on (TS1540). The fix landed in Playwright `1.59.0`. Since `playwright` is pulled in as a peer dependency of `@vitest/browser-playwright` (with a `"*"` version range), the repo pins `@playwright/test` to `1.59.0` in `devDependencies` and adds overrides in `pnpm.overrides` in `package.json`:

```json
"@playwright/test": "1.59.0",
"playwright-core": "1.59.0",
"playwright": "1.59.0"
```

This preserves the base `"skipLibCheck": false` posture without requiring a blanket suppression.

### 3. `DOM.Iterable` removed from UI tsconfigs

TypeScript 6.0 merges `lib.dom.iterable.d.ts` and `lib.dom.asynciterable.d.ts` into `lib.dom.d.ts`. The explicit `"DOM.Iterable"` entry in `lib` arrays is now redundant. Removed from:

- `packages/cellix/ui-core/tsconfig.json`
- `apps/ui-community/tsconfig.json`
- `packages/ocom/ui-components/tsconfig.json`

### 4. `apps/docs` tsconfig: `baseUrl` removed, `ignoreDeprecations: "6.0"` added

`baseUrl` is deprecated in TypeScript 6.0. The `apps/docs` tsconfig extended both `@cellix/config-typescript/base` and `@docusaurus/tsconfig`. The latter defines `"baseUrl": "."` internally and the docs tsconfig duplicated it. The duplicate was removed. Because `@docusaurus/tsconfig` still carries `baseUrl` and we cannot change a third-party package, `"ignoreDeprecations": "6.0"` was added to the docs tsconfig as a temporary suppression for the inherited config until Docusaurus drops the deprecated option. All other packages are unaffected since none use `baseUrl`.

## TypeScript 7.0 Readiness Validation (`--stableTypeOrdering`)

TypeScript 6.0 introduces a `--stableTypeOrdering` diagnostic flag that aligns type-ordering behaviour with TypeScript 7.0's deterministic parallel checker. The flag is explicitly not intended for permanent use (it causes up to 25% build slowdown), but is the recommended way to surface ordering-related type differences between TS 6.0 and TS 7.0 before migration.

**Procedure followed:**

1. Added `"stableTypeOrdering": true` to `packages/cellix/config-typescript/tsconfig.base.json`.
2. Ran `pnpm run build` — all 31 tasks passed with zero errors.
3. Ran `pnpm run test:coverage` — all 54 tasks passed with zero errors.
4. Removed `"stableTypeOrdering": true` from `tsconfig.base.json` before committing.

**Result:** The CellixJS codebase has **zero type-ordering differences** between TypeScript 6.0 and TypeScript 7.0 semantics. No explicit type annotations were required to resolve ordering-sensitive inference.

When preparing for TypeScript 7.0, re-running this flag against the TS 7.0 compiler will be the recommended first diagnostic step (see ADR-0023 remediation plan).

## TS 7.0 Forward-Looking Recommendations

The following are config improvements that can be adopted now to further align with TypeScript 7.0, or at the time of the TS 7.0 migration:

| Recommendation | Detail |
|---|---|
| Re-run `stableTypeOrdering` against TS 7.0 RC | When TS 7.0 is available, run `pnpm run build` and `pnpm run test:coverage` with this flag enabled before migrating. |
| Upgrade `lib` from `"ES2023"` to `"ES2025"` | TS 6.0 adds `es2025` lib support (adds `RegExp.escape`, `Promise.try`, `Iterator` and `Set` methods). Update `tsconfig.base.json` `lib` when the team confirms target runtimes support ES2025. |
| Update `@docusaurus/tsconfig` dependency | Track Docusaurus for a config update that drops `baseUrl`, at which point `ignoreDeprecations: "6.0"` can be removed from `apps/docs/tsconfig.json`. |
| Reassess `ignoreDeprecations: "6.0"` in docs | TypeScript 7.0 will not support any TS 6.0 deprecated options at all. Before migrating to TS 7.0, Docusaurus must drop `baseUrl` or the docs build will need a different resolution (e.g., `paths`-only config). |
| Continue monitoring ADR-0023 blockers | The `stableTypeOrdering` validation result removes one uncertainty from the TS 7.0 migration plan; the remaining blockers (mongoose TS4109, TS2742 inferred-type errors) are tracked in ADR-0023. |

## Validation

- `pnpm run build`: 31/31 tasks pass with TypeScript 6.0.2.
- `pnpm run test:coverage`: 54/54 tasks pass with TypeScript 6.0.2.
- `pnpm run build` (with `stableTypeOrdering: true`): 31/31 tasks pass — no TS 7.0 ordering differences detected.
- `pnpm run test:coverage` (with `stableTypeOrdering: true`): 54/54 tasks pass — no TS 7.0 ordering differences detected.

## More Information

- [TypeScript 6.0 Announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/)
- [ADR-0023: TypeScript Go (tsgo) Migration](./0023-tsgo-migration.md)
- [Playwright 1.59.0 Release Notes](https://playwright.dev/docs/release-notes)
- [`--stableTypeOrdering` PR](https://github.com/microsoft/TypeScript/pull/63084)
