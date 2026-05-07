import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoggedInUserRootContainer } from './logged-in-user-root.container.tsx';
import { LoggedInUserRootContainerCurrentEndUserAndCreateIfNotExistsDocument, type LoggedInUserContainerEndUserFieldsFragment } from '../../../generated.tsx';

const {
	useApolloClientMock,
	useAuthMock,
	useQueryMock,
	handleLogoutMock,
	componentQueryLoaderMock,
	loggedInUserRootMock,
} = vi.hoisted(() => ({
	useApolloClientMock: vi.fn(),
	useAuthMock: vi.fn(),
	useQueryMock: vi.fn(),
	handleLogoutMock: vi.fn(),
	componentQueryLoaderMock: vi.fn(),
	loggedInUserRootMock: vi.fn(),
}));

vi.mock('@apollo/client', () => ({
	useApolloClient: useApolloClientMock,
	useQuery: useQueryMock,
}));

vi.mock('react-oidc-context', () => ({
	useAuth: useAuthMock,
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

vi.mock('./logged-in-user-root.tsx', () => ({
	LoggedInUserRoot: ({
		userData,
		handleLogout,
	}: {
		userData: LoggedInUserContainerEndUserFieldsFragment;
		handleLogout: () => void;
	}) => {
		loggedInUserRootMock({ userData, handleLogout });

		return (
			<button
				type="button"
				onClick={handleLogout}
			>
				root-user
			</button>
		);
	},
}));

describe('LoggedInUserRootContainer', () => {
	const auth = {
		removeUser: vi.fn(),
		signoutRedirect: vi.fn(),
	};

	const apolloClient = {
		clearStore: vi.fn(),
	};

	const currentEndUser = {
		id: 'user-1',
		externalId: null,
		personalInformation: {
			identityDetails: {
				restOfName: 'Jane',
				lastName: 'Smith',
			},
		},
	} as LoggedInUserContainerEndUserFieldsFragment;
	let container!: HTMLDivElement;
	let root!: ReturnType<typeof createRoot>;

	const renderContainer = (): HTMLDivElement => {
		container = document.createElement('div');
		document.body.appendChild(container);
		root = createRoot(container);

		act(() => {
			root.render(<LoggedInUserRootContainer autoLogin={false} />);
		});

		return container;
	};

	beforeEach(() => {
		vi.clearAllMocks();
		useAuthMock.mockReturnValue(auth);
		useApolloClientMock.mockReturnValue(apolloClient);
	});

	afterEach(() => {
		act(() => {
			root?.unmount();
		});
		container?.remove();
	});

	it('passes the query result and logout handler to the root view', () => {
		useQueryMock.mockReturnValue({
			loading: false,
			error: undefined,
			data: {
				currentEndUserAndCreateIfNotExists: currentEndUser,
			},
		});

		const renderedContainer = renderContainer();

		expect(useQueryMock).toHaveBeenCalledWith(LoggedInUserRootContainerCurrentEndUserAndCreateIfNotExistsDocument);
		expect(componentQueryLoaderMock).toHaveBeenCalledTimes(1);
		expect(loggedInUserRootMock).toHaveBeenCalledWith(
			expect.objectContaining({
				userData: currentEndUser,
				handleLogout: expect.any(Function),
			}),
		);

		const button = renderedContainer.querySelector('button');
		expect(button?.textContent).toBe('root-user');

		act(() => {
			button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		});

		expect(handleLogoutMock).toHaveBeenCalledWith(auth, apolloClient, globalThis.location.origin);
	});

	it('renders the empty-state fallback when the query has no data', () => {
		useQueryMock.mockReturnValue({
			loading: false,
			error: undefined,
			data: undefined,
		});

		const renderedContainer = renderContainer();

		expect(renderedContainer.querySelector('[data-testid="no-data-state"]')?.textContent).toBe('No Data');
		expect(loggedInUserRootMock).not.toHaveBeenCalled();
	});
});
