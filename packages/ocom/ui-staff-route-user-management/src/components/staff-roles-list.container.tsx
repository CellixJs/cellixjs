import { useQuery } from '@apollo/client';
import { StaffAuthContext } from '@ocom/ui-staff-shared';
import type React from 'react';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffRolesListDocument } from '../generated.tsx';
import { StaffRolesList } from './staff-roles-list.tsx';

export const StaffRolesListContainer: React.FC = () => {
	const navigate = useNavigate();
	const auth = useContext(StaffAuthContext);
	const perms = auth?.permissions;
	const canCreate = perms?.canAddRole === true || perms?.canManageStaffRolesAndPermissions === true || perms?.canManageTechAdmin === true;
	const canEdit = perms?.canEditRole === true || perms?.canManageStaffRolesAndPermissions === true || perms?.canManageTechAdmin === true;
	const { data, loading } = useQuery(StaffRolesListDocument, {
		fetchPolicy: 'cache-and-network',
	});

	const handleEdit = (id: string) => {
		navigate(`edit/${id}`);
	};

	const handleCreate = () => {
		navigate('create');
	};

	return (
		<StaffRolesList
			data={(data?.staffRoles ?? []).map((r) => ({
				id: String(r.id),
				roleName: r.roleName,
				enterpriseAppRole: r.enterpriseAppRole,
				createdAt: r.createdAt ? String(r.createdAt) : '',
				updatedAt: r.updatedAt ? String(r.updatedAt) : '',
			}))}
			onEdit={handleEdit}
			onCreate={handleCreate}
			loading={loading}
			canCreate={canCreate}
			canEdit={canEdit}
		/>
	);
};
