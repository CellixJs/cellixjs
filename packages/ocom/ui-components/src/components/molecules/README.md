# Molecules

Molecules are small, reusable UI components that serve a specific purpose. They combine multiple atomic elements (from React and Ant Design) to create functional components that can be used across different OCOM applications.

## Available Molecules

Currently, this library provides the following molecules:

| Component Name | Source Code |
|---------------|-------------|
| `LoggedInUser` | [logged-in-user/index.tsx](./logged-in-user/index.tsx) |

## API Usage

### LoggedInUser

A component that displays the user's authentication state and provides appropriate UI elements for logged-in and not-logged-in states. This component is designed to be used in headers and navigation bars.

#### Usage

```tsx
import { LoggedInUser } from '@ocom/ui-components';

const Header = () => {
  const handleLogin = () => {
    // Login logic
  };

  const handleSignup = () => {
    // Signup logic
  };

  const handleLogout = () => {
    // Logout logic
  };

  return (
    <header>
      <div className="logo">My App</div>
      <nav>{/* Navigation links */}</nav>
      <LoggedInUser
        data={{
          isLoggedIn: true,
          firstName: 'Jane',
          lastName: 'Doe',
          notificationCount: 3,
          profileImage: '/images/profile.jpg'
        }}
        onLoginClicked={handleLogin}
        onSignupClicked={handleSignup}
        onLogoutClicked={handleLogout}
      />
    </header>
  );
};
```

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| data | object | Yes | - | Object containing user authentication state and profile data |
| data.isLoggedIn | boolean | Yes | - | Whether the user is logged in |
| data.firstName | string | No | '' | User's first name (only used when logged in) |
| data.lastName | string | No | '' | User's last name (only used when logged in) |
| data.notificationCount | number | No | 0 | Number of notifications (only used when logged in) |
| data.profileImage | string | No | '' | URL to user's profile image (only used when logged in) |
| onLoginClicked | () => void | No | noop | Handler for login button click |
| onSignupClicked | () => void | No | noop | Handler for signup button click |
| onLogoutClicked | () => void | No | noop | Handler for logout button click |

#### Dependencies

This component is composed of two internal components:
- `LoggedIn` - Displays user information when logged in
- `NotLoggedIn` - Displays login/signup buttons when not logged in

No external dependencies beyond React and styling libraries.