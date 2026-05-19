import { StaffAuthContext } from '@ocom/ui-staff-shared';
import type React from 'react';
import { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { StaffUserDetail } from './staff-user-detail.tsx';
import type { StaffUser } from './staff-users-list.tsx';

// TODO: Replace with GraphQL query when staff users API is available
const PLACEHOLDER_USER: StaffUser = {
	id: '',
	displayName: 'Loading...',
	email: '',
	role: null,
	createdAt: new Date().toISOString(),
};

export const StaffUserDetailContainer: React.FC = () => {
	const params = useParams<{ id?: string }>();
	const userId = params.id ?? '';
	const auth = useContext(StaffAuthContext);
	const canAssignRoles = auth?.permissions?.canAssignStaffUserRoles === true;

	const handleRoleChange = (_roleId: string) => {
		// TODO: Implement role assignment mutation when API is available
	};

	return (
		<StaffUserDetail
			data={{ ...PLACEHOLDER_USER, id: userId }}
			availableRoles={[]}
			canAssignRoles={canAssignRoles}
			onRoleChange={handleRoleChange}
			loading={false}
		/>
	);
};
