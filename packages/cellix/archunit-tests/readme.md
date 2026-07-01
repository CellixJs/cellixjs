# @cellix/archunit-tests

Architectural fitness tests for the reusable Cellix framework packages.

## Purpose

This package owns architecture tests for the `@cellix/*` framework layer.

It exists to keep framework-level conventions separate from `@ocom/*` application rules so the Cellix platform can evolve as a reusable internal framework with its own guardrails.

## What It Checks

Current rules in this package include:

- TypeScript compiler output conventions for `packages/cellix/*`
- circular dependency checks across Cellix package source graphs
- framework boundary checks, such as `ui-core` not depending on OCom UI code or app code
- API startup composition through infrastructure, context, application services, handlers, and startup, including service initialization during Azure `appStart`
- UI application bootstrap composition, including root validation, configured providers, and React Router
- Serenity/Cucumber managed-world initialization, concrete finalized server infrastructure, lifecycle cleanup, context loaders, and Screenplay delegation

## Application Composition

Register the API rule from the API package itself:

```typescript
import { describeApiCompositionTests } from '@cellix/archunit-tests/api';

describeApiCompositionTests({ apiIndexPath: 'src/index.ts' });
```

UI applications configure the providers their bootstrap is expected to compose:

```typescript
import { describeUiAppCompositionTests } from '@cellix/archunit-tests/ui-app';

describeUiAppCompositionTests({
	appRoot: 'src',
	requiredProviders: ['ThemeProvider', 'BrowserRouter', 'AuthProvider'],
});
```

## Serenity Suites

Each acceptance or E2E package points the convention at its source root. Contexts are discovered automatically from the immediate directories under `src/contexts`. Infrastructure-backed suites can additionally require scenario cleanup and suite shutdown:

```typescript
import { describeSerenitySuiteConventionTests } from '@cellix/archunit-tests/serenity';

describeSerenitySuiteConventionTests({
	suiteRoot: 'src',
	requireManagedCleanup: true,
});
```

The Serenity convention requires a managed world and lifecycle, a central context loader, context-local `*.steps.ts(x)` files, and steps that delegate through context-local Tasks, Interactions, or Questions. Suites that require managed cleanup must also export finalized `ApiInfrastructure` or `E2EInfrastructure` with at least one server; E2E infrastructure must include a UI portal.

## Verifying the Architecture Tests

The package includes intentionally incomplete portable projects under `src/fixtures/architecture-stubs/`. The package's normal architecture suite points each checker at its stub and asserts that the expected violations are reported. These test-of-the-tests run automatically through `test:arch`; no separate stub command or test area is required.

## What It Does Not Own

This package does not enforce OCom application-layer rules.

Those belong in @ocom-verification/archunit-tests.

## Running the Tests

Run just this package:

```bash
pnpm --filter @cellix/archunit-tests test
```

Or as part of the repo-wide validation flow:

```bash
pnpm run test:arch
```

## Notes

- The rules in this package should stay framework-focused and avoid application-specific assumptions where possible.
- If a new Cellix package intentionally breaks the standard compiled-library shape, add a narrow exception in the relevant test rather than broadening the rule.
- This package is intentionally excluded from coverage gates; coverage expectations apply to consumer app/framework packages.
