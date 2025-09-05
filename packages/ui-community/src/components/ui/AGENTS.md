
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
