# @cellix/ui-core

`@cellix/ui-core` is a standalone React component package from the Cellix framework. It provides reusable UI primitives for applications that want a consistent loading-state pattern and an auth-gating wrapper without depending on project-specific component structure.

- Purpose: provide reusable UI abstractions that can be adopted in different React applications
- Scope: general-purpose components, loading states, and auth-gating primitives
- Runtime: TypeScript, React, Ant Design, `react-router-dom`, and `react-oidc-context`

## Overview

The current public contract is intentionally small:

- `ComponentQueryLoader`: render loading, error, success, and empty states from one component contract
- `RequireAuth`: guard protected content behind the current OIDC auth state

Import from the package root only:

```tsx
import { ComponentQueryLoader, RequireAuth } from '@cellix/ui-core';
```

`@cellix/ui-core/components/*` is not a supported public API. If the package later needs additional entrypoints, they should be added as explicit, documented groupings rather than file-structure-driven deep exports.

## Install

Install the package together with its peer dependencies:

```sh
npm install @cellix/ui-core react react-dom antd react-router-dom react-oidc-context
```

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
