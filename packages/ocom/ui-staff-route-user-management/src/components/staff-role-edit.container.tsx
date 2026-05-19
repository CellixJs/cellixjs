import { useMutation, useQuery } from '@apollo/client';
import { StaffAuthContext } from '@ocom/ui-staff-shared';
import { App, Spin } from 'antd';
import type React from 'react';
import { useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StaffRoleByIdDocument, StaffRolesListDocument, StaffRoleUpdateDocument } from '../generated.tsx';
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

export const StaffRoleEditContainer: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { message } = App.useApp();
	const auth = useContext(StaffAuthContext);
	const availableEnterpriseAppRoles = getAllowedEnterpriseAppRoles(auth?.enterpriseAppRole);
	const showTechAdminPermissions = auth?.permissions?.canManageTechAdmin === true;

	const { data, loading: queryLoading } = useQuery(StaffRoleByIdDocument, {
		variables: { id: id ?? '' },
		skip: !id,
	});

	const [staffRoleUpdate, { loading: mutationLoading }] = useMutation(StaffRoleUpdateDocument, {
		refetchQueries: [{ query: StaffRolesListDocument }],
	});

	const handleSubmit = async (values: StaffRoleFormValues) => {
		if (!id) return;
		try {
			const result = await staffRoleUpdate({
				variables: {
					input: {
						id,
						roleName: values.roleName,
						enterpriseAppRole: values.enterpriseAppRole,
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
			if (result.data?.staffRoleUpdate.status.success) {
				message.success('Role updated successfully');
				navigate('..');
			} else {
				message.error(result.data?.staffRoleUpdate.status.errorMessage ?? 'Failed to update role');
			}
		} catch (_err) {
			message.error('Failed to update role');
		}
	};

	const handleCancel = () => {
		navigate('..');
	};

	if (queryLoading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
				<Spin size="large" />
			</div>
		);
	}

	const role = data?.staffRoleById;
	const initialValues: Partial<StaffRoleFormValues> = role
		? {
				roleName: role.roleName,
				enterpriseAppRole: role.enterpriseAppRole,
				canManageCommunities: role.permissions.communityPermissions.canManageCommunities,
				canManageUsers: role.permissions.userPermissions.canManageUsers,
				canManageFinance: role.permissions.financePermissions.canManageFinance,
				canManageTechAdmin: role.permissions.techAdminPermissions.canManageTechAdmin,
				canAssignStaffUserRoles: role.permissions.userPermissions.canAssignStaffUserRoles,
			}
		: {};

	return (
		<StaffRoleCreate
			mode="edit"
			onSubmit={handleSubmit}
			onCancel={handleCancel}
			loading={mutationLoading}
			availableEnterpriseAppRoles={availableEnterpriseAppRoles}
			showTechAdminPermissions={showTechAdminPermissions}
			initialValues={initialValues}
		/>
	);
};
