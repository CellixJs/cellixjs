# Molecules

Molecules are small, reusable UI components that serve a specific purpose. They combine multiple atomic elements (from React and Ant Design) to create functional components that can be used across different applications.

## Available Molecules

Currently, this library provides the following molecules:

| Component Name       | Source Code                                      |
|----------------------|-------------------------------------------------------|
| `ComponentQueryLoader` | [component-query-loader/index.tsx](./component-query-loader/index.tsx) |
| `RequireAuth`          | [require-auth/index.tsx](./require-auth/index.tsx)   |

## API Usage

### ComponentQueryLoader

A utility component for handling loading states, errors, and data display in data fetching scenarios involving Apollo Client. This component is intended to be used in **Container** components that fetch data using GraphQL queries. (See [Container components](../../../../../.github/instructions//ui/container-components.instructions.md) instructions for more details.)

#### Usage

```tsx
import { ComponentQueryLoader } from '@cellix/ui-core';
import { useQuery } from '@apollo/client';
import { GET_USER_DATA } from './queries';

const UserProfile = () => {
  const { loading, error, data } = useQuery(GET_USER_DATA);

  return (
    <ComponentQueryLoader
      loading={loading}
      error={error}
      hasData={data?.user}
      hasDataComponent={<UserProfileCard user={data.user} />}
      noDataComponent={<EmptyUserProfile />}
      loadingRows={4}
    />
  );
};
```

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| loading | boolean | Yes | - | Indicates if data is being loaded |
| error | Error \| undefined | Yes | - | Error object if there was an error |
| hasData | object \| null \| undefined | Yes | - | The data to check if it exists |
| hasDataComponent | React.JSX.Element | Yes | - | Component to render when data exists |
| errorComponent | React.JSX.Element | No | Skeleton with error message | Component to render when there's an error |
| noDataComponent | React.JSX.Element | No | Skeleton | Component to render when there's no data |
| loadingRows | number | No | 3 | Number of rows to show in the loading skeleton |
| loadingComponent | React.JSX.Element | No | Skeleton | Custom loading component |


#### Dependencies
This component requires:
- @apollo/client

Make sure these are installed and properly configured in your application.

### RequireAuth

A component that handles authentication flows and protected routes. It integrates with React OIDC Context to manage authentication state and redirects.

#### Usage

```tsx
import { RequireAuth } from '@cellix/ui-core';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from 'react-oidc-context';
import { oidcConfig } from './auth-config';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider {...oidcConfig}>
        <Routes>
          <Route
            path="/protected"
            element={
              <RequireAuth forceLogin={true}>
                <ProtectedPage />
              </RequireAuth>
            }
          />
          <Route path="/public" element={<PublicPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
```

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| children | React.JSX.Element | Yes | - | The protected content to render when authenticated |
| forceLogin | boolean | No | false | Whether to automatically redirect to login if not authenticated |

#### Dependencies

This component requires:
- react-router-dom
- react-oidc-context

Make sure these are installed and properly configured in your application.