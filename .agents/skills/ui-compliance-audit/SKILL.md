---
name: ui-compliance-audit
description: Compliance checklist for auditing existing packages/ui-* React code against CellixJS UI architectural conventions (container/presentational split, layouts, pages, GraphQL co-location, atomic ui folder). Use when auditing UI code for convention violations — not for authoring new components.
---

# Skill: UI Compliance Audit

Reusable checklist for auditing existing `packages/ui-*` code against the conventions
defined in `.github/instructions/ui/*.instructions.md`. This skill is for **finding and
reporting violations in existing code**, not for generating new components.

## When to Use

- Running or supporting a `design-audit` pass over `packages/ui-*`
- Reviewing a diff that touches `packages/ui-*/src/components/**`
- Investigating why a component doesn't match established patterns

## Source of Truth

Each check below is derived from a specific instructions file. When a violation is found,
cite the originating file so findings are traceable:

| Area | Source |
|---|---|
| General components | `.github/instructions/ui/components.instructions.md` |
| Container components | `.github/instructions/ui/container-components.instructions.md` |
| Presentational components | `.github/instructions/ui/presentational-components.instructions.md` |
| Layouts | `.github/instructions/ui/layouts.instructions.md` |
| Pages | `.github/instructions/ui/pages.instructions.md` |
| Atomic `ui/` folder (molecules/organisms) | `.github/instructions/ui/ui.instructions.md` |
| GraphQL co-location | `.github/instructions/ui/graphql-ui.instructions.md` |

## Audit Checklist

### General Components

**Source:** `.github/instructions/ui/components.instructions.md`

- [ ] Components use React functional components and hooks, strict TypeScript types, and composition rather than inheritance.
- [ ] Component names match their PascalCase file names; each file exports one component and declares a corresponding `{ComponentName}Props` type.
- [ ] Files and directories use kebab-case; shared components are in `shared/` and layout-specific components are in their layout folder.
- [ ] Data fetching/manipulation is separated from presentation using the container pattern; container names end in `Container`.
- [ ] Styling uses Ant Design theming/components, Tailwind for custom styles, and CSS modules or scoped styles when Tailwind is unsuitable.
- [ ] Components use accessible semantic HTML, ARIA and keyboard support, and accessible Ant Design components.
- [ ] Components provide graceful loading, error, and no-data fallback UI using Ant Design components such as `Skeleton`, `Empty`, or `message`.
- [ ] Components have unit tests and a corresponding Storybook story.
- [ ] Components are reusable and composable, avoiding hardcoded values where props or context provide configuration.
- [ ] Expensive computations are memoized where applicable, and code avoids unnecessary re-renders.

### Container Components

**Source:** `.github/instructions/ui/container-components.instructions.md`

- [ ] Each `*.container.tsx` component manages data, business logic, and state for its corresponding presentational component; the files are co-located with matching names and related `.graphql` files.
- [ ] Containers use Apollo hooks with queries and mutations imported from adjacent `.graphql` files.
- [ ] Container names match their PascalCase file names, end in `Container`, and declare a `{ComponentName}ContainerProps` type with strict types for state, props, and API responses.
- [ ] GraphQL results and Apollo `loading` state pass directly to the presentational component without transformation or redundant local loading state.
- [ ] List mutations update the Apollo cache when needed; they do not rely on `refetchQueries` where a manual cache update is appropriate.
- [ ] Async mutation handling uses `async`/`await`, checks the mutation `status`, uses `App.useApp()` instances rather than static Ant Design imports, and reports success, failure, and caught errors through `message`.
- [ ] Containers provide action handlers to the presentational component through props and avoid unnecessary local/shared state and prop drilling.
- [ ] Data-fetching containers use `ComponentQueryLoader`, including `noDataComponent` where appropriate and its error/no-data fallback options.
- [ ] Typed props objects are used when passing exported presentational props to satisfy Knip without inline type casts.
- [ ] Container UI, including loading and error states, is accessible.

### Presentational Components

**Source:** `.github/instructions/ui/presentational-components.instructions.md`

