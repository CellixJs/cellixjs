import { useMutation } from '@apollo/client';
import { App } from 'antd';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffRoleCreateDocument, StaffRolesListDocument } from '../generated.tsx';
import { StaffRoleCreate, type StaffRoleFormValues } from './staff-role-create.tsx';

export const StaffRoleCreateContainer: React.FC = () => {
	const navigate = useNavigate();
	const { message } = App.useApp();

	const [staffRoleCreate, { loading }] = useMutation(StaffRoleCreateDocument, {
		refetchQueries: [{ query: StaffRolesListDocument }],
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
		/>
	);
};
