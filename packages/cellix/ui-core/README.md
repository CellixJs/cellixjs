# @cellix/ui-core

`@cellix/ui-core` is a standalone React component package from the Cellix framework. It provides reusable UI primitives for applications that want a consistent loading-state pattern and an auth-gating wrapper without depending on project-specific component structure.

- Purpose: provide reusable UI abstractions that can be adopted in different React applications
- Scope: general-purpose components, loading states, and auth-gating primitives
- Runtime: TypeScript, React, Ant Design, `react-router-dom`, and `react-oidc-context`

## Overview

The current public contract is intentionally small:

- `ComponentQueryLoader`: render loading, error, success, and empty states from one component contract
- `RequireAuth`: guard protected content behind the current OIDC auth state
- `FeatureFlagProvider`: load and refresh feature flags from a caller-provided JSON endpoint
- `MaintenanceMessageProvider`: render maintenance state from feature flags and a caller-provided runtime adapter

Import from the package root only:

```tsx
import { ComponentQueryLoader, FeatureFlagProvider, MaintenanceMessageProvider, RequireAuth } from '@cellix/ui-core';
```

`@cellix/ui-core/components/*` is not a supported public API. If the package later needs additional entrypoints, they should be added as explicit, documented groupings rather than file-structure-driven deep exports.

## Install

Install the package together with its peer dependencies:

```sh
npm install @cellix/ui-core react react-dom antd react-router-dom react-oidc-context @apollo/client graphql
```

The package currently declares Apollo and GraphQL peers. The maintenance runtime itself does not require Apollo, OIDC, or router providers; applications supply their own clock, authentication state, and kickout callback. Package publication and peer-dependency cleanup are separate from this integration.

## Usage

### ComponentQueryLoader

Use `ComponentQueryLoader` when a UI branch needs one consistent decision point for loading, error, success, and empty states:

```tsx
import { ComponentQueryLoader } from '@cellix/ui-core';

function UserProfile() {
	return (
		<ComponentQueryLoader
			error={undefined}
			hasData={{ id: 'user-1' }}
			hasDataComponent={<div>Loaded profile</div>}
			loading={false}
			noDataComponent={<div>No profile found</div>}
		/>
	);
}
```

`ComponentQueryLoader` selects its rendered branch in this order:

1. `error`
2. `loading`
3. `hasData`
4. `noDataComponent` or the default empty fallback

If you do not supply `errorComponent`, `loadingComponent`, or `noDataComponent`, the component falls back to Ant Design skeleton placeholders.

### RequireAuth

Use `RequireAuth` when a route or component subtree should only render for authenticated users:

```tsx
import { RequireAuth } from '@cellix/ui-core';

function ProtectedRoute() {
	return (
		<RequireAuth forceLogin={true}>
			<div>Private content</div>
		</RequireAuth>
	);
}
```

Behavior summary:

- Loading auth state: renders a blocking loading UI
- Authenticated state: renders `children`
- Auth error state: redirects to `/`
- Unauthenticated state: triggers `signinRedirect()`

When `forceLogin` is `true`, the component also stores the current route in `sessionStorage.redirectTo` before redirecting so the application can restore that location after sign-in.

### Feature Flags And Maintenance Messages

Wrap an application in `FeatureFlagProvider` to load a JSON document with a `FeatureFlags` array of `{ Name, Value }` entries. Use `useFeatureFlags` to resolve values by name.

`MaintenanceMessageProvider`, `ImpendingMessage`, `MaintenanceMessage`, and `useMaintenanceMessage` use that feature-flag context. This feature is optional: applications that do not mount it do not run maintenance polling or kickout actions.

The application supplies `runtime.getServerDate(): Promise<string | undefined>`, `runtime.isAuthenticated`, and `runtime.onMaintenanceKickout(): void`. Keep callbacks stable across renders. These maintenance components do not require Apollo, OIDC, or router providers. Cellix does not execute application GraphQL queries, clear caches, or choose logout destinations.

```tsx
import { FeatureFlagProvider, MaintenanceMessageProvider, MaintenanceMessage, ImpendingMessage, useMaintenanceMessage } from '@cellix/ui-core';
import type { FeatureFlagConfig, MaintenanceMessageRuntime, MaintenanceMessageDisplayConfig } from '@cellix/ui-core';

function MaintenanceScope({ flags, runtime, displayConfig }: {
	flags: FeatureFlagConfig;
	runtime: MaintenanceMessageRuntime;
	displayConfig: MaintenanceMessageDisplayConfig;
}) {
	return (
		<FeatureFlagProvider config={flags}>
			<MaintenanceMessageProvider portalKey="CUSTOMER" runtime={runtime} timeoutBeforeMaintenance={120}>
				<Content displayConfig={displayConfig} />
			</MaintenanceMessageProvider>
		</FeatureFlagProvider>
	);
}

function Content({ displayConfig }: { displayConfig: MaintenanceMessageDisplayConfig }) {
	const { isMaintenance, isImpending } = useMaintenanceMessage();
	if (isMaintenance) return <MaintenanceMessage portalKey="CUSTOMER" displayConfig={displayConfig} />;
	return <>{isImpending && <ImpendingMessage portalKey="CUSTOMER" displayConfig={displayConfig} isRootPage />}<main>Application content</main></>;
}
```

