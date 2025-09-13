# @cellix/ui-core

Core UI components library for Cellix applications. This package provides reusable UI components built with React and Ant Design (antd) that can be used across different Cellix frontend applications.

- Purpose: Serve as a shared component library that can be used by various UI applications in the Cellix monorepo.
- Scope: Reusable UI components following Atomic Design principles, organized into molecules and organisms.
- Language/runtime: TypeScript 5.8, React 18+, Ant Design 5+.

## Install

```sh
npm i -w @cellix/ui-core
# or if you only need it at compile-time
npm i -D -w @cellix/ui-core
```

## Entry points

- Public API is exposed via the package root:
```ts
import { ComponentQueryLoader, RequireAuth, /*  other components */ } from '@cellix/ui-core';
```
- Deep imports into `src/**` are not part of the public API and are not recommended.

## Atomic Design Structure

This library follows the Atomic Design methodology for organizing components:

- **Molecules**: Small, functional components that combine multiple atomic elements to perform a specific task or function. They are relatively simple and focused on a single responsibility.

- **Organisms**: More complex components that combine multiple molecules and/or atoms to form a distinct section of an interface. They represent more complete and self-contained parts of the UI.

For detailed API documentation, see:
- [Molecules API docs](./src/components/molecules/README.md)
- [Organisms API docs](./src/components/organisms/README.md)

## Folder structure

```
packages/cellix-ui-core/
├── src/
│   ├── components/                        # UI components organized by atomic design principles
│   │   ├── molecules/                     # Smaller, focused components
│   │   │   ├── README.md                  # API and usage documentation
│   │   │   ├── component-query-loader/
│   │   │   │   ├── index.tsx              # Component implementation
│   │   │   │   └── component-query-loader.stories.tsx
│   │   │   ├── require-auth/
│   │   │   │   ├── index.tsx              # Component implementation
│   │   │   │   └── require-auth.stories.tsx
│   │   │   └── index.tsx                  # Barrel export file
│   │   ├── organisms/                     # Complex components composed of multiple molecules
│   │   │   ├── README.md                  # API and usage documentation
│   │   │   └── index.tsx                  # Barrel export file (future)
│   │   └── index.ts                       # Barrel export file
│   └── index.ts                           # Root exports
├── .storybook/                            # Storybook configuration
├── package.json
├── tsconfig.json
└── README.md                              # This file
```

## Component Development

Components in this library are:
- Built with TypeScript and React
- Styled with Ant Design (antd)
- Documented with Storybook
- Tested with Vitest

### Development with Storybook

To develop and test components in isolation:

```sh
# Start Storybook development server
npm run storybook -w @cellix/ui-core
```

## Testing

Components are tested with Vitest:

```sh
# Run tests
npm run test -w @cellix/ui-core

# Run tests with coverage
npm run test:coverage -w @cellix/ui-core

# Watch mode for development
npm run test:watch -w @cellix/ui-core
```

## Scripts

Common scripts from `package.json` (executed in this workspace):

- Build: `npm run build -w @cellix/ui-core`
- Clean: `npm run clean -w @cellix/ui-core`
- Test: `npm run test -w @cellix/ui-core`
- Lint/Format: `npm run lint -w @cellix/ui-core` / `npm run format -w @cellix/ui-core`
- Storybook: `npm run storybook -w @cellix/ui-core`
- Build Storybook: `npm run build-storybook -w @cellix/ui-core`

## Dependencies

- React 18+
- Ant Design (antd) 5+
- React Router DOM (for auth components)
- React OIDC Context (for auth components)

## Notes

- All public components are exported via `src/index.ts`.
- Each component has its own directory with implementation and Storybook stories.

## Audience and non-goals

- Audience: Frontend developers building UI applications within the Cellix ecosystem.
- Non-goals: Application-specific components, business logic, or state management solutions.

## See also

- `@ocom/ui-components` — Shared UI components for OCOM applications using this component library
- `@ocom/ui-community` — Community-facing UI application using this component library