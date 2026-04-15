import { RequireAuth } from '@cellix/ui-core';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { hasAuthParamsMock, useAuthMock, useLocationMock } = vi.hoisted(() => ({
	hasAuthParamsMock: vi.fn(),
	useAuthMock: vi.fn(),
	useLocationMock: vi.fn(),
}));

vi.mock('react-oidc-context', () => ({
	hasAuthParams: hasAuthParamsMock,
	useAuth: useAuthMock,
}));

vi.mock('react-router-dom', () => ({
	useLocation: useLocationMock,
}));

function baseAuthState() {
	return {
		activeNavigator: undefined as string | undefined,
		error: undefined as Error | undefined,
		isAuthenticated: false,
		isLoading: false,
		signinRedirect: vi.fn(() => Promise.resolve()),
	};
}

function createAuthState(overrides: Partial<ReturnType<typeof baseAuthState>> = {}) {
	return {
		...baseAuthState(),
		...overrides,
	};
}

describe('RequireAuth useEffect behavior', () => {
	beforeEach(() => {
		hasAuthParamsMock.mockReturnValue(false);
		useAuthMock.mockReturnValue(createAuthState());
		useLocationMock.mockReturnValue({ pathname: '/private', search: '?tab=overview' });
	});

	it('sets sessionStorage.redirectTo when forceLogin true and unauthenticated (useEffect)', async () => {
		const signinRedirectSpy = vi.fn(() => Promise.resolve());
		useAuthMock.mockReturnValue(createAuthState({ isAuthenticated: false, signinRedirect: signinRedirectSpy }));

		const originalSessionStorage = (globalThis as unknown as { sessionStorage?: { setItem?: (k: string, v: string) => void } }).sessionStorage;
		const setItemMock = vi.fn();
		(globalThis as unknown as { sessionStorage?: { setItem?: (k: string, v: string) => void } }).sessionStorage = { setItem: setItemMock };

		render(
			<RequireAuth forceLogin={true}>
				<div>Private content</div>
			</RequireAuth>,
		);

		await waitFor(() => {
			expect(setItemMock).toHaveBeenCalledWith('redirectTo', '/private?tab=overview');
		});

		(globalThis as unknown as { sessionStorage?: { setItem?: (k: string, v: string) => void } }).sessionStorage = originalSessionStorage;
	});
});
