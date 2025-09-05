# Copilot Instructions: UI Components

## Purpose

- The `components` directory provides reusable UI building blocks for the applicant-facing web UI.
- Components are built with React, TypeScript, and leverage Ant Design and Tailwind CSS for styling.

## Architecture & Patterns

- **React + TypeScript**: Component-driven UI with strict typing for reliability and maintainability.
- **Ant Design & Tailwind CSS**: Use Ant Design components and theming wherever possible; use Tailwind CSS for custom styles.
- **Feature-based Structure**: Organize components and logic by feature or domain concept.
- **State Management**: Use React hooks and context for local and global state. Avoid prop drilling and trivial state management solutions.
- **Accessibility**: Ensure all components are accessible (ARIA, keyboard navigation, semantic HTML).

## Coding Conventions

- Use functional components and React hooks.
- Prefer composition over inheritance.
- Use strict TypeScript types for props, state, and context.
- Component name must match file name in PascalCase. Each component file should export a single component.
- Each component must have a corresponding `{ComponentName}Props` type defined.
- Use kebab-case for file and directory names.
- Use the [Container pattern](https://www.patterns.dev/react/presentational-container-pattern/) for separating concerns for data fetching/manipulation and presentation.
- Suffix container components with `Container` (e.g., `ProfileViewContainer`).

## Styling

- Use Ant Design components and theming for UI consistency.
- Use Tailwind CSS for custom component styles.
- Prefer CSS modules or scoped styles for custom styles if Tailwind is not suitable.

## State Management

- Use React hooks (`useState`, `useEffect`, etc.) for local state.
- Use context or state management libraries only when necessary for shared/global state.

## Accessibility

- Prefer components to be accessible (ARIA attributes, keyboard navigation, semantic HTML) where possible.
- Use accessible Ant Design components.

## Testing

- Write unit tests for components, especially for logic and rendering.
- Every component must have a corresponding Storybook story.

## Error Handling

- Handle loading states gracefully. (e.g `<Skeleton />`)
- Propagate error messages via Ant Design components (e.g. `message`)
- Use fallback UI for no data (e.g., `<Empty />`)

## Reusability

- Make components reusable and composable.
- Avoid hardcoding values; use props and context.

## Naming Conventions

- Use PascalCase for component names.
- Suffix container components with `Container` (e.g., `ProfileViewContainer`).

## Performance

- Memoize expensive computations with `useMemo` or `React.memo`.
- Avoid unnecessary re-renders.

## File Organization

- Place shared components in the `shared/` folder.
- Place layout-specific components in the appropriate `layouts/` folder.

## References

- [React Documentation](https://react.dev/)
- [Ant Design Documentation](https://ant.design/docs/react/introduce)
- [Storybook Documentation](https://storybook.js.org/docs/react/get-started/introduction)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
