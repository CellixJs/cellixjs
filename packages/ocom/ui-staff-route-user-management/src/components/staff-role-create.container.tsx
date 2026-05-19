import { useMutation } from '@apollo/client';
import { StaffAuthContext } from '@ocom/ui-staff-shared';
import { App } from 'antd';
import type React from 'react';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffRoleCreateDocument, StaffRolesForSelectDocument, StaffRolesListDocument, type StaffRolesForSelectQuery, type StaffRolesListQuery } from '../generated.tsx';
import { StaffRoleCreate, type StaffRoleFormValues } from './staff-role-create.tsx';

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

export const StaffRoleCreateContainer: React.FC = () => {
	const navigate = useNavigate();
	const { message } = App.useApp();
	const auth = useContext(StaffAuthContext);
	const availableEnterpriseAppRoles = getAllowedEnterpriseAppRoles(auth?.enterpriseAppRole);
	const showTechAdminPermissions = auth?.permissions?.canManageTechAdmin === true;

	const [staffRoleCreate, { loading }] = useMutation(StaffRoleCreateDocument, {
		update: (cache, { data }) => {
			const newRole = data?.staffRoleCreate.staffRole;
			if (!newRole) return;
			const updateRolesList = (existing: StaffRolesListQuery | null): StaffRolesListQuery | null => {
				if (!existing) return { staffRoles: [newRole] };
				if (existing.staffRoles.some((role) => String(role.id) === String(newRole.id))) return existing;
				return { staffRoles: [...existing.staffRoles, newRole] };
			};
			const updateRolesSelect = (existing: StaffRolesForSelectQuery | null): StaffRolesForSelectQuery | null => {
				if (!existing) return { staffRoles: [newRole] };
				if (existing.staffRoles.some((role) => String(role.id) === String(newRole.id))) return existing;
				return { staffRoles: [...existing.staffRoles, newRole] };
			};
			cache.updateQuery({ query: StaffRolesListDocument }, updateRolesList);
			cache.updateQuery({ query: StaffRolesForSelectDocument }, updateRolesSelect);
		},
	});

	const handleSubmit = async (values: StaffRoleFormValues) => {
		try {
			const result = await staffRoleCreate({
				variables: {
					input: {
						roleName: values.roleName,
						enterpriseAppRole: values.enterpriseAppRole || null,
						permissions: {
							communityPermissions: {
								canManageCommunities: values.canManageCommunities,
							},
							userPermissions: {
								canManageUsers: values.canManageUsers,
								canAssignStaffUserRoles: values.canAssignStaffUserRoles,
							},
						},
					},
				},
			});
			if (result.data?.staffRoleCreate.status.success) {
				message.success('Role created successfully');
				navigate('..');
			} else {
				message.error(result.data?.staffRoleCreate.status.errorMessage ?? 'Failed to create role');
			}
		} catch (_err) {
			message.error('Failed to create role');
		}
	};

	const handleCancel = () => {
		navigate('..');
	};

	return (
		<StaffRoleCreate
			onSubmit={handleSubmit}
			onCancel={handleCancel}
			loading={loading}
			availableEnterpriseAppRoles={availableEnterpriseAppRoles}
			showTechAdminPermissions={showTechAdminPermissions}
		/>
	);
};
