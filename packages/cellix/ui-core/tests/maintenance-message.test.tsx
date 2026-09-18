import { FeatureFlagsContext, ImpendingMessage, MaintenanceMessage, MaintenanceMessageProvider, type MaintenanceMessageProviderProps, useMaintenanceMessage } from '@cellix/ui-core';
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const collaborators = vi.hoisted(() => ({
	getServerDate: vi.fn(),
	removeUser: vi.fn(),
	clearStore: vi.fn(),
	signoutRedirect: vi.fn(),
	navigate: vi.fn(),
	isAuthenticated: true,
}));

vi.mock('antd', () => ({
	Alert: ({ message }: { message: ReactNode }) => <div role="alert">{message}</div>,
	Row: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	Col: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	Result: () => <div />,
}));

const runtime = {
	getServerDate: collaborators.getServerDate,
	get isAuthenticated() {
		return collaborators.isAuthenticated;
	},
	onMaintenanceKickout: () => {
		collaborators.removeUser();
		collaborators.clearStore();
		collaborators.signoutRedirect({ post_logout_redirect_uri: globalThis.location.origin });
		collaborators.navigate('/');
	},
};
const portalKey = 'UI_STAFF_PORTAL';
const displayConfig = {
	locale: 'en',
	timeZone: 'America/New_York',
	dateTimeFormat: 'h:mm a on dddd, MMMM DD, YYYY',
	dateFormat: 'MMMM DD',
	impendingTop: '60px',
	approachingTop: '100px',
};
const flags: Record<string, string> = {
	[`MAINTENANCE_UPCOMING_${portalKey}`]: 'true',
	[`MAINTENANCE_IMPENDING_TIMESTAMP_${portalKey}`]: '2026-09-03T12:00:00Z',
	[`MAINTENANCE_START_TIMESTAMP_${portalKey}`]: '2026-09-03T13:30:00Z',
	[`MAINTENANCE_END_TIMESTAMP_${portalKey}`]: '2026-09-03T14:30:00Z',
	[`MAINTENANCE_MSG_IMPENDING_${portalKey}`]: 'Upcoming ##timeRangeStr##: ##startTimestampStr## to ##endTimestampStr##',
	[`MAINTENANCE_MSG_SYSTEM_${portalKey}`]: '<b>Unavailable ##timeRangeStr##</b>',
};

function StateReader() {
	const state = useMaintenanceMessage();
	return <output>{JSON.stringify(state)}</output>;
}

