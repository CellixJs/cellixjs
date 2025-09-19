# Organisms

Organisms are complex UI components that combine multiple molecules and/or atoms to form a distinct section of an interface. They represent more complete and self-contained parts of the UI that can be composed to create pages or application features.

## Available Organisms

Currently, this library provides the following organism components:

| Component Name | Source Code |
|---------------|-------------|
| `LoggedInUserContainer` | [header/logged-in-user.container.tsx](./header/logged-in-user.container.tsx) |

## API Usage

### LoggedInUserContainer

A container component that fetches user authentication data and renders the appropriate user interface based on the current route. This component handles the logic for determining whether to display community-specific or root-level user information. Makes use of `LoggedInUser` molecule to display user state and login/logout actions.

#### Usage

```tsx
import { LoggedInUserContainer } from '@ocom/ui-components';

const Header = () => {
  return (
    <header>
      <div className="logo">My App</div>
      <nav>{/* Navigation links */}</nav>
      <LoggedInUserContainer autoLogin={true} />
    </header>
  );
};
```

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| autoLogin | boolean | Yes | - | Whether to automatically trigger the login flow if user is not authenticated |

#### Dependencies

This component requires:
- @apollo/client for GraphQL data fetching
- react-router-dom for route parameter access
- react-oidc-context for authentication state

The component uses GraphQL queries defined in `logged-in-user.container.graphql` and conditionally renders either:
- `LoggedInUserCommunityContainer` - When accessed within a community route
- `LoggedInUserRootContainer` - When accessed from the root route

Both containers fetch appropriate user data and render the `LoggedInUser` molecule component with the fetched data.