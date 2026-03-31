import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { RequireAuth } from './index.tsx';

const { mockUseAuth, mockHasAuthParams, mockUseLocation } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockHasAuthParams: vi.fn(),
  mockUseLocation: vi.fn(),
}));

vi.mock('react-oidc-context', () => ({
  useAuth: mockUseAuth,
  hasAuthParams: mockHasAuthParams,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    useLocation: mockUseLocation,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
  };
});

describe('RequireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasAuthParams.mockReturnValue(false);
    mockUseLocation.mockReturnValue({ pathname: '/private', search: '?tab=1' });
    globalThis.sessionStorage.clear();
  });

  it('renders a loading state while auth is loading', () => {
    mockUseAuth.mockReturnValue({
      isLoading: true,
      activeNavigator: undefined,
      isAuthenticated: false,
      error: undefined,
      signinRedirect: vi.fn(),
    });

    render(
      <MemoryRouter>
        <RequireAuth forceLogin={false}>
          <div>Private content</div>
        </RequireAuth>
      </MemoryRouter>,
    );

    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('renders children when already authenticated', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      activeNavigator: undefined,
      isAuthenticated: true,
      error: undefined,
      signinRedirect: vi.fn(),
    });

    render(
      <MemoryRouter>
        <RequireAuth forceLogin={false}>
          <div>Private content</div>
        </RequireAuth>
      </MemoryRouter>,
    );

    expect(screen.getByText('Private content')).toBeInTheDocument();
  });

  it('redirects to the home route when auth has an error', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      activeNavigator: undefined,
      isAuthenticated: false,
      error: new Error('Auth failed'),
      signinRedirect: vi.fn(),
    });

    render(
      <MemoryRouter>
        <RequireAuth forceLogin={false}>
          <div>Private content</div>
        </RequireAuth>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('navigate')).toHaveTextContent('/');
  });

  it('calls signinRedirect when unauthenticated without forceLogin', async () => {
    const signinRedirect = vi.fn().mockResolvedValue(undefined);

    mockUseAuth.mockReturnValue({
      isLoading: false,
      activeNavigator: undefined,
      isAuthenticated: false,
      error: undefined,
      signinRedirect,
    });

    render(
      <MemoryRouter>
        <RequireAuth forceLogin={false}>
          <div>Private content</div>
        </RequireAuth>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(signinRedirect).toHaveBeenCalledTimes(1);
    });
  });

  it('stores the redirect target and signs in when forceLogin is enabled', async () => {
    const signinRedirect = vi.fn().mockResolvedValue(undefined);

    mockUseAuth.mockReturnValue({
      isLoading: false,
      activeNavigator: undefined,
      isAuthenticated: false,
      error: undefined,
      signinRedirect,
    });

    render(
      <MemoryRouter>
        <RequireAuth forceLogin>
          <div>Private content</div>
        </RequireAuth>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(signinRedirect).toHaveBeenCalled();
    });

    expect(globalThis.sessionStorage.getItem('redirectTo')).toBe('/private?tab=1');
  });

  it('does not store a redirect target when auth params are present before redirecting', async () => {
    const signinRedirect = vi.fn().mockResolvedValue(undefined);

    mockHasAuthParams.mockReturnValue(true);
    mockUseAuth.mockReturnValue({
      isLoading: false,
      activeNavigator: undefined,
      isAuthenticated: false,
      error: undefined,
      signinRedirect,
    });

    render(
      <MemoryRouter>
        <RequireAuth forceLogin>
          <div>Private content</div>
        </RequireAuth>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(signinRedirect).toHaveBeenCalledTimes(1);
    });

    expect(globalThis.sessionStorage.getItem('redirectTo')).toBeNull();
  });
});
