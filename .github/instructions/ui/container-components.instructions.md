---
applyTo: "packages/ui-*/src/components/**/*.container.tsx"
---
# Copilot Instructions: Container Components

## Purpose

- Container components manage data fetching, business logic, and state for their corresponding presentational components.
- They separate concerns by isolating side effects, API calls, and state management from UI rendering.

## Architecture & Patterns

- **Container/Presentational Pattern**: Each container component (`*.container.tsx`) wraps a presentational component, passing props derived from state, context, or API responses.
- **Co-location**: Place container components next to their presentational counterparts and related `.graphql` files for maintainability.
- **GraphQL Integration**: Use Apollo Client hooks (`useQuery`, `useMutation`, etc.) for data operations. Import queries/mutations from adjacent `.graphql` files.

## Coding Conventions

- Use functional components and React hooks.
- Suffix container components with `Container` (e.g., `ProfileViewContainer`).
- Component name must match file name in PascalCase.
- Each container must define a `{ComponentName}ContainerProps` type for its props.
- Use strict TypeScript types for all state, props, and API responses.
- Pass GraphQL query results directly to the presentational component's props without explicit mapping or transformation. Rendering logic and data formatting should be handled by the presentational component.
- When performing mutations or queries, pass the `loading` state from the Apollo hooks (`useQuery`, `useMutation`) directly to the presentational component to ensure accurate UI feedback. Avoid creating redundant local state for loading.
- After a mutation that creates, updates, or deletes data, ensure the Apollo cache is updated so the UI reflects the changes. Note that Apollo automatically handles cache updates for single documents when the `id` and `__typename` match. Manual cache updates via the `update` function are typically only required for queries/mutations involving lists of documents (e.g., adding/removing items). Prefer manual updates over `refetchQueries` for better performance and immediate UI updates in these scenarios.
- When handling mutations or async operations, use `async/await` consistently. Avoid mixing `.then()` with `await`.
- **Mutation Response Handling**: Container components are responsible for processing mutation results and providing user feedback.
    - Always check the response for a `status` object (e.g., `result.data?.mutationName?.status`).
    - Use `message.success()` from `antd` when `status.success` is true.
    - Use `message.error()` from `antd` when `status.success` is false, displaying the `status.errorMessage` if available.
    - Wrap mutation calls in `try/catch` blocks to handle network or execution errors, displaying them via `message.error()`.
- Handle user feedback (e.g., success/error notifications using `antd`'s `message`) within the container's handler functions (e.g., `onSave`, `onDelete`) after an operation completes.
- Use kebab-case for file and directory names.
- Provide handler functions through display component props for all relevant actions (e.g., handleClick, handleChange, handleSubmit, handleSave).
- **Knip Compliance**: To satisfy `knip` (unused export detection) while maintaining exports for Storybook/Testing, use the presentational component's exported `Props` type to define a typed object before passing it to the component. Prefer `<Component {...props} />` with a typed `props` object over inline casting like `<Component data={data as PropType} />`.

## State Management

- Use React hooks (`useState`, `useEffect`, `useContext`) for local and shared state only when necessary. Avoid prop drilling and trivial state management solutions.

## Data Fetching

- Use Apollo Client hooks for GraphQL queries and mutations.
- Leverage the shared `ComponentQueryLoader` component for consistent data fetching, loading, and error handling. Ensure `ComponentQueryLoader` is used for all data-fetching containers, providing a `noDataComponent` where appropriate.

## Error Handling

- Use the `ComponentQueryLoader` for consistent error handling and fallback UI via the optional `errorComponent` or `noDataComponent` props

## Accessibility

- Ensure all rendered UI is accessible, including loading and error states.


## File Organization

- Place container components in the same folder as their presentational components and related `.graphql` files.
- Align container and presentational components by keeping their file names consistent (e.g., `profile-view.container.tsx` and `profile-view.tsx`).

## References

- [React Container/Presentational Pattern](https://www.patterns.dev/react/presentational-container-pattern/)
- [Apollo Client Docs](https://www.apollographql.com/docs/react/)
- [Ant Design Documentation](https://ant.design/docs/react/introduce)