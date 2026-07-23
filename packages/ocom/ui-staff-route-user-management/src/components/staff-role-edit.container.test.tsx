import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StaffRoleEditContainer } from './staff-role-edit.container.tsx';

const { useApolloClientMock, useMutationMock, useQueryMock, navigateMock, useParamsMock, messageSuccessMock, messageWarningMock, messageErrorMock, clientQueryMock, staffRoleCreateMock, auth } = vi.hoisted(() => ({
	useApolloClientMock: vi.fn(),
	useMutationMock: vi.fn(),
	useQueryMock: vi.fn(),
	navigateMock: vi.fn(),
	useParamsMock: vi.fn(),
	messageSuccessMock: vi.fn(),
	messageWarningMock: vi.fn(),
	messageErrorMock: vi.fn(),
	clientQueryMock: vi.fn(),
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
				warning: messageWarningMock,
				error: messageErrorMock,
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
		modify: vi.fn(),
	};
	let container!: HTMLDivElement;
	let root!: ReturnType<typeof createRoot>;

	beforeEach(() => {
		vi.clearAllMocks();
		useParamsMock.mockReturnValue({ id: roleId });
		useApolloClientMock.mockReturnValue({ cache, query: clientQueryMock });
		clientQueryMock.mockResolvedValue({ data: { staffRoles: [] } });
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
		expect(useMutationMock.mock.calls[1]?.[1]).toBeUndefined();

		const renderedProps = staffRoleCreateMock.mock.calls[0]?.[0] as { onDelete: () => Promise<void> };
		await act(async () => {
			await renderedProps.onDelete();
		});

		expect(deleteMutation).toHaveBeenCalledWith({ variables: { input: { id: roleId } } });
		const listModifier = cache.modify.mock.calls[0]?.[0].fields.staffRoles as (existingRoles: Array<{ __ref: string }>, options: { readField: (fieldName: string, role: { __ref: string }) => string }) => Array<{ __ref: string }>;
		const existingRoles = [{ __ref: `StaffRole:${roleId}` }, { __ref: 'StaffRole:role-456' }];
		expect(listModifier(existingRoles, { readField: (_fieldName, role) => role.__ref.replace('StaffRole:', '') })).toEqual([{ __ref: 'StaffRole:role-456' }]);
		expect(cache.evict).toHaveBeenNthCalledWith(1, { id: 'ROOT_QUERY', fieldName: 'staffRoleById', args: { id: roleId } });
		expect(cache.identify).toHaveBeenCalledWith({ __typename: 'StaffRole', id: roleId });
		expect(cache.evict).toHaveBeenNthCalledWith(2, { id: `StaffRole:${roleId}` });
		expect(cache.gc).toHaveBeenCalledTimes(1);
		expect(messageSuccessMock).toHaveBeenCalledWith('Role deleted successfully');
		expect(navigateMock).toHaveBeenCalledWith('..', { replace: true });
		expect(clientQueryMock).toHaveBeenCalledWith(expect.objectContaining({ fetchPolicy: 'network-only' }));
		expect(messageErrorMock).not.toHaveBeenCalled();
	});

	it('keeps deletion successful when the list refresh fails', async () => {
		clientQueryMock.mockRejectedValueOnce(new Error('refresh failed'));
		const renderedProps = staffRoleCreateMock.mock.calls[0]?.[0] as { onDelete: () => Promise<void> };

		await act(async () => {
			await renderedProps.onDelete();
			await Promise.resolve();
		});

		expect(messageSuccessMock).toHaveBeenCalledWith('Role deleted successfully');
		expect(navigateMock).toHaveBeenCalledWith('..', { replace: true });
		expect(messageErrorMock).not.toHaveBeenCalled();
		expect(messageWarningMock).toHaveBeenCalledWith('Role deleted, but the staff roles list could not be refreshed');
	});

	it('clears the deleted role and warns when reassignment remains pending', async () => {
		deleteMutation.mockResolvedValueOnce({
			data: {
				staffRoleDelete: {
					status: {
						success: true,
						errorMessage: 'Role deleted, but assigned staff users could not be reassigned; recovery will retry automatically',
					},
				},
			},
		});
		const renderedProps = staffRoleCreateMock.mock.calls[0]?.[0] as { onDelete: () => Promise<void> };

		await act(async () => {
			await renderedProps.onDelete();
		});

		expect(messageWarningMock).toHaveBeenCalledWith('Role deleted, but assigned staff users could not be reassigned; recovery will retry automatically');
		expect(messageSuccessMock).not.toHaveBeenCalled();
		expect(messageErrorMock).not.toHaveBeenCalled();
		expect(cache.modify).toHaveBeenCalledTimes(1);
		expect(cache.evict).toHaveBeenCalled();
		expect(navigateMock).toHaveBeenCalledWith('..', { replace: true });
	});
});