- [ ] Presentational components render from props, receive data and handlers from containers, and do not fetch data, perform API calls, manage global state, or contain business logic.
- [ ] Components use functional components and hooks only for local UI state; all props and local state use strict types.
- [ ] Component names match their PascalCase file names, files/directories use kebab-case, and each component declares a `{ComponentName}Props` type.
- [ ] Data received from a container uses the generated type from the corresponding `.container.graphql` fragment, and display formatting/conversion remains in the presentational component.
- [ ] Forms populate `initialValues` from the `data` prop and do not use individual input or `Form.Item` `defaultValue` values when `initialValues` is present.
- [ ] Values derived from props are not redundantly stored in state; filtering or search state correctly responds to prop changes.
- [ ] Mutation-triggering actions receive a container `loading` prop and apply it directly to the UI component's `loading` property.
- [ ] Every presentational component has a corresponding `.stories.tsx` file and `.test.tsx` file, is co-located with its container and GraphQL files, and uses handler props for user actions.
- [ ] Styling uses Ant Design and theming, Tailwind when needed, and CSS modules or scoped styles when Tailwind is unsuitable; rendered UI is accessible.

### Layouts

**Source:** `.github/instructions/ui/layouts.instructions.md`

- [ ] Layouts use functional React components, strict typing, composition, kebab-case files/directories, PascalCase component names, one exported component per file, and `{ComponentName}Props` types.
- [ ] Layout containers are suffixed `Container`; imports are grouped with external libraries before internal modules and use absolute `src` imports.
- [ ] Each layout has an `index.tsx` whose PascalCase component matches the layout name and defines the layout's top-level routes.
- [ ] Top-level routes use page components from `pages/`, appear in the sidebar navigation configuration, and every page component in `pages/` is mapped in `index.tsx`.
- [ ] Every layout folder includes `section-layout.tsx` and `index.tsx`; the required `root` layout provides global scaffolding and entry points.
- [ ] Layouts use Ant Design theming/components and Tailwind or scoped CSS modules appropriately; they are accessible and provide fallback UI for loading, errors, and blocked access.
- [ ] Layouts are reusable and composable, avoid hardcoded values where props/context can configure them, include unit tests and Storybook stories, and avoid unnecessary re-renders.

### Pages

**Source:** `.github/instructions/ui/pages.instructions.md`

- [ ] Each page is a route/view mapped from its layout's `index.tsx` and is composed from the layout's reusable components and containers.
- [ ] Pages use functional components, hooks, strict types, kebab-case filenames, and a `{PageName}Props` type.
- [ ] Single-view pages use `SubPageLayout`; tabbed subpages use `VerticalTabs`; multi-view sections use nested `Routes`.
- [ ] Every page has a corresponding Storybook story.

### Atomic `ui/` Folder

**Source:** `.github/instructions/ui/ui.instructions.md`

- [ ] Molecules are small, focused Ant Design extensions; organisms compose molecules or organisms into higher-level sections.
- [ ] Components use functional React components, TypeScript, composition, and the container pattern when data fetching or logic separation is needed.
- [ ] Component names match PascalCase file names, each file exports one component and declares `{ComponentName}Props`, and directories/files use kebab-case.
- [ ] Component folders co-locate required `.test.tsx` and `.stories.tsx` files, optional same-base `.module.css` files, and a `README.md` documenting purpose and usage.
- [ ] Styles use Ant Design theming, Tailwind utilities, or co-located CSS modules; hardcoded values are avoided where props/context can configure behavior.
- [ ] Components use React Testing Library with Vitest, are reusable and composable, and avoid unnecessary re-renders.

### GraphQL Co-location

**Source:** `.github/instructions/ui/graphql-ui.instructions.md`

- [ ] Each container has a co-located, matching-base `.graphql` file that defines all queries, mutations, and fragments it uses.
- [ ] Query and mutation names follow `<Layout><Container><Operation>`; fragment names follow `<Layout><Container><Type>Fields`.
- [ ] Operations reuse fragments, use variables for dynamic values rather than hardcoded IDs/parameters, request only needed fields, and use consistent fragment definitions.
- [ ] Fragments include `id` where the type has an `id` field.
- [ ] TypeScript imports codegen-generated GraphQL types, uses Apollo hooks with imported operations, and presentational components use generated corresponding fragment types.
- [ ] Storybook stories and unit tests mock GraphQL operations using Apollo Client mocking utilities.

## Reporting Format

For each finding, report:
1. File path and line reference
2. The violated rule and its source instructions file
3. Severity (Critical: accessibility/security/broken functionality; Warning: convention/consistency drift; Minor: missing docs/optional file)
4. A concrete suggested fix (do not just restate the rule)

Do not modify code as part of this skill. Audit and report only.
