
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
