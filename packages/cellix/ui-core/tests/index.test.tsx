import type React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentQueryLoader, RequireAuth } from '@cellix/ui-core';

const { hasAuthParamsMock, messageErrorMock, useAuthMock, useLocationMock } = vi.hoisted(() => ({
	hasAuthParamsMock: vi.fn(),
	messageErrorMock: vi.fn(),
	useAuthMock: vi.fn(),
	useLocationMock: vi.fn(),
}));

vi.mock('antd', () => ({
	message: {
		error: messageErrorMock,
	},
	Row: ({ children }: { children?: React.ReactNode }) => <div data-kind="row">{children}</div>,
	Space: ({ children }: { children?: React.ReactNode }) => <div data-kind="space">{children}</div>,
	Spin: () => <div data-kind="spin" />,
	Skeleton: ({ active, loading, paragraph, title }: { active?: boolean; loading?: boolean; paragraph?: { rows?: number }; title?: boolean }) => (
		<div
			data-active={String(Boolean(active))}
			data-kind="skeleton"
			data-loading={String(Boolean(loading))}
			data-rows={String(paragraph?.rows ?? '')}
			data-title={String(Boolean(title))}
		/>
	),
	Typography: {
		Title: ({ children }: { children?: React.ReactNode }) => <h2>{children}</h2>,
	},
}));

vi.mock('react-oidc-context', () => ({
	hasAuthParams: hasAuthParamsMock,
	useAuth: useAuthMock,
}));

vi.mock('react-router-dom', () => ({
	Navigate: ({ to }: { to: string }) => (
		<div
			data-kind="navigate"
			data-to={to}
		/>
	),
	useLocation: useLocationMock,
}));

function createAuthState(overrides: Partial<ReturnType<typeof baseAuthState>> = {}) {
	return {
		...baseAuthState(),
		...overrides,
	};
}

function baseAuthState() {
	return {
		activeNavigator: undefined as string | undefined,
		error: undefined as Error | undefined,
		isAuthenticated: false,
		isLoading: false,
		signinRedirect: vi.fn(() => Promise.resolve()),
	};
}

