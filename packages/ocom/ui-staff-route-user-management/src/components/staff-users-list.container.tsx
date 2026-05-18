import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { listStaffUsers } from './staff-users.mock-store.ts';
import { StaffUsersList } from './staff-users-list.tsx';

export const StaffUsersListContainer: React.FC = () => {
	const navigate = useNavigate();

	const handleEdit = (id: string) => {
		navigate(id);
	};
	const handleCreate = () => {
		navigate('create');
	};

	return (
		<StaffUsersList
			data={listStaffUsers()}
			onEdit={handleEdit}
			onCreate={handleCreate}
			loading={false}
		/>
	);
};
