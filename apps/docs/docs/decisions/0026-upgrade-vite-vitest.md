---
sidebar_position: 26
sidebar_label: 0026 Upgrade Vite & Vitest
description: "Upgrade Vite to 8.x and Vitest to 4.x; adopt shared Vitest config and Storybook Playwright testing support."
status: accepted
date: 2026-03-31
contact: gidich nnoce14
deciders: gidich nnoce14
---

# Upgrade Vite to 8.x and Vitest to 4.x; standardize Vitest config

## Context and Problem Statement

The project needed to upgrade the Vite and Vitest toolchain to keep pace with Storybook and testing plugin ecosystems and to benefit from performance and feature improvements. The PR this ADR documents upgrades the repository to use Vite 8.x and Vitest 4.x and leverages the existing `@cellix/config-vitest` package to centralize test configuration (base/node/storybook configs and small runtime helpers); this PR adds additional helpers and configuration to that package.

During validation we discovered Storybook/Docs runtime expectations require additional doc dependencies and that Storybook-driven browser tests now rely on Playwright (via `@vitest/browser-playwright`). These changes introduce both new dev-dependencies and CI/runner requirements.

## Decision Drivers

- Keep Storybook, its docs plugins and Vitest-compatible plugins up-to-date and supported
- Reduce duplication by centralizing Vitest configuration in a shared package
- Support browser-based Storybook tests via Vitest + Playwright to validate interactive components
- Preserve consistent coverage reporting across packages (Istanbul provider)
- Minimize surprise breakages by documenting migration steps and required follow-ups
 - Improve build and test performance: Vite 8.x (and the move to Rolldown-based bundling) offers faster dev-server startup, dependency optimization and CI build times which improves developer feedback loops and test execution time.
 - Align bundling strategy: Vite's switch/compatibility with Rolldown reduces friction with our existing Rolldown-based Azure Functions bundling and simplifies shared tooling and rollup/rolldown plugin reuse.
 - Leverage Vitest typecheck: Use Vitest's built-in `typecheck` feature (via a dedicated `tsconfig.vitest.json`) to validate TypeScript rules for test files without adding test sources to a package's main `tsconfig.json`.

## Considered Options

- Do nothing (remain on existing Vite/Vitest versions)
- Upgrade Vite and Vitest repository-wide and extend the existing `@cellix/config-vitest` package (chosen)
- Upgrade only Vite or only Vitest and avoid browser-based Storybook tests (partial upgrade)

## Decision Outcome

Chosen option: Upgrade Vite to 8.x and Vitest to 4.x and extend the existing `@cellix/config-vitest` package to provide `baseConfig`, `nodeConfig`, `createStorybookVitestConfig` and small helpers (e.g., `getDirnameFromImportMetaUrl`).

Justification:
- Centralized configs reduce per-package duplication and make future upgrades easier.
- Vitest 4 offers improved browser/test-runner features needed by Storybook plugin integrations.
- Storybook and related plugins (docs, addon-vitest) require recent Vite releases for compatibility.

### Vitest `typecheck` and `tsconfig.vitest.json`

We adopted a package-local `tsconfig.vitest.json` strategy so Vitest's `typecheck` can validate test files without adding test sources to a package's production `tsconfig.json`. This avoids accidentally widening the compilation scope for production builds (for example, introducing test-only types, DOM libs, or test globals) and ensures the typecheck step produces no build artifacts.

Recommended practices:

- **Placement:** Put `tsconfig.vitest.json` next to the package `tsconfig.json` (package root). In a monorepo you can also reference a root/test tsconfig, but package-local files avoid cross-package leakage.
- **Extend the package config:** Have the vitest tsconfig extend the package `tsconfig.json` so path mappings and compiler options are inherited.
- **No emit:** Use `"noEmit": true` to ensure typechecking does not produce output files.
- **Include only tests:** Narrow `include` to test files so only test sources and fixtures are checked.

Example `tsconfig.vitest.json` (recommended minimal):

```json
{
   "extends": "./tsconfig.json",
   "compilerOptions": {
      "types": ["vitest/globals"],
      "noEmit": true
   },
   "include": [
      "src/**/*.test.ts",
      "src/**/*.spec.ts",
      "tests/**/*.ts"
   ]
}
```

How this is wired in the shared config

The shared `@cellix/config-vitest` base config enables the `typecheck` integration and points it at the package-local `tsconfig.vitest.json`. The shared config uses a conservative `include`/`exclude` set and runs `tsc` (or `vue-tsc` when appropriate):