describe('@cellix/ui-core public contract', () => {
	beforeEach(() => {
		hasAuthParamsMock.mockReturnValue(false);
		messageErrorMock.mockReset();
		useAuthMock.mockReturnValue(createAuthState());
		useLocationMock.mockReturnValue({ pathname: '/private', search: '?tab=overview' });
	});

	describe('ComponentQueryLoader', () => {
		it('renders the provided data component when data is present', () => {
			const html = renderToStaticMarkup(
				<ComponentQueryLoader
					error={undefined}
					hasData={{ id: '123' }}
					hasDataComponent={<div>Loaded data</div>}
					loading={false}
				/>,
			);

			expect(html).toContain('Loaded data');
			expect(messageErrorMock).not.toHaveBeenCalled();
		});

		it('reports errors through the antd message API and falls back to a skeleton', () => {
			const html = renderToStaticMarkup(
				<ComponentQueryLoader
					error={new Error('Query failed')}
					hasData={null}
					hasDataComponent={<div>Loaded data</div>}
					loading={false}
				/>,
			);

			expect(messageErrorMock).toHaveBeenCalledWith('Query failed');
			expect(html).toContain('data-kind="skeleton"');
		});

		it('renders the loading fallback when the query is still in progress', () => {
			const html = renderToStaticMarkup(
				<ComponentQueryLoader
					error={undefined}
					hasData={null}
					hasDataComponent={<div>Loaded data</div>}
					loading={true}
				/>,
			);

			expect(html).toContain('data-kind="skeleton"');
			expect(html).toContain('data-active="true"');
			expect(html).toContain('data-rows="3"');
		});
	});

	describe('RequireAuth', () => {
		it('renders a loading placeholder while auth state is resolving', () => {
			useAuthMock.mockReturnValue(createAuthState({ isLoading: true }));

			const html = renderToStaticMarkup(
				<RequireAuth forceLogin={false}>
					<div>Private content</div>
				</RequireAuth>,
			);

			expect(html).toContain('Please wait...');
			expect(html).toContain('data-kind="spin"');
		});

		it('renders protected children for authenticated users', () => {
			useAuthMock.mockReturnValue(createAuthState({ isAuthenticated: true }));

			const html = renderToStaticMarkup(
				<RequireAuth forceLogin={false}>
					<div>Private content</div>
				</RequireAuth>,
			);

			expect(html).toContain('Private content');
		});

		it('redirects to the home route when the auth provider reports an error', () => {
			useAuthMock.mockReturnValue(createAuthState({ error: new Error('Auth failed') }));

			const html = renderToStaticMarkup(
				<RequireAuth forceLogin={false}>
					<div>Private content</div>
				</RequireAuth>,
			);

			expect(html).toContain('data-kind="navigate"');
			expect(html).toContain('data-to="/"');
		});

		it('triggers sign-in when a user reaches protected content without an active session', () => {
			const signinRedirect = vi.fn(() => Promise.resolve());
			useAuthMock.mockReturnValue(createAuthState({ signinRedirect }));

			const html = renderToStaticMarkup(
				<RequireAuth forceLogin={false}>
					<div>Private content</div>
				</RequireAuth>,
			);

			expect(signinRedirect).toHaveBeenCalledTimes(1);
			expect(html).toBe('');
		});

		it('stores redirect target and triggers signinRedirect when unauthenticated with forceLogin=true', () => {
			const signinRedirectSpy = vi.fn(() => Promise.resolve());
			useAuthMock.mockReturnValue(createAuthState({ isAuthenticated: false, signinRedirect: signinRedirectSpy }));
			sessionStorage.clear();

			renderToStaticMarkup(
				<RequireAuth forceLogin={true}>
					<div>Private content</div>
				</RequireAuth>,
			);

			expect(sessionStorage.getItem('redirectTo')).toBe('/private?tab=overview');
			expect(signinRedirectSpy).toHaveBeenCalledTimes(1);
		});

		it('does not trigger signinRedirect again when auth parameters are already present', () => {
			const signinRedirectSpy = vi.fn(() => Promise.resolve());
			hasAuthParamsMock.mockReturnValue(true);
			useAuthMock.mockReturnValue(createAuthState({ isAuthenticated: false, signinRedirect: signinRedirectSpy }));

			const html = renderToStaticMarkup(
				<RequireAuth forceLogin={true}>
					<div>Private content</div>
				</RequireAuth>,
			);

			expect(signinRedirectSpy).not.toHaveBeenCalled();
			expect(html).toContain('Please wait');
			expect(html).not.toContain('Private content');
		});

		it('does not trigger signinRedirect again when a redirect is already in progress', () => {
			const signinRedirectSpy = vi.fn(() => Promise.resolve());
			useAuthMock.mockReturnValue(
				createAuthState({
					isAuthenticated: false,
					activeNavigator: 'signinRedirect',
					signinRedirect: signinRedirectSpy,
				}),
			);

			const html = renderToStaticMarkup(
				<RequireAuth forceLogin={true}>
					<div>Private content</div>
				</RequireAuth>,
			);

			expect(signinRedirectSpy).not.toHaveBeenCalled();
			expect(html).toContain('Please wait');
			expect(html).not.toContain('Private content');
		});

		it('prefers the error branch over unauthenticated forceLogin behaviour', () => {
			const signinRedirectSpy = vi.fn(() => Promise.resolve());
			useAuthMock.mockReturnValue(
				createAuthState({
					isAuthenticated: false,
					error: new Error('Boom'),
					signinRedirect: signinRedirectSpy,
				}),
			);

			const html = renderToStaticMarkup(
				<RequireAuth forceLogin={true}>
					<div>Private content</div>
				</RequireAuth>,
			);

			expect(signinRedirectSpy).not.toHaveBeenCalled();
			expect(html).not.toContain('Private content');
			expect(html).toContain('data-kind="navigate"');
		});
	});
});