For your portal suffix, supply string-valued flags `MAINTENANCE_UPCOMING_*`, `MAINTENANCE_IMPENDING_TIMESTAMP_*`, `MAINTENANCE_START_TIMESTAMP_*`, `MAINTENANCE_END_TIMESTAMP_*`, `MAINTENANCE_MSG_IMPENDING_*`, and `MAINTENANCE_MSG_SYSTEM_*`. Only `"true"` enables scheduling. Checks run immediately and every five seconds. Each window includes its start and excludes its end. Unresolved flags retain initial state; clock request failures are logged and retain the previous state.

`displayConfig` supplies `locale`, `timeZone`, Day.js `dateTimeFormat` and `dateFormat`, and CSS `impendingTop`/`approachingTop` offsets. Load non-English Day.js locales in your application. Templates support `##startTimestampStr##`, `##endTimestampStr##`, and `##timeRangeStr##`. HTML is parsed, not sanitized: use trusted configuration. Applications decide which routes to replace; this is not backend access enforcement.

Authenticated users approaching maintenance see a per-second countdown. At zero, the runtime kickout callback is invoked without awaiting it. No new kickout policy is imposed on users arriving during an already-active maintenance window.

Migration from the in-progress API: replace `serverDateDocument` with `runtime` and supply explicit portal identity and display settings. Preserve your query fetch policy, logout ordering, and configuration values in the application adapter. Existing hook/context exports remain available.

## Export Reference

### `ComponentQueryLoader(props)`

Use when:

- a query-backed component needs one public loading/error/empty-state abstraction
- different screens should share the same state rendering contract

Key props:

- `error`: active error state, if any
- `loading`: whether the request is still in progress
- `hasData`: truthy signal that the success branch should render
- `hasDataComponent`: success-state element
- `errorComponent`, `loadingComponent`, `noDataComponent`: optional branch overrides

### `RequireAuth(props)`

Use when:

- protected UI should only render after the OIDC context reports an authenticated user
- a route needs to redirect into the configured sign-in flow

Key props:

- `children`: protected content
- `forceLogin`: when `true`, preserve the current route before redirecting

### `FeatureFlagProvider(props)`

Key props:

- `config.url`: remote feature-flag JSON endpoint; an empty string uses local fallback values
- `config.fallbackFlagValues`: fallback `FeatureFlags` document used when remote loading fails and in Storybook
- `config.cache`: optional refresh cache duration in milliseconds

### `MaintenanceMessageProvider(props)`

Key props:

- `portalKey`: required application-selected feature-flag suffix
- `runtime`: server-clock function, authentication state, and kickout callback
- `timeoutBeforeMaintenance`: optional countdown threshold in seconds; defaults to `120`
- `storybookShowImpendingMessage`, `storybookShowMaintenanceMessage`: optional Storybook state overrides

`MaintenanceMessageDisplayConfig` describes the presentation settings accepted by both message components. `MaintenanceMessageRuntime` and `MaintenanceMessageProviderProps` describe the integration boundary. `useMaintenanceMessage` returns `MaintenanceMessageInterface`; `MaintenanceMessageContext` remains available for controlled consumers and stories.

## Integration Notes

- `ComponentQueryLoader` assumes Ant Design is available because it uses `message` and `Skeleton`
- `RequireAuth` assumes the app has already configured `react-router-dom` and `react-oidc-context`
- Storybook stories in this repository are development artifacts and not part of the package contract

## Development

### Storybook

Run Storybook to develop or review the components interactively:

```sh
pnpm --filter @cellix/ui-core storybook
```

### Tests

Run the package tests:

```sh
pnpm --filter @cellix/ui-core test
```

Run coverage:

```sh
pnpm --filter @cellix/ui-core test:coverage
```

## Scripts

- Build: `pnpm --filter @cellix/ui-core build`
- Clean: `pnpm --filter @cellix/ui-core clean`
- Test: `pnpm --filter @cellix/ui-core test`
- Lint/Format: `pnpm --filter @cellix/ui-core lint` / `pnpm --filter @cellix/ui-core format`
- Storybook: `pnpm --filter @cellix/ui-core storybook`
- Build Storybook: `pnpm --filter @cellix/ui-core build-storybook`

Package boundary and release expectations are documented in [manifest.md](./manifest.md).