```ts
test: {
   typecheck: {
      enabled: true,
      checker: 'tsc',
      tsconfig: 'tsconfig.vitest.json',
      include: [
         '**/*.{test,spec}.?(c|m)[jt]s?(x)',
         'tests/**/*.{test,spec}.?(c|m)[jt]s?(x)'
      ],
      exclude: ['**/node_modules/**','**/dist/**','**/coverage/**'],
      ignoreSourceErrors: true
   }
}
```

Implementation notes and CI guidance:

- Ensure each package that runs tests either contains a `tsconfig.vitest.json` or the shared config references a reachable test tsconfig. There are many package-local examples in the repo (`packages/*/tsconfig.vitest.json`).
- Do **not** add the vitest tsconfig to production `references` or to composite builds; keep it purely for test typechecking.
- Run `pnpm exec vitest run` (or `pnpm run test`) in CI to validate both tests and the typecheck step. Pin the `vitest` version used in CI so experimental `typecheck` behaviour is deterministic.
- If a package requires DOM/lib typings for browser tests, ensure those libs are available via the package's `tsconfig.vitest.json` (or via the shared preset it extends).

Caveats:

- Vitest's `typecheck` integration is evolving; prefer pinning and validating in CI.
- If packages use path-mapped imports, make sure `tsconfig.vitest.json` extends the package tsconfig so those mappings resolve during typechecking.


### Consequences

- Good: Modernizes test and build toolchain; reduced duplication via `@cellix/config-vitest`.
- Good: Enables deterministic Storybook browser tests using Playwright providers.
- Good: Enables TypeScript rule validation for tests via Vitest's `typecheck` feature without requiring test files to be added to package `tsconfig.json`, keeping package TypeScript configs focused on source code only.
- Bad: Browser-based Storybook tests introduce Playwright runtime dependencies (browsers) and CI setup changes.
- Bad: Some Storybook docs dependencies must be present in the workspace (e.g., `@mdx-js/react`, `markdown-to-jsx`) — missing packages will cause Vite optimize/resolve failures for Storybook tests.
- Bad: Vitest 4 contains experimental features (notably the `typecheck` integrations with `tsc`/`vue-tsc`) and introduces breaking changes across minor versions; pinning is recommended and experimental features should be validated in CI.

## Validation

To validate the migration and the ADR:

1. Ensure the workspace lockfile and devDependencies contain updated Vite/Vitest and required Storybook/test deps:
   - add or update `vite` to 8.x in overrides if needed
   - add or update `vitest` to 4.x (pin to a tested patch version)
   - add `@vitest/browser-playwright`, `@vitest/browser` and `playwright` (dev)
   - add Storybook docs deps: `@mdx-js/react` and `markdown-to-jsx` (dev)
2. Run `pnpm install` and update the lockfile.
3. Install Playwright browsers on CI and development machines:

```bash
pnpm exec playwright install chromium
```

4. Run package tests and coverage across the monorepo:

```bash
pnpm run test:coverage
```

5. Verify Storybook browser tests run without timeouts and that coverage reports include/omit files according to `@cellix/config-vitest` excludes.

6. Run Snyk (`pnpm run snyk`) and SonarCloud checks as part of `pnpm run verify`.
7. Verify Vitest `typecheck` integration: confirm packages using the shared config include or reference a `tsconfig.vitest.json` (or equivalent) and that running `vitest run` surfaces TypeScript errors from test files without needing to add test paths to the package `tsconfig.json`.

## Pros and Cons of the Options

### Upgrade Vite & Vitest and adopt shared config (selected)

- Good: Centralized, repeatable configuration; future upgrades simplified
- Good: Enables modern Storybook + Vitest integrations
- Bad: Requires CI and developer environment changes (Playwright, browsers, extra devDeps)
- Bad: Potential for transient breakages; requires careful pinning and compatibility testing

### Partial upgrade or avoid Storybook browser tests

- Good: Lower immediate friction (no Playwright setup)
- Bad: Loses coverage for interactive Storybook-driven tests and reduces parity with component behavior in browsers

## More Information & Follow-ups

 - Ensure packages that run tests with the shared config either have a `tsconfig.vitest.json` or rely on the root/test config referenced by the shared config so Vitest's `typecheck` can validate test files without modifying package `tsconfig.json`.
 - Monitor Snyk for newly added devDependencies and address any findings.
 - Revisit this ADR if future Vitest/Vite versions require a different strategy (e.g., change of coverage provider, removal of browser-based tests).

---

References:
- PR: Upgrade Vite & Vitest (branch: nnoce14/issue168)
- Config: `packages/cellix/config-vitest` (contains `baseConfig`, `nodeConfig`, `storybook.config.ts`)
- Storybook Vitest integration: `@storybook/addon-vitest` and `@vitest/browser-playwright`

