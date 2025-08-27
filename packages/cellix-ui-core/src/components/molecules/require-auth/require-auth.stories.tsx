import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { RequireAuth } from './index.tsx';
import { AuthContext, type AuthContextProps } from 'react-oidc-context';
import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';

type AwaitedReturn<T> = T extends (...args: unknown[]) => Promise<infer R> ? R : never;

// Wrapper that injects a mocked AuthContext matching react-oidc-context shape
const Wrapper: React.FC<{ auth: Partial<AuthContextProps>; children: React.ReactNode }> = ({ auth, children }) => {
  // Provide minimal defaults and stub functions to avoid runtime errors
  const value = {
    activeNavigator: auth.activeNavigator,
    error: auth.error,
    isAuthenticated: auth.isAuthenticated ?? false,
    isLoading: auth.isLoading ?? false,
  signinRedirect: auth.signinRedirect ?? (() => Promise.resolve()),
  signoutRedirect: auth.signoutRedirect ?? (() => Promise.resolve()),
  removeUser: auth.removeUser ?? (() => Promise.resolve()),
    user: auth.user,
    events: auth.events ?? ({} as unknown),
    settings: auth.settings ?? ({} as unknown),
  signoutPopup: auth.signoutPopup ?? (() => Promise.resolve()),
  signinSilent: auth.signinSilent ?? (() => Promise.resolve(null as AwaitedReturn<AuthContextProps['signinSilent']>)),
  signinPopup: auth.signinPopup ?? (() => Promise.resolve(null as AwaitedReturn<AuthContextProps['signinPopup']>)),
  clearStaleState: auth.clearStaleState ?? (() => Promise.resolve()),
  querySessionStatus: auth.querySessionStatus ?? (() => Promise.resolve(null as AwaitedReturn<AuthContextProps['querySessionStatus']>)),
  } as AuthContextProps;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const meta = {
  title: 'UI/Core/Molecules/RequireAuth',
  component: RequireAuth,
  parameters: { layout: 'padded' }
} satisfies Meta<typeof RequireAuth>;

export default meta;
type Story = StoryObj<typeof RequireAuth>;

const Child = () => <div>Private Content</div>;

export const Loading: Story = {
  render: () => (
    <Wrapper auth={{ isLoading: true }}>
      <RequireAuth forceLogin={false}>
        <Child />
      </RequireAuth>
    </Wrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement as HTMLElement);
    expect(canvas.queryByText('Private Content')).toBeNull();
    await expect(canvas.findByText(/Please wait.../i)).resolves.toBeTruthy();
  }
};

export const Authenticated: Story = {
  render: () => (
    <Wrapper auth={{ isAuthenticated: true }}>
      <RequireAuth forceLogin={false}>
        <Child />
      </RequireAuth>
    </Wrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement as HTMLElement);
    await expect(canvas.findByText('Private Content')).resolves.toBeTruthy();
  }
};

export const ErrorState: Story = {
  parameters: {
    memoryRouter: {
      initialEntries: ['/private?from=story'],
    },
  },
  render: () => (
    <Wrapper
      auth={{
        error: (() => {
          const e = new Error('Auth failed') as Error & { innerError?: unknown; source: 'unknown' };
          e.source = 'unknown';
          return e;
        })(),
      }}
    >
      <Routes>
        <Route path="/" element={<div data-testid="home">Public Content</div>} />
        <Route
          path="/private"
          element={
            <RequireAuth forceLogin={false}>
              <Child />
            </RequireAuth>
          }
        />
        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
    </Wrapper>
  ),
  // Assert that Navigate to "/" occurred by verifying the Home route rendered
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement as HTMLElement);
    await expect(canvas.findByTestId('home')).resolves.toBeTruthy();
    expect(canvas.queryByText('Private Content')).toBeNull();
    expect(canvas.queryByText('Public Content')).toBeTruthy();
  }
};

export const NotAuthenticated: Story = {
  render: () => {
    // Local wrapper that renders a marker ONLY when signinRedirect() is actually called
    const InstrumentedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
      const [called, setCalled] = useState(false);
      const auth: Partial<AuthContextProps> = {
        isAuthenticated: false,
        isLoading: false,
        signinRedirect: () => {
          setCalled(true);
          return Promise.resolve();
        },
      };
      return (
        <AuthContext.Provider value={auth as AuthContextProps}>
          {children}
          {called && (
            <div data-testid="signinRedirect-called">signinRedirect called</div>
          )}
        </AuthContext.Provider>
      );
    };

    return (
      <InstrumentedProvider>
        <RequireAuth forceLogin={false}>
          <Child />
        </RequireAuth>
      </InstrumentedProvider>
    );
  },
  // Assert that redirectUser() triggered signinRedirect
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement as HTMLElement);
    const el = await canvas.findByTestId('signinRedirect-called');
    expect(el).toBeVisible();
    expect(canvas.queryByText('Private Content')).toBeNull();
  }
};
