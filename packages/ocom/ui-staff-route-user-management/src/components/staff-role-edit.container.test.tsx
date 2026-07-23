import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StaffRoleEditContainer } from './staff-role-edit.container.tsx';

const { useApolloClientMock, useMutationMock, useQueryMock, navigateMock, useParamsMock, messageSuccessMock, staffRoleCreateMock, auth } = vi.hoisted(() => ({
	useApolloClientMock: vi.fn(),
	useMutationMock: vi.fn(),
	useQueryMock: vi.fn(),
	navigateMock: vi.fn(),
	useParamsMock: vi.fn(),
	messageSuccessMock: vi.fn(),
	staffRoleCreateMock: vi.fn(),
	auth: {
		name: 'Role Manager',
		enterpriseAppRole: 'Staff.TechAdmin',
		permissions: {
			canEditRole: true,
			canRemoveRole: true,
			canManageTechAdmin: true,
		},
	},
}));

vi.mock('@apollo/client', () => ({
	useApolloClient: useApolloClientMock,
	useMutation: useMutationMock,
	useQuery: useQueryMock,
}));

vi.mock('@ocom/ui-staff-shared', async () => {
	const { createContext } = await import('react');
	return {
		StaffAuthContext: createContext(auth),
	};
});

vi.mock('antd', () => ({
	App: {
		useApp: () => ({
			message: {
				success: messageSuccessMock,
				error: vi.fn(),
			},
		}),
	},
	Spin: () => null,
}));

vi.mock('react-router-dom', () => ({
	Navigate: () => null,
	useNavigate: () => navigateMock,
	useParams: useParamsMock,
}));

vi.mock('./staff-role-create.tsx', () => ({
	StaffRoleCreate: (props: unknown) => {
		staffRoleCreateMock(props);
		return null;
	},
}));

describe('StaffRoleEditContainer', () => {
	const roleId = 'role-123';
	const deleteMutation = vi.fn();
	const cache = {
		evict: vi.fn(),
		identify: vi.fn(() => `StaffRole:${roleId}`),
		gc: vi.fn(),
	};
	let container!: HTMLDivElement;
	let root!: ReturnType<typeof createRoot>;

	beforeEach(() => {
		vi.clearAllMocks();
		useParamsMock.mockReturnValue({ id: roleId });
		useApolloClientMock.mockReturnValue({ cache });
		useQueryMock.mockReturnValue({
			loading: false,
			data: {
				staffRoleById: {
					__typename: 'StaffRole',
					id: roleId,
					roleName: 'Temporary Role',
					isDefault: false,
					enterpriseAppRole: 'Staff.CaseManager',
					permissions: {
						communityPermissions: {},
						userPermissions: {},
						staffRolePermissions: {},
						financePermissions: {},
						techAdminPermissions: {},
					},
				},
			},
		});
		deleteMutation.mockResolvedValue({
			data: {
				staffRoleDelete: {
					status: {
						success: true,
					},
				},
			},
		});
		useMutationMock.mockReturnValueOnce([vi.fn(), { loading: false }]).mockReturnValueOnce([deleteMutation, { loading: false }]);

		container = document.createElement('div');
		document.body.appendChild(container);
		root = createRoot(container);
		act(() => {
			root.render(<StaffRoleEditContainer />);
		});
	});

	afterEach(() => {
		act(() => {
			root.unmount();
		});
		container.remove();
	});

	it('evicts deleted role details and replaces the edit history entry', async () => {
		const deleteMutationOptions = useMutationMock.mock.calls[1]?.[1] as { awaitRefetchQueries?: boolean };
		expect(deleteMutationOptions.awaitRefetchQueries).toBe(true);

		const renderedProps = staffRoleCreateMock.mock.calls[0]?.[0] as { onDelete: () => Promise<void> };
		await act(async () => {
			await renderedProps.onDelete();
		});

		expect(deleteMutation).toHaveBeenCalledWith({ variables: { input: { id: roleId } } });
		expect(cache.evict).toHaveBeenNthCalledWith(1, { id: 'ROOT_QUERY', fieldName: 'staffRoleById', args: { id: roleId } });
		expect(cache.identify).toHaveBeenCalledWith({ __typename: 'StaffRole', id: roleId });
		expect(cache.evict).toHaveBeenNthCalledWith(2, { id: `StaffRole:${roleId}` });
		expect(cache.gc).toHaveBeenCalledTimes(1);
		expect(messageSuccessMock).toHaveBeenCalledWith('Role deleted successfully');
		expect(navigateMock).toHaveBeenCalledWith('..', { replace: true });
	});
});
