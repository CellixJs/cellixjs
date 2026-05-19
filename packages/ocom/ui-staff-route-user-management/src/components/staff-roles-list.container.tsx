import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffRolesList } from './staff-roles-list.tsx';

export const StaffRolesListContainer: React.FC = () => {
	const navigate = useNavigate();

	const handleEdit = (_id: string) => {
		// TODO: Navigate to edit page when edit route is implemented
	};

	const handleCreate = () => {
		navigate('create');
	};

	return (
		<StaffRolesList
			data={[]}
			onEdit={handleEdit}
			onCreate={handleCreate}
			loading={false}
		/>
	);
};
