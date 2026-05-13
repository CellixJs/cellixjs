import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { type StaffRole, StaffRolesList } from './staff-roles-list.tsx';

// TODO: Replace with GraphQL query when staff roles API is available
const PLACEHOLDER_DATA: StaffRole[] = [];

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
			data={PLACEHOLDER_DATA}
			onEdit={handleEdit}
			onCreate={handleCreate}
			loading={false}
		/>
	);
};
