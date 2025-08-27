# @ocom/ui-components

Owner Community specific UI components library that provides reusable UI components for OCOM application portals. This package demonstrates how shared UI components can be developed and maintained across different client-facing portals within the Cellix framework implementation.

- Purpose: Serve as a shared component library for OCOM application portals, enabling consistent UI/UX across multiple user interfaces.
- Scope: Reusable UI components following Atomic Design principles, organized into molecules and organisms.
- Language/runtime: TypeScript 5.8, React 19+, Ant Design 5+.

## Install

```sh
npm i -w @ocom/ui-components
# or if you only need it at compile-time
npm i -D -w @ocom/ui-components
```

## Entry points

- Public API is exposed via the package root:
```ts
import { LoggedInUser, LoggedInUserContainer } from '@ocom/ui-components';
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
packages/ui-components/
├── src/
│   ├── components/                        # UI components organized by atomic design principles
│   │   ├── molecules/                     # Smaller, focused components
│   │   │   ├── README.md                  # API and usage documentation
│   │   │   ├── logged-in-user/            # User authentication status component
│   │   │   │   ├── index.tsx              # Main component implementation
│   │   │   │   ├── logged-in.tsx          # Logged-in state component
│   │   │   │   ├── not-logged-in.tsx      # Not-logged-in state component
│   │   │   │   └── logged-in-user.stories.tsx
│   │   │   └── index.tsx                  # Barrel export file
│   │   ├── organisms/                     # Complex components composed of multiple molecules
│   │   │   ├── README.md                  # API and usage documentation
│   │   │   ├── header/                    # Header component with authentication
│   │   │   │   ├── index.tsx              # Main component implementation
│   │   │   │   ├── logged-in-user.container.tsx
│   │   │   │   ├── logged-in-user.container.graphql
│   │   │   │   ├── logged-in-user-community.container.tsx
│   │   │   │   ├── logged-in-user-root.container.tsx
│   │   │   │   └── handle-logout.tsx      # Logout handler
│   │   │   └── index.tsx                  # Barrel export file
│   │   └── index.ts                       # Barrel export file
│   ├── generated.tsx                      # Generated GraphQL types and operations
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
- Integrated with GraphQL via Apollo Client

### Development with Storybook

To develop and test components in isolation:

```sh
# Start Storybook development server
npm run storybook -w @ocom/ui-components
```

## Testing

Components are tested with Vitest:

```sh
# Run tests
npm run test -w @ocom/ui-components

# Run tests with coverage
npm run test:coverage -w @ocom/ui-components

# Watch mode for development
npm run test:watch -w @ocom/ui-components
```

## Scripts

Common scripts from `package.json` (executed in this workspace):

- Build: `npm run build -w @ocom/ui-components`
- Clean: `npm run clean -w @ocom/ui-components`
- Test: `npm run test -w @ocom/ui-components`
- Lint/Format: `npm run lint -w @ocom/ui-components` / `npm run format -w @ocom/ui-components`
- Storybook: `npm run storybook -w @ocom/ui-components`
- Build Storybook: `npm run build-storybook -w @ocom/ui-components`

## Dependencies

- React 19+
- Ant Design (antd) 5+
- Apollo Client for GraphQL integration
- React Router DOM for routing
- React OIDC Context for authentication
- @cellix/ui-core for foundational UI components

## Notes

- All public components are exported via `src/index.ts`.
- Each component has its own directory with implementation and Storybook stories.
- GraphQL queries are co-located with their respective container components.

## Audience and non-goals

- Audience: Frontend developers building OCOM portal applications within the Cellix ecosystem.
- Non-goals: Application-specific pages, business logic implementation, or state management solutions beyond component level.

## See also

- `@cellix/ui-core` — Core UI component library with foundational components for Cellix applications
- `@ocom/ui-community` — Community-facing UI application using this component library