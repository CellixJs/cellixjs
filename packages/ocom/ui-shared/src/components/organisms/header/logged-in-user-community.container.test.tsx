import React from 'react';
import { Skeleton } from 'antd';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoggedInUserCommunityContainer } from './logged-in-user-community.container.tsx';

const {
	useApolloClientMock,
	useAuthMock,
	useParamsMock,
	handleLogoutMock,
	componentQueryLoaderMock,
	loggedInUserCommunityMock,
} = vi.hoisted(() => ({
	useApolloClientMock: vi.fn(),
	useAuthMock: vi.fn(),
	useParamsMock: vi.fn(),
	handleLogoutMock: vi.fn(),
	componentQueryLoaderMock: vi.fn(),
	loggedInUserCommunityMock: vi.fn(),
}));

vi.mock('@apollo/client', () => ({
	useApolloClient: useApolloClientMock,
}));

vi.mock('react-oidc-context', () => ({
	useAuth: useAuthMock,
}));

vi.mock('react-router-dom', () => ({
	useParams: useParamsMock,
}));

vi.mock('@cellix/ui-core', () => ({
	ComponentQueryLoader: (props: {
		loading: boolean;
		error?: Error;
		hasData: object | null | undefined;
		hasDataComponent: React.ReactNode;
		noDataComponent?: React.ReactNode;
	}) => {
		componentQueryLoaderMock(props);

		if (props.error) {
			return <div data-testid="error-state">error</div>;
		}

		if (props.loading) {
			return <div data-testid="loading-state">loading</div>;
		}

		if (props.hasData) {
			return <div data-testid="success-state">{props.hasDataComponent}</div>;
		}

		return <div data-testid="no-data-state">{props.noDataComponent ?? null}</div>;
	},
}));

vi.mock('./handle-logout.tsx', () => ({
	HandleLogout: handleLogoutMock,
}));

vi.mock('./logged-in-user-community.tsx', () => ({
	LoggedInUserCommunity: ({
		data,
		handleLogout,
	}: {
		data: {
			communityId: string;
			userCurrent: { id: string };
			memberForCurrentUser: { profile: { avatarDocumentId: string } };
		};
		handleLogout: () => void;
	}) => {
		loggedInUserCommunityMock({ data, handleLogout });

		return (
			<button
				type="button"
				onClick={handleLogout}
			>
				community-user
			</button>
		);
	},
}));

describe('LoggedInUserCommunityContainer', () => {
	const auth = {
		removeUser: vi.fn(),
		signoutRedirect: vi.fn(),
	};

	const apolloClient = {
		clearStore: vi.fn(),
	};
	let container!: HTMLDivElement;
	let root!: ReturnType<typeof createRoot>;

	const renderContainer = (): HTMLDivElement => {
		container = document.createElement('div');
		document.body.appendChild(container);
		root = createRoot(container);

		act(() => {
			root.render(<LoggedInUserCommunityContainer autoLogin={false} />);
		});

		return container;
	};

	beforeEach(() => {
		vi.clearAllMocks();
		useAuthMock.mockReturnValue(auth);
		useApolloClientMock.mockReturnValue(apolloClient);
		useParamsMock.mockReturnValue({ communityId: 'community-123' });
	});

	afterEach(() => {
		act(() => {
			root?.unmount();
		});
		container?.remove();
	});

	it('passes the route community id and logout handler to the community view', () => {
		const renderedContainer = renderContainer();

		expect(componentQueryLoaderMock).toHaveBeenCalledTimes(1);

		const loaderProps = componentQueryLoaderMock.mock.calls[0]?.[0] as {
			loading: boolean;
			error?: Error;
			hasData: object | null | undefined;
			noDataComponent?: React.ReactNode;
		};

		expect(loaderProps.loading).toBe(false);
		expect(loaderProps.error).toBeUndefined();
		expect(loaderProps.hasData).toEqual(
			expect.objectContaining({
				profile: expect.objectContaining({
					avatarDocumentId: 'avatar-id',
				}),
			}),
		);
		expect(loaderProps.noDataComponent).toEqual(expect.any(Object));
		expect((loaderProps.noDataComponent as React.ReactElement).type).toBe(Skeleton);

		expect(loggedInUserCommunityMock).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					communityId: 'community-123',
					userCurrent: expect.objectContaining({
						id: '1',
					}),
					memberForCurrentUser: expect.objectContaining({
						profile: expect.objectContaining({
							avatarDocumentId: 'avatar-id',
						}),
					}),
				}),
				handleLogout: expect.any(Function),
			}),
		);

		const button = renderedContainer.querySelector('button');
		expect(button?.textContent).toBe('community-user');

		act(() => {
			button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		});

		expect(handleLogoutMock).toHaveBeenCalledWith(auth, apolloClient, globalThis.location.origin);
	});
});
