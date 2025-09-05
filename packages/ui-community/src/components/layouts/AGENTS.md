
# Copilot Instructions: Layouts

## Internal References
- ui.instructions.md
- components.instructions.md
- pages.instructions.md
- container-components.instructions.md
- presentational-components.instructions.md

## Purpose

- The `layouts` directory provides reusable layout components and containers for structuring pages and feature flows in the applicant-facing web UI.
- Layouts define page scaffolding, routing, and shared UI regions (headers, footers, sidebars).

## Architecture & Patterns

- **React + TypeScript**: Use functional components with strict typing for reliability and maintainability.
- **Feature-based Structure**: Organize layouts by feature or domain concept (e.g., applicant, cases, shared).
- **Composition**: Prefer composition over inheritance; layouts should wrap or compose child components.

## Coding Conventions

- Use functional components and React hooks.
- Each layout component must have a corresponding `{ComponentName}Props` type.
- Component name must match file name in PascalCase. Each file should export a single component.
- Use kebab-case for file and directory names.
- Suffix container components with `Container` (e.g., `SectionLayoutContainer`).
- Use absolute imports from the `src` root.
- Group imports: external libraries first, then internal modules.

## Routing & Navigation

- **Each layout must have an `index.tsx` file that defines all top-level routes for that layout.**
    - These routes are mapped to page components from the `pages/` folder.
    - The top-level routes in `index.tsx` appear in the sidebar navigation menu.
    - Each route uses a page component from `pages/` as its `element`.
    - The sidebar navigation is built from the layout's route configuration and reflects these top-level routes.
	- The component name in `index.tsx` should match the layout name in PascalCase.
- **Page components in `pages/` must be mapped in `index.tsx` to be accessible via navigation.**

### Example: Mapping Routes to Page Components in `index.tsx`

```tsx
import { Routes, Route } from 'react-router-dom';
import { SectionLayoutContainer } from './section-layout.container';
import { Home } from './pages/home';
import { Members } from './pages/members';
// ...other imports

const pageLayouts = [
	{ path: '', title: 'Home', icon: <HomeOutlined />, id: 'ROOT' },
	{ path: 'members/*', title: 'Members', icon: <ContactsOutlined />, id: 5, parent: 'ROOT' },
	// ...other layouts
];

export const Admin = () => (
	<Routes>
		<Route path="" element={<SectionLayoutContainer pageLayouts={pageLayouts} />}>
			<Route path="" element={<Home />} />
			<Route path="members/*" element={<Members />} />
			{/* ...other routes */}
		</Route>
	</Routes>
);
```

This pattern ensures each top-level route in `index.tsx` is mapped to a page component from the `pages/` folder and appears in the sidebar navigation.

## Styling

- Use Ant Design components and theming for UI consistency.
- Use Tailwind CSS for custom styles as needed.
- Prefer CSS modules or scoped styles for custom styles if Tailwind inline styles become extensive.

## State Management

- Use React hooks (`useState`, `useEffect`, etc.) for local state. 
- Use context or state management libraries only when necessary for shared/global state.

## Accessibility

- Ensure layouts are accessible (ARIA attributes, keyboard navigation, semantic HTML).
- Use accessible Ant Design components for navigation and structure.

## Error Handling

- Handle loading and error states gracefully (e.g., `<Skeleton />`, `<Empty />`, `<Alert />`).
- Provide fallback UI for errors and blocked access.

## Reusability

- Make layouts reusable and composable for different page types and flows.
- Avoid hardcoding values; use props and context.

## Testing

- Write unit tests for layout components.
- Every layout should have a corresponding Storybook story.

## Performance

- Memoize expensive computations with `useMemo` or `React.memo`.
- Avoid unnecessary re-renders.

## Folder Structure

```
layouts/
|-- root/                                       # Required: unauthenticated entry point for the application
|   |-- index.tsx                               # Required: defines page layouts and configures available routes
|   |-- section-layout.tsx                      # Required: shared structure for all pages in this layout
|   |-- sub-page-layout.tsx                     # Optional: additional shared layout structure for sub-pages
|   |-- components/                             # Required: supporting components
|   |   |-- {component-name}.container.graphql   # Optional: GraphQL queries/mutations/fragments
|   |   |-- {component-name}.container.tsx       # Optional: container for data fetching and logic
|   |   |-- {component-name}.stories.tsx         # Required: Storybook stories for the presentational component
|   |   |-- {component-name}.tsx                 # Required: presentational component for rendering the data
|   |-- pages/                                   # Required: page components using container components to render full pages
|   |   |-- {component-name}.tsx                 # Required: page component for rendering the full page
|   |   |-- {component-name}.stories.tsx         # Required: Storybook stories for the page component
|   |-- ...
|-- {layout-name}/                          # Optional: layouts for a specific section of the application
|   |-- index.tsx                           # Required: defines page layouts and configures available routes
|   |-- section-layout.container.graphql    # Optional: GraphQL queries/mutations/fragments for section layout
|   |-- section-layout.container.tsx        # Optional: container for data fetching and logic for section layout
|   |-- section-layout.tsx                  # Required: shared structure for all pages in this layout
|   |-- sub-page-layout.tsx                 # Optional: additional shared layout structure for sub-pages
|   |-- components/                         # Required: supporting components
|   |   |-- ...
|   |-- pages/                              # Optional: page components using container components to render full pages
|   |   |-- ...
|   |-- ...
|-- ...
```

- The `root` layout is always required and provides the global scaffolding and entry points for the application (e.g., top-level routing, authentication, global UI regions).
- Additional layout folders (for features, roles, or business domains) are included as needed, based on the application's business requirements and structure.
- Every layout folder must include:
	- `section-layout.tsx`: The shared structure component that all pages in the layout must use.
	- `index.tsx`: The entry point for the layout, defining available routes and ensuring each route uses the section layout.
- Each feature folder may also include:
	- Supporting components (e.g., header.tsx, footer.tsx, navigation, etc.).
	- GraphQL fragments/queries, if applicable.
	- Storybook stories and tests for each layout component.
	- Container components for data fetching and logic separation.
	- Sub-page layouts for additional structure.
	- Page components for individual views.
- Use kebab-case for file and directory names.
- Use PascalCase for component names.
- Avoid deeply nested folders; keep structure clear and maintainable.
## References

- [React Documentation](https://react.dev/)
- [Ant Design Documentation](https://ant.design/docs/react/introduce)
- [Storybook Documentation](https://storybook.js.org/docs/react/get-started/introduction)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
