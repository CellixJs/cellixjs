---
applyTo: "**/ui-*/src/components/**/!(*.container).tsx" 
---

# Copilot Instructions: Presentational Components

## Purpose

- Presentational components are responsible for rendering UI based on props.
- They are stateless or only manage local UI state, and do not perform data fetching or business logic.
- They receive all data and handler functions via props from container components.

## Architecture & Patterns

- **Container/Presentational Pattern**: Presentational components (`*.tsx` files without `.container.` in the name) are paired with container components that handle data and logic.
- **Co-location**: Place presentational components next to their container counterparts and related `.graphql` files for maintainability.
- **Props-Driven**: Accept all data, state, and event handlers as props. Do not fetch data or manage global state.

## Coding Conventions

- Use functional components and React hooks for local UI state only.
- Component name must match file name in PascalCase.
- Define a `{ComponentName}Props` type for all props.
- When a component receives data from a container's GraphQL query, use the generated fragment type from the corresponding `.container.graphql` file to type the data property in `{ComponentName}Props`. The presentational component is responsible for any necessary data conversion or formatting (e.g., date formatting) for display.
- For components containing forms, use the `data` prop (typed with the GraphQL fragment) to populate the form's `initialValues`. Do not use `defaultValue` on individual `Input` or `Form.Item` components if `initialValues` is provided at the `Form` level.
- Prefer derived state over `useState` for data that can be computed from props. If you must use local state for filtering or searching, ensure the component correctly reacts to prop changes (e.g., by using the props directly in the render logic or using `useMemo`).
- Avoid managing local loading state for operations triggered by handler props (e.g., `onSave`). Instead, accept a `loading` prop from the container to reflect the actual state of the operation (e.g., from `useMutation`).
- REQUIRED: Every presentational component MUST have a corresponding `.stories.tsx` file and a `.test.tsx` file. Do not consider a component complete without these.
- Use strict TypeScript types for all props and local state.
- Use kebab-case for file and directory names.
- Do not perform side effects, API calls, or business logic in presentational components.
- Use handler props for all user actions (e.g., `onClick`, `onChange`, `onSubmit`).

## Styling

- Use Ant Design components and theming for UI consistency.
- Use Tailwind CSS for custom styles if needed.
- Prefer CSS modules or scoped styles for custom styles if Tailwind is not suitable.

## Accessibility

- Ensure all rendered UI is accessible (ARIA attributes, keyboard navigation, semantic HTML).
- Use accessible Ant Design components.

## Testing

- Write unit tests for presentational components, focusing on rendering and interaction.
- Every presentational component should have a corresponding Storybook story.

## File Organization

- Place presentational components in the same folder as their container components and related `.graphql` files.
- Align file names with container components (e.g., `profile-view.tsx` and `profile-view.container.tsx`).

## References

- [React Container/Presentational Pattern](https://www.patterns.dev/react/presentational-container-pattern/)
- [Ant Design Documentation](https://ant.design/docs/react/introduce)