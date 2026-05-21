import { useMutation, useQuery } from '@apollo/client';
import { StaffAuthContext } from '@ocom/ui-staff-shared';
import { App } from 'antd';
import type React from 'react';
import { useContext } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { StaffUserCreateDocument, StaffUserCreateRolesDocument, StaffUsersListDocument, type StaffUsersListQuery } from '../generated.tsx';
import { StaffUserCreate, type StaffUserCreateFormValues } from './staff-user-create.tsx';

const EnterpriseAppRoleNames = {
	CaseManager: 'Staff.CaseManager',
	ServiceLineOwner: 'Staff.ServiceLineOwner',
	Finance: 'Staff.Finance',
	TechAdmin: 'Staff.TechAdmin',
} as const;

function getAllowedEnterpriseAppRoles(enterpriseAppRole: string | undefined): string[] {
	switch (enterpriseAppRole) {
		case EnterpriseAppRoleNames.TechAdmin:
			return Object.values(EnterpriseAppRoleNames);
		case EnterpriseAppRoleNames.ServiceLineOwner:
			return [EnterpriseAppRoleNames.ServiceLineOwner, EnterpriseAppRoleNames.CaseManager];
		case EnterpriseAppRoleNames.CaseManager:
			return [EnterpriseAppRoleNames.CaseManager];
		case EnterpriseAppRoleNames.Finance:
			return [EnterpriseAppRoleNames.Finance];
		default:
			return [];
	}
}

export const StaffUserCreateContainer: React.FC = () => {
	const navigate = useNavigate();
	const { message } = App.useApp();
	const auth = useContext(StaffAuthContext);
	const allowedEnterpriseAppRoles = getAllowedEnterpriseAppRoles(auth?.enterpriseAppRole);
	const canCreateUser =
		auth?.permissions?.canManageUsers === true ||
		auth?.permissions?.canManageStaffRolesAndPermissions === true ||
		auth?.permissions?.canManageTechAdmin === true;

	const { data: rolesData, loading: rolesLoading } = useQuery(StaffUserCreateRolesDocument, {
		fetchPolicy: 'cache-and-network',
	});

	const [createStaffUser, { loading: createLoading }] = useMutation(StaffUserCreateDocument, {
		update: (cache, { data }) => {
			const newUser = data?.staffUserCreate.staffUser;
			if (!newUser) return undefined;
			cache.updateQuery({ query: StaffUsersListDocument }, (existing: StaffUsersListQuery | null): StaffUsersListQuery | null => {
				if (!existing) return { staffUsers: [newUser] };
				if (existing.staffUsers.some((user) => String(user.id) === String(newUser.id))) return existing;
				return { staffUsers: [...existing.staffUsers, newUser] };
			});
			return undefined;
		},
	});

	if (!canCreateUser) {
		return (
			<Navigate
				to="/unauthorized"
				replace
			/>
		);
	}

	const handleSubmit = async (values: StaffUserCreateFormValues) => {
		try {
			const result = await createStaffUser({
				variables: {
					input: {
						firstName: values.firstName,
						lastName: values.lastName,
						email: values.email,
						roleId: values.roleId ?? null,
					},
				},
			});
			if (result.data?.staffUserCreate.status.success) {
				message.success('Staff user created successfully');
				navigate('..');
			} else {
				message.error(result.data?.staffUserCreate.status.errorMessage ?? 'Failed to create staff user');
			}
		} catch (_err) {
			message.error('Failed to create staff user');
		}
	};

	const handleCancel = () => {
		navigate('..');
	};

	const availableRoles = (rolesData?.staffRoles ?? []).filter((role) => allowedEnterpriseAppRoles.includes(role.enterpriseAppRole));

	return (
		<StaffUserCreate
			availableRoles={availableRoles.map((role) => ({ id: String(role.id), roleName: role.roleName }))}
			onSubmit={handleSubmit}
			onCancel={handleCancel}
			loading={rolesLoading || createLoading}
		/>
	);
};
