import type { MaintenanceMessageProviderProps } from '@cellix/ui-core';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MaintenanceMessageProviderGetServerDateDocument } from '../../../generated.tsx';
import { OcomMaintenanceMessageProvider } from './maintenance-message-provider.tsx';

const mocks = vi.hoisted(() => ({
	query: vi.fn(),
	getServerDate: vi.fn(),
	removeUser: vi.fn(),
	clearStore: vi.fn(),
	signoutRedirect: vi.fn(),
	navigate: vi.fn(),
	isAuthenticated: true,
	provider: vi.fn(),
}));

vi.mock('@apollo/client', () => ({ useLazyQuery: mocks.query, useApolloClient: () => mocks }));
vi.mock('react-oidc-context', () => ({ useAuth: () => mocks }));
vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('@cellix/ui-core', () => ({
	MaintenanceMessageProvider: (props: MaintenanceMessageProviderProps) => {
		mocks.provider(props);
		return props.children;
	},
}));

describe('OcomMaintenanceMessageProvider', () => {
	let container: HTMLDivElement;
	let root: ReturnType<typeof createRoot>;
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.isAuthenticated = true;
		mocks.query.mockReturnValue([mocks.getServerDate]);
		container = document.createElement('div');
		root = createRoot(container);
	});
	afterEach(() => {
		act(() => root.unmount());
	});

	function render(portalKey = 'UI_STAFF_PORTAL') {
		act(() =>
			root.render(
				<OcomMaintenanceMessageProvider
					portalKey={portalKey}
					timeoutBeforeMaintenance={75}
				>
					<span>Routes</span>
				</OcomMaintenanceMessageProvider>,
			),
		);
		return mocks.provider.mock.lastCall?.[0] as MaintenanceMessageProviderProps;
	}

	it.each(['UI_STAFF_PORTAL', 'UI_COMMUNITY_PORTAL'])('supplies the existing clock and application inputs for %s', async (portalKey) => {
		mocks.getServerDate.mockResolvedValue({ data: { serverDate: '2026-09-03T13:00:00Z' } });
		const props = render(portalKey);
		expect(props.portalKey).toBe(portalKey);
		expect(props.timeoutBeforeMaintenance).toBe(75);
		expect(props.runtime.isAuthenticated).toBe(true);
		expect(mocks.query).toHaveBeenCalledWith(MaintenanceMessageProviderGetServerDateDocument, { fetchPolicy: 'network-only' });
		await expect(props.runtime.getServerDate()).resolves.toBe('2026-09-03T13:00:00Z');
		expect(container.textContent).toBe('Routes');
	});

	it('preserves missing clock data and rejected requests', async () => {
		const props = render();
		mocks.getServerDate.mockResolvedValue({ data: undefined });
		await expect(props.runtime.getServerDate()).resolves.toBeUndefined();
		mocks.getServerDate.mockRejectedValue(new Error('offline'));
		await expect(props.runtime.getServerDate()).rejects.toThrow('offline');
	});

	it('preserves non-awaited logout call order and destination', () => {
		const pending = new Promise<void>(() => undefined);
		mocks.removeUser.mockReturnValue(pending);
		mocks.clearStore.mockReturnValue(pending);
		mocks.signoutRedirect.mockReturnValue(pending);
		render().runtime.onMaintenanceKickout();
		expect(mocks.removeUser).toHaveBeenCalledOnce();
		expect(mocks.clearStore).toHaveBeenCalledOnce();
		expect(mocks.signoutRedirect).toHaveBeenCalledWith({ post_logout_redirect_uri: globalThis.location.origin });
		expect(mocks.navigate).toHaveBeenCalledWith('/');
		expect(mocks.removeUser.mock.invocationCallOrder[0]).toBeLessThan(mocks.clearStore.mock.invocationCallOrder[0] ?? 0);
		expect(mocks.clearStore.mock.invocationCallOrder[0]).toBeLessThan(mocks.signoutRedirect.mock.invocationCallOrder[0] ?? 0);
		expect(mocks.signoutRedirect.mock.invocationCallOrder[0]).toBeLessThan(mocks.navigate.mock.invocationCallOrder[0] ?? 0);
	});

	it('keeps the clock callback stable and propagates authentication changes', () => {
		const first = render();
		mocks.isAuthenticated = false;
		const second = render();
		expect(second.runtime.getServerDate).toBe(first.runtime.getServerDate);
		expect(second.runtime.isAuthenticated).toBe(false);
	});
});
