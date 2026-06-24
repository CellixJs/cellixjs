import { useMutation, useQuery } from '@apollo/client';
import { StaffAuthContext } from '@ocom/ui-staff-shared';
import { App } from 'antd';
import type React from 'react';
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CurrentStaffUserDocument, StaffRolesForSelectDocument, StaffUserAssignRoleDocument, StaffUserDetailDocument, StaffUsersListDocument } from '../generated.tsx';
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
		auth?.permissions?.canAssignStaffRoles === true || auth?.permissions?.canManageUsers === true || auth?.permissions?.canManageStaffRolesAndPermissions === true || auth?.permissions?.canManageTechAdmin === true;
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

	const user = userData?.staffUserById;
	const currentUser = currentUserData?.currentStaffUserAndCreateIfNotExists;
	const isEditingOwnRole = user?.id === currentUser?.id;
	const currentRoleId = user?.role?.id ? String(user.role.id) : null;
	const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

	const [assignRole, { loading: assignLoading }] = useMutation(StaffUserAssignRoleDocument, {
		refetchQueries: [{ query: StaffUserDetailDocument, variables: { id: userId } }, { query: StaffUsersListDocument }],
	});

	useEffect(() => {
		setSelectedRoleId(currentRoleId);
	}, [currentRoleId]);

	const handleRoleChange = (roleId: string) => {
		setSelectedRoleId(roleId);
	};

	const handleSave = async () => {
		if (!selectedRoleId || selectedRoleId === currentRoleId) {
			return;
		}
		try {
			const result = await assignRole({
				variables: { input: { staffUserId: userId, roleId: selectedRoleId } },
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

	const loading = userLoading || rolesLoading || assignLoading || currentUserLoading;
	const saveDisabled = selectedRoleId == null || selectedRoleId === currentRoleId || assignLoading;

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

	// Always include the user's current role in the options so the Select can render its label
	// (the current role may be outside the viewer's assignable set but must still display correctly)
	const currentUserRole = user?.role ? { id: String(user.role.id), roleName: user.role.roleName } : null;
	const mappedFilteredRoles = filteredRoles.map((r) => ({ id: String(r.id), roleName: r.roleName }));
	const availableRolesWithCurrent = currentUserRole && !mappedFilteredRoles.some((r) => r.id === currentUserRole.id) ? [currentUserRole, ...mappedFilteredRoles] : mappedFilteredRoles;

	return (
		<StaffUserDetail
			data={
				user
					? { id: String(user.id), displayName: user.displayName, email: user.email, role: user.role ? { id: String(user.role.id), roleName: user.role.roleName } : null, createdAt: String(user.createdAt ?? '') }
					: { id: userId, displayName: 'Loading...', email: '', role: null, createdAt: '' }
			}
			availableRoles={availableRolesWithCurrent}
			canAssignRoles={canAssignRoles && !isEditingOwnRole}
			isEditingOwnRole={isEditingOwnRole}
			{...(user?.role?.roleName && { currentRoleName: user.role.roleName })}
			selectedRoleId={selectedRoleId}
			onRoleChange={handleRoleChange}
			onSave={handleSave}
			saveDisabled={saveDisabled}
			loading={loading}
			saveLoading={assignLoading}
			activityLog={(user?.activityLog ?? []).map((entry) => ({
				activityType: entry.activityType,
				activityDescription: entry.activityDescription,
				activityByStaffUserId: entry.activityByStaffUserId,
				activityByStaffUserDisplayName: entry.activityByStaffUserDisplayName,
				createdAt: String(entry.createdAt),
			}))}
		/>
	);
};
