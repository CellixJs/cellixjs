import { StaffAuthContext } from '@ocom/ui-staff-shared';
import type React from 'react';
import { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { StaffUserDetail } from './staff-user-detail.tsx';
import { assignStaffUserRole, findStaffUserById, getAvailableStaffRoles } from './staff-users.mock-store.ts';

export const StaffUserDetailContainer: React.FC = () => {
	const params = useParams<{ id?: string }>();
	const userId = params.id ?? '';
	const auth = useContext(StaffAuthContext);
	const canAssignRoles = auth?.permissions?.canAssignStaffUserRoles === true;

	const currentUser = findStaffUserById(userId) ?? {
		id: userId,
		displayName: 'Unknown User',
		email: 'N/A',
		role: null,
		createdAt: new Date().toISOString(),
	};

	const handleRoleChange = (roleId: string) => {
		assignStaffUserRole(userId, roleId);
	};

	return (
		<StaffUserDetail
			data={currentUser}
			availableRoles={getAvailableStaffRoles()}
			canAssignRoles={canAssignRoles}
			onRoleChange={handleRoleChange}
			loading={false}
		/>
	);
};
