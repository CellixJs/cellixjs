import { useMutation, useQuery } from '@apollo/client';
import { StaffAuthContext } from '@ocom/ui-staff-shared';
import { App } from 'antd';
import type React from 'react';
import { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { StaffRolesForSelectDocument, StaffUserAssignRoleDocument, StaffUserDetailDocument, StaffUsersListDocument } from '../generated.tsx';
import { StaffUserDetail } from './staff-user-detail.tsx';

export const StaffUserDetailContainer: React.FC = () => {
	const params = useParams<{ id?: string }>();
	const userId = params.id ?? '';
	const auth = useContext(StaffAuthContext);
	const canAssignRoles = auth?.permissions?.canAssignStaffUserRoles === true;
	const { message } = App.useApp();

	const { data: userData, loading: userLoading } = useQuery(StaffUserDetailDocument, {
		variables: { id: userId },
		skip: !userId,
	});

	const { data: rolesData, loading: rolesLoading } = useQuery(StaffRolesForSelectDocument);

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
	const loading = userLoading || rolesLoading || assignLoading;

	return (
		<StaffUserDetail
			data={
				user
					? { id: String(user.id), displayName: user.displayName, email: user.email, role: user.role ? { id: String(user.role.id), roleName: user.role.roleName } : null, createdAt: String(user.createdAt ?? '') }
					: { id: userId, displayName: 'Loading...', email: '', role: null, createdAt: '' }
			}
			availableRoles={(rolesData?.staffRoles ?? []).map((r) => ({ id: String(r.id), roleName: r.roleName }))}
			canAssignRoles={canAssignRoles}
			onRoleChange={handleRoleChange}
			loading={loading}
		/>
	);
};
