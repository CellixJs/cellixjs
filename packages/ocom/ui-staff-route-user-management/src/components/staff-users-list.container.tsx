import type React from 'react';
import { useNavigate } from 'react-router-dom';
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
			data={[]}
			onEdit={handleEdit}
			onCreate={handleCreate}
			loading={false}
		/>
	);
};