describe('MaintenanceMessageProvider public behavior', () => {
	let container: HTMLDivElement;
	let root: ReturnType<typeof createRoot>;
	let upcoming = 'true';

	beforeEach(() => {
		vi.useFakeTimers();
		vi.clearAllMocks();
		collaborators.isAuthenticated = true;
		upcoming = 'true';
		container = document.createElement('div');
		document.body.appendChild(container);
		root = createRoot(container);
	});

	afterEach(() => {
		act(() => root.unmount());
		container.remove();
		globalThis.history.pushState({}, '', '/');
		vi.useRealTimers();
	});

	async function renderAt(serverDate: string, timeoutBeforeMaintenance = 120, children: ReactNode = <StateReader />, overrides: Partial<MaintenanceMessageProviderProps> = {}) {
		collaborators.getServerDate.mockResolvedValue(serverDate);
		await act(async () => {
			root.render(
				<FeatureFlagsContext.Provider value={{ FeatureFlagList: undefined, GetFeatureFlagByName: (name) => (name === `MAINTENANCE_UPCOMING_${portalKey}` ? upcoming : (flags[name] ?? '')) }}>
					<MaintenanceMessageProvider
						portalKey={portalKey}
						runtime={runtime}
						timeoutBeforeMaintenance={timeoutBeforeMaintenance}
						{...overrides}
					>
						{children}
					</MaintenanceMessageProvider>
				</FeatureFlagsContext.Provider>,
			);
			await Promise.resolve();
		});
	}

	it.each([
		['2026-09-03T11:59:59Z', false, false],
		['2026-09-03T12:00:00Z', true, false],
		['2026-09-03T13:30:00Z', false, true],
		['2026-09-03T14:30:00Z', false, false],
	])('keeps schedule boundaries at %s', async (time, isImpending, isMaintenance) => {
		await renderAt(time);
		expect(JSON.parse(container.querySelector('output')?.textContent ?? '{}')).toMatchObject({ isImpending, isMaintenance });
		expect(collaborators.getServerDate).toHaveBeenCalledTimes(1);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(5000);
		});
		expect(collaborators.getServerDate).toHaveBeenCalledTimes(2);
	});

	it.each([0, -1, Number.NaN, 120])('keeps the 120 second threshold for %s', async (timeout) => {
		await renderAt('2026-09-03T13:28:00Z', timeout);
		expect(container.textContent).toContain('Maintenance will begin in 2:00. Please save your work and log out.');
	});

	it('keeps the zero-countdown logout call order without awaiting', async () => {
		await renderAt('2026-09-03T13:29:59Z');
		await act(async () => {
			await vi.advanceTimersByTimeAsync(1000);
		});
		expect(collaborators.removeUser).toHaveBeenCalledOnce();
		expect(collaborators.clearStore).toHaveBeenCalledOnce();
		expect(collaborators.signoutRedirect).toHaveBeenCalledWith({ post_logout_redirect_uri: globalThis.location.origin });
		expect(collaborators.navigate).toHaveBeenCalledWith('/');
		expect(collaborators.removeUser.mock.invocationCallOrder[0]).toBeLessThan(collaborators.clearStore.mock.invocationCallOrder[0] ?? 0);
		expect(collaborators.clearStore.mock.invocationCallOrder[0]).toBeLessThan(collaborators.signoutRedirect.mock.invocationCallOrder[0] ?? 0);
		expect(collaborators.signoutRedirect.mock.invocationCallOrder[0]).toBeLessThan(collaborators.navigate.mock.invocationCallOrder[0] ?? 0);
	});

	it('does not display or run the countdown for unauthenticated users', async () => {
		collaborators.isAuthenticated = false;
		await renderAt('2026-09-03T13:29:59Z');
		await act(async () => {
			await vi.advanceTimersByTimeAsync(1000);
		});
		expect(container.querySelector('[role="alert"]')).toBeNull();
		expect(collaborators.removeUser).not.toHaveBeenCalled();
	});

	it.each(['false', ''])('preserves disabled or unresolved flags (%s)', async (value) => {
		upcoming = value;
		await renderAt('2026-09-03T13:29:59Z');
		expect(collaborators.getServerDate).not.toHaveBeenCalled();
		expect(container.querySelector('[role="alert"]')).toBeNull();
	});

	it('preserves message tokens, Eastern time, and impending positioning', async () => {
		await renderAt(
			'2026-09-03T13:00:00Z',
			120,
			<>
				<ImpendingMessage
					portalKey={portalKey}
					displayConfig={displayConfig}
				/>
				<MaintenanceMessage
					portalKey={portalKey}
					displayConfig={displayConfig}
				/>
			</>,
		);
		expect(container.textContent).toContain('Upcoming September 03: 9:30 am on Thursday, September 03, 2026 to 10:30 am on Thursday, September 03, 2026');
		expect(container.querySelector('b')?.textContent).toBe('Unavailable September 03');
		expect(container.querySelector<HTMLElement>('[data-testid="impending-message"]')?.style.top).toBe('60px');
	});

	it('uses caller-owned formatting and offsets', async () => {
		await renderAt(
			'2026-09-03T13:29:59Z',
			120,
			<ImpendingMessage
				portalKey={portalKey}
				displayConfig={{ ...displayConfig, timeZone: 'UTC', dateTimeFormat: 'HH:mm', approachingTop: '42px' }}
			/>,
		);
		expect(container.textContent).toContain('Upcoming September 03: 13:30 to 14:30');
		expect(container.querySelector<HTMLElement>('[data-testid="impending-message"]')?.style.top).toBe('42px');
	});

	it.each([
		[{}, false, false],
		[{ storybookShowImpendingMessage: true }, true, false],
		[{ storybookShowMaintenanceMessage: true }, false, true],
		[{ storybookShowImpendingMessage: true, storybookShowMaintenanceMessage: true }, true, false],
	])('preserves Storybook overrides %j', async (overrides, isImpending, isMaintenance) => {
		globalThis.history.pushState({}, '', '/iframe.html');
		await renderAt('2026-09-03T13:00:00Z', 120, <StateReader />, overrides);
		expect(JSON.parse(container.querySelector('output')?.textContent ?? '{}')).toMatchObject({ isImpending, isMaintenance });
		expect(collaborators.getServerDate).not.toHaveBeenCalled();
	});

	it('keeps current state when a clock request fails', async () => {
		await renderAt('2026-09-03T13:00:00Z');
		const previous = container.textContent;
		collaborators.getServerDate.mockRejectedValue(new Error('offline'));
		await act(async () => {
			await vi.advanceTimersByTimeAsync(5000);
		});
		expect(container.textContent).toBe(previous);
	});

	it('keeps root-page alerts in normal flow', async () => {
		await renderAt(
			'2026-09-03T13:00:00Z',
			120,
			<ImpendingMessage
				portalKey={portalKey}
				displayConfig={displayConfig}
				isRootPage
			/>,
		);
		expect(container.querySelector<HTMLElement>('[data-testid="impending-message"]')?.style.position).toBe('');
	});

	it('keeps the application-selected shorter countdown threshold', async () => {
		await renderAt('2026-09-03T13:28:00Z', 60);
		expect(container.querySelector('[role="alert"]')).toBeNull();
	});
});
