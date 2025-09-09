---
applyTo: "packages/ui-*/src/components/**/*"
---
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
- Use kebab-case for file and directory names.
- Provide handler functions through display component props for all relevant actions (e.g., handleClick, handleChange, handleSubmit, handleSave).

## State Management

- Use React hooks (`useState`, `useEffect`, `useContext`) for local and shared state only when necessary. Avoid prop drilling and trivial state management solutions.

## Data Fetching

- Use Apollo Client hooks for GraphQL queries and mutations.
- Leverage the shared `ComponentQueryLoader` component for consistent data fetching, loading, and error handling.

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
---
applyTo: "packages/ui-applicant/src/components/**/*.graphql"
---

## Copilot Instructions: GraphQL

### Purpose

- `.graphql` files in the frontend define GraphQL queries, mutations, and fragments for use with Apollo Client and React components.
- They enable type-safe, modular, and maintainable data fetching and manipulation.

### Organization & Structure

- Place `.graphql` files next to the component or container that uses them, typically in the same feature or layout folder.
- For a given container component, there should be a corresponding `.graphql` file with the same base name. (e.g `contact-details.container.graphql`)
- All queries, mutations, and fragments used in the container component should be defined in the corresponding `.graphql` file.

### Coding Conventions

- Queries and mutations should use the following naming convention `<Layout><Container><Operation>`
    - Given a container component named `ContactDetailsContainer` in the `applicant` layout which uses the `ApplicantUser` query, the query name should be: `ApplicantContactDetailsContainerApplicantUser`
- Fragments should use the following naming convention `<Layout><Container><Type>Fields`
    - Given a container component named `ContactDetailsContainer` in the `applicant` layout, a fragment for the `ApplicantUser` type should be named: `ApplicantContactDetailsContainerUserFields`
- Always prefer reusable fragments over direct field access in queries/mutations.
- Use variables for dynamic values; avoid hardcoding IDs or parameters.
- Keep queries minimal—request only the fields needed by the component.
- Include the `id` fields on fragment types where the `id` field is present to ensure consistency in Apollo Cache.
- Ensure queries and mutations use the same fragment definitions to ensure consistency in Apollo Cache.

### Integration


- Import `.graphql` files into TypeScript/JS files using codegen-generated types for type safety.
- Use Apollo Client hooks (`useQuery`, `useMutation`, etc.) with imported queries/mutations.
- Co-locate fragments with the components that use them for maintainability.

### Apollo Client Link Chain Customization

- Configure Apollo Client with a dynamic link chain to flexibly route operations to different data sources:
    - **Batching**: Use a batching link (e.g., `BatchHttpLink`) to combine multiple GraphQL operations into a single HTTP request. This is why container components are allowed to define their own queries and mutations; the batching link can optimize their execution on the server.
    - **Authentication & Custom Headers**: Add custom Apollo links to inject authentication tokens or other headers into requests.
    - **REST Integration**: Use Apollo's REST link to fetch data from non-GraphQL APIs. Route specific operations to REST endpoints using a link map and split logic. Typical usage is for fetching JSON data from Azure Blob Storage.
- Example generalized setup:
    ```ts
    import { ApolloClient, InMemoryCache, ApolloLink, from } from '@apollo/client';
    import { BatchHttpLink } from '@apollo/client/link/batch-http';
    import { RestLink } from 'apollo-link-rest';

    // Define links for different data sources
    const batchGraphqlLink = new BatchHttpLink({ uri: '/graphql', batchMax: 10, batchInterval: 20 });
    const restApiLink = new RestLink({ uri: '/rest-api' });

    // Custom links for authentication, headers, etc.
    const authLink = new ApolloLink((operation, forward) => {
      operation.setContext(({ headers = {} }) => ({
        headers: {
          ...headers,
          Authorization: 'Bearer <token>'
        }
      }));
      return forward(operation);
    });

    // Link map for routing operations
    const linkMap = {
      CountryDetails: restApiLink, // Example: route 'CountryDetails' query to REST
      default: from([authLink, batchGraphqlLink])
    };

    // Dynamic split logic based on operation name
    const dynamicLink = ApolloLink.split(
      operation => operation.operationName in linkMap,
      new ApolloLink((operation, forward) => {
        const link = linkMap[operation.operationName as keyof typeof linkMap] || linkMap.default;
        return link.request(operation, forward);
      }),
      linkMap.default
    );

    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: dynamicLink
    });
    ```
- You can extend this pattern to route based on context, operation type, or other criteria. Update the link chain dynamically (e.g., on authentication changes) as needed.

### Testing

- Mock queries and mutations in Storybook stories and unit tests using Apollo Client's mocking utilities.

### Example Structure

```
components/
  feature-x/
    my-component.container.graphql
    my-component.container.tsx
    my-component.stories.tsx
    my-component.tsx
```

### References

