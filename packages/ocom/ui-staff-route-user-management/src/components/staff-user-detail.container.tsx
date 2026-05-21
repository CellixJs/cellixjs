import { useMutation, useQuery } from '@apollo/client';
import { StaffAuthContext } from '@ocom/ui-staff-shared';
import { App } from 'antd';
import type React from 'react';
import { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { StaffRolesForSelectDocument, StaffUserAssignRoleDocument, StaffUserDetailDocument, StaffUsersListDocument, CurrentStaffUserDocument } from '../generated.tsx';
import { StaffUserDetail } from './staff-user-detail.tsx';

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

export const StaffUserDetailContainer: React.FC = () => {
	const params = useParams<{ id?: string }>();
	const userId = params.id ?? '';
	const auth = useContext(StaffAuthContext);
	const canAssignRoles =
		auth?.permissions?.canAssignStaffRoles === true ||
		auth?.permissions?.canManageUsers === true ||
		auth?.permissions?.canManageStaffRolesAndPermissions === true ||
		auth?.permissions?.canManageTechAdmin === true;
	const { message } = App.useApp();

	const { data: userData, loading: userLoading } = useQuery(StaffUserDetailDocument, {
		variables: { id: userId },
		skip: !userId,
	});

	const { data: currentUserData, loading: currentUserLoading } = useQuery(CurrentStaffUserDocument, {
		fetchPolicy: 'cache-and-network',
	});

	const { data: rolesData, loading: rolesLoading } = useQuery(StaffRolesForSelectDocument, {
		fetchPolicy: 'cache-and-network',
	});

	const [assignRole, { loading: assignLoading }] = useMutation(StaffUserAssignRoleDocument, {
		refetchQueries: [
			{ query: StaffUserDetailDocument, variables: { id: userId } },
			{ query: StaffUsersListDocument },
		],
	});

	const handleRoleChange = async (roleId: string) => {
		try {
			const result = await assignRole({
				variables: { input: { staffUserId: userId, roleId } },
			});
			if (result.data?.staffUserAssignRole.status.success) {
				message.success('Role assigned successfully');
			} else {
				message.error(result.data?.staffUserAssignRole.status.errorMessage ?? 'Failed to assign role');
			}
		} catch (_err) {
			message.error('Failed to assign role');
		}
	};

	const user = userData?.staffUserById;
	const currentUser = currentUserData?.currentStaffUserAndCreateIfNotExists;
	const isEditingOwnRole = user?.id === currentUser?.id;
	const loading = userLoading || rolesLoading || assignLoading || currentUserLoading;

	// Determine which enterprise app role types the current viewer can assign
	const viewerAllowedRoleTypes = getAllowedEnterpriseAppRoles(auth?.enterpriseAppRole);
	// The target user's enterprise app role type (from their current assigned role)
	const targetUserEnterpriseAppRole = user?.role?.enterpriseAppRole ?? null;

	const filteredRoles = (rolesData?.staffRoles ?? []).filter((r) => {
		if (!viewerAllowedRoleTypes.includes(r.enterpriseAppRole)) return false;
		// If the target user already has a role type, only show roles of the same type
		if (targetUserEnterpriseAppRole && r.enterpriseAppRole !== targetUserEnterpriseAppRole) return false;
		return true;
	});

	return (
		<StaffUserDetail
			data={
				user
					? { id: String(user.id), displayName: user.displayName, email: user.email, role: user.role ? { id: String(user.role.id), roleName: user.role.roleName } : null, createdAt: String(user.createdAt ?? '') }
					: { id: userId, displayName: 'Loading...', email: '', role: null, createdAt: '' }
			}
			availableRoles={filteredRoles.map((r) => ({ id: String(r.id), roleName: r.roleName }))}
			canAssignRoles={canAssignRoles && !isEditingOwnRole}
			isEditingOwnRole={isEditingOwnRole}
			{...(user?.role?.roleName && { currentRoleName: user.role.roleName })}
			onRoleChange={handleRoleChange}
			loading={loading}
		/>
	);
};
