
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