- [Apollo Client Docs](https://www.apollographql.com/docs/react/)
- [GraphQL Specification](https://spec.graphql.org/)
---
applyTo: "packages/ui-*/src/components/layouts/**/*"
---

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

---
applyTo: "packages/ui-*/src/components/layouts/**/pages/*.tsx"
---

# Copilot Instructions: Pages

## Internal References
- ui.instructions.md
- components.instructions.md
- layouts.instructions.md
- container-components.instructions.md

## Purpose

- The `pages` folder contains page-level React components for a specific layout.
- Each page component represents a distinct route/view and is mapped in the layout's `index.tsx`.
- Pages are composed of components from the layout's `components/` folder wrapped in the layout's `SubPageLayout` component.

## Page Types

- **Single Page**:
	- Implements a single view using `SubPageLayout` for header/content.
	- Can include subpages/tabs via the shared `VerticalTabs` component.
	- Example: 
    ```tsx
    // example-page.tsx
    import { SubPageLayout } from '../layouts/sub-page-layout';
    import { ExampleComponent } from '../components/example-component';

    export const ExamplePage: React.FC = () => (
        <SubPageLayout header={<h1>Example Page</h1>}>
            <ExampleComponent />
        </SubPageLayout>
    );
    ```
- **Page Group (Multi-View Section)**:
	- Implements a set of nested `Routes` for a section, each route providing its own page component.
	- Used for sections with multiple related views (e.g., `properties.tsx`, `service-tickets.tsx`).
	- Example:
		```tsx
		// properties.tsx
		<Routes>
			<Route path="" element={<PropertiesList />} />
            <Route path="create" element={<PropertiesCreate />} />
			<Route path=":id/*" element={<PropertiesDetail />} />
		</Routes>
		```

## Coding Conventions

- Use functional components and React hooks.
- Compose pages from reusable components and containers.
- Define `{PageName}Props` type for each page.
- Use strict TypeScript types.
- Use kebab-case for file names.

## Composition

- Use `SubPageLayout` for single pages.
- Use `VerticalTabs` for tabbed subpages.
- Use nested `Routes` for page groups.

## Testing & Reusability

- Each page component must have a Storybook story.
---
applyTo: "packages/ui-*/src/components/**/!(*.container).tsx" 
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
---
applyTo: "packages/ui*/src/components/ui/**/*"
---

# Copilot Instructions: UI Folder

## Purpose

- The `ui` folder implements the Atomic Design methodology for composing reusable UI components specific to this package.
- Components are organized as **molecules** (small, focused, tailored Ant Design-based components) and **organisms** (composed, more complex components).
- These components are intended to be shared across layouts and features within the package.

## Atomic Design Structure

- **Molecules**:  
  - Small, reusable components that extend or tailor Ant Design primitives for project-specific needs.
  - Should encapsulate a single, focused piece of functionality.
  - Can be used directly by other code or composed into organisms.
  - Example: custom input fields, loaders, upload buttons, user status indicators.

- **Organisms**:  
  - More complex components composed of molecules (and possibly other organisms).
  - Represent higher-level UI sections or widgets.
  - Example: dropdown menus, form sections, headers, composite lists.

## Architecture & Patterns

- Use **React** functional components with **TypeScript** for strict typing and maintainability.
- Prefer composition over inheritance.
- Use the **container pattern** for data-fetching and logic separation when needed (suffix with `Container`).
- Use **Ant Design** components as the atomic base; extend with custom logic or styling as molecules.
- Use **Tailwind CSS** for custom utility styles; use CSS modules for scoped, component-specific styles when Tailwind is not suitable.

## Coding Conventions

- Component name must match file name in PascalCase. Each file should export a single component.
- Each component must have a corresponding `{ComponentName}Props` type/interface.
- Use kebab-case for file and directory names.
- Co-locate tests (`.test.tsx`), stories (`.stories.tsx`), and styles (`.module.css`) with the component.
- Place a `README.md` in each component folder to document purpose and usage.

## Styling

- Use Ant Design theming for UI consistency.
- Use Tailwind CSS for utility-first custom styles.
- Use CSS modules (`*.module.css`) for encapsulated, reusable component styles.
- Place `.module.css` files next to their component, using the same base name.

## Reusability & Composition

- Design molecules to be reusable and composable.
- Compose organisms from molecules and other organisms.
- Avoid hardcoding values; use props and context for configuration.

## Testing

- Every component must have a corresponding Storybook story and unit test.
- Use React Testing Library and Vitest for tests.

## Performance

- Memoize expensive computations with `useMemo` or `React.memo`.
- Avoid unnecessary re-renders.

## File/Folder Structure


```
ui/
  molecules/                   # Small, focused, reusable components
    {component-name}/            # Co-locate all files related to the molecule
      index.module.css            # Scoped CSS module (optional)
      index.test.tsx              # Unit test (required)
      index.stories.tsx           # Storybook story for molecule (required)
      index.tsx                   # Entry point for the molecule (required)
      component-name.test.tsx     # Unit test for {component-name} (optional)
      component-name.stories.tsx  # Storybook story for {component-name} (optional)
      component-name.tsx          # Component used in this molecule (optional)
      README.md                   # Usage and API documentation (recommended)
  organisms/                    # Composed, complex components made from molecules
    {component-name}/             # Co-locate all files related to the organism
      ...                         # Same as molecules

  ui.instructions.md            # Copilot instructions for this folder
```

**Notes:**
- Each component should have its own folder if it includes multiple files (component, styles, tests, stories, etc.).
- Use kebab-case for directory names and file names.
- Co-locate all related files (component, test, story, styles, README) for maintainability.

## References

- [Atomic Web Design](https://bradfrost.com/blog/post/atomic-web-design/)
- [Atomic Design - Chapter 2](https://atomicdesign.bradfrost.com/chapter-2/)
- [React Documentation](https://react.dev/)
- [Ant Design Documentation](https://ant.design/docs/react/introduce)
- [Storybook Documentation](https://storybook.js.org/docs/react/get-started/introduction)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)