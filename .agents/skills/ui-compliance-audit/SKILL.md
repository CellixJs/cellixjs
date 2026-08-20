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

### Container / Presentational Split
- [ ] Every `*.container.tsx` wraps exactly one presentational component and contains no rendering logic beyond passing props.
- [ ] Every non-container `.tsx` component (presentational) contains no data fetching, Apollo hooks, or business logic.
- [ ] Container and presentational files are co-located and share a base name (e.g., `profile-view.container.tsx` / `profile-view.tsx`).
- [ ] Container defines `{ComponentName}ContainerProps`; presentational defines `{ComponentName}Props`.
- [ ] Component name matches file name in PascalCase; one exported component per file.
- [ ] File/directory names are kebab-case.

### Container-Specific Violations
- [ ] Loading state from Apollo (`useQuery`/`useMutation`) is passed straight through to the presentational component's `loading` prop — flag any redundant local `loading` state.
- [ ] Mutation results check a `status` object and use `App.useApp()`'s `message`/`notification` — flag static `import { message } from 'antd'`.
- [ ] Mutation calls are wrapped in `try/catch`; flag mixed `.then()`/`await` usage.
- [ ] List-affecting mutations update the Apollo cache manually (add/remove) rather than relying on `refetchQueries` — flag unnecessary `refetchQueries` usage where a manual cache update would suffice.
- [ ] Data-fetching containers use the shared `ComponentQueryLoader` for loading/error/no-data states — flag hand-rolled loading/error branching instead.

### Presentational-Specific Violations
- [ ] Props are typed using the generated GraphQL fragment type from the sibling `.container.graphql` file, not ad hoc shapes.
- [ ] Forms use `initialValues` at the `Form` level — flag `defaultValue` on individual inputs when `initialValues` is also present.
- [ ] Data derivable from props uses derived state (or `useMemo`) — flag redundant `useState` mirroring props.
- [ ] Buttons/actions triggering mutations apply a `loading` prop directly to the Ant Design component — flag missing loading feedback on mutation-triggering actions.
- [ ] Every presentational component has a sibling `.stories.tsx` and `.test.tsx` — flag missing coverage.

### Layouts
- [ ] Each layout folder has an `index.tsx` defining top-level routes, matching the layout name in PascalCase.
- [ ] Every route in `index.tsx` maps to a page component under `pages/`; flag orphaned pages not wired into routing (unreachable via navigation).
- [ ] Container components under a layout are suffixed `Container`.
- [ ] Imports are grouped (external libraries first, then internal) and use absolute imports from `src`.

### Pages
- [ ] Single-view pages use `SubPageLayout`; multi-view sections use nested `Routes` — flag pages that reimplement this scaffolding ad hoc.
- [ ] Each page defines `{PageName}Props` if it accepts props.
- [ ] Each page has a corresponding Storybook story.

### Atomic `ui/` Folder (molecules/organisms)
- [ ] Components are correctly classified: molecules are focused single-purpose Ant Design extensions; organisms compose molecules/other organisms — flag misclassified complexity (e.g., an organism-level component under `molecules/`).
- [ ] Each component folder co-locates test, story, and optional `.module.css`/`README.md` with the same base name.
- [ ] Component folder includes a `README.md` documenting purpose/usage (recommended — note as minor if missing, not critical).

### GraphQL Co-location
- [ ] Every container component has a sibling `.graphql` file with a matching base name; flag inline/ad hoc GraphQL definitions elsewhere.
- [ ] Query/mutation names follow `<Layout><Container><Operation>`; fragment names follow `<Layout><Container><Type>Fields` — flag non-conforming names.
- [ ] Queries/mutations reuse fragments rather than duplicating field selections; flag direct field access where a fragment already exists for that type.
- [ ] Fragments on types with an `id` field include `id` — flag missing `id` (breaks Apollo cache normalization).
- [ ] Queries request only fields the component actually consumes — flag clearly unused over-fetched fields.

### Cross-Cutting (all areas)
- [ ] Accessibility: semantic HTML, ARIA attributes, keyboard navigation, accessible Ant Design usage. Flag interactive elements without accessible labels/roles.
- [ ] Error/empty/loading states use Ant Design fallback components (`Skeleton`, `Empty`, `Alert`) rather than custom equivalents.
- [ ] Styling comes from Ant Design theming/tokens and Tailwind utilities — flag hardcoded colors, spacing, font sizes, radii, shadows, inline `style=`, or `!important`.

## Reporting Format

For each finding, report:
1. File path and line reference
2. The violated rule and its source instructions file
3. Severity (Critical: accessibility/security/broken functionality; Warning: convention/consistency drift; Minor: missing docs/optional file)
4. A concrete suggested fix (do not just restate the rule)

Do not modify code as part of this skill. Audit and report only.
