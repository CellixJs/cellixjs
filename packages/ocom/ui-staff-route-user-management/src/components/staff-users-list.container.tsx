import { useQuery } from '@apollo/client';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffUsersListDocument } from '../generated.tsx';
import { StaffUsersList } from './staff-users-list.tsx';

export const StaffUsersListContainer: React.FC = () => {
	const navigate = useNavigate();
	const { data, loading } = useQuery(StaffUsersListDocument, {
		fetchPolicy: 'cache-and-network',
	});

	const handleEdit = (id: string) => {
		navigate(id);
	};
	const handleCreate = () => {
		navigate('create');
	};

	return (
		<StaffUsersList
			data={(data?.staffUsers ?? []).map((u) => ({
				id: String(u.id),
				displayName: u.displayName,
				email: u.email,
				role: u.role ? { id: String(u.role.id), roleName: u.role.roleName } : null,
				createdAt: u.createdAt ? String(u.createdAt) : '',
			}))}
			onEdit={handleEdit}
			loading={loading}
            onCreate={handleCreate}
		/>
	);
};
