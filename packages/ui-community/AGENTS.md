# Copilot Instructions: ui-applicant

## Purpose

- The `ui-applicant` package provides the applicant-facing web UI for the CellixJS platform.
- Built with React, TypeScript, and Vite, it serves as the user interface for OwnerCommunity users (e.g end users,members, admins).

## Architecture & Patterns

- **React + TypeScript**: Component-driven UI with strict typing for reliability and maintainability.
- **Vite**: Fast development server and optimized build pipeline.
- **GraphQL**: Use Apollo Client for backend requests and data management via GraphQL APIs.
- **Feature-based Structure**: Organize components and logic by feature or domain concept.
- **State Management**: Use React hooks and context for local and global state.
- **Styling**: Use CSS modules or global styles as appropriate.

## Coding Conventions

- Use functional components and React hooks.
- Prefer composition over inheritance.
- Use strict TypeScript types for props, state, and context.
- Component name must match file name in PascalCase. Each component file should export a single component.
- Each component must have a corresponding Props type defined which is the `{component-name}Props` type.
- Use kebab-case for file and directory names.

## File/Folder Structure

```
src/
|-- assets/           # Static assets such as images and fonts
|-- components/       # UI Components
|   |-- layouts/      # Separate distinct sections of the application; typically maintains a common layout structure
|   |   |-- root/     # Required layout for all applications; defines the unauthenticated entry point
|   |   |-- ...       # Additional layout structures as needed for the application's business domain
|   |-- shared/       # Shared/reusable components across multiple layouts
|   |   |-- ...
|-- config/           # Configuration files for OIDC and Feature Flags
|-- logos/            # Logo assets
|-- stories/          # Storybook stories
|-- App.tsx           # Main application component; includes top-level routing and layout
|-- main.tsx          # Entry point for rendering the app; includes global config provider
|-- index.css         # Global styles
|-- App.css           # Component styles
|-- vite-env.d.ts     # Vite environment types
```

## Development Workflow

- Install dependencies: `npm install`
- Start development server: `npm run dev`
- Build for production: `npm run build`
- Verify Storybook: `npm run storybook`


<!-- ## Testing

- Use `vitest` for unit and integration tests.
- Each component should have a corresponding `*.test.tsx` file.
- Coverage reports are generated in `coverage/`. -->

## References

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
