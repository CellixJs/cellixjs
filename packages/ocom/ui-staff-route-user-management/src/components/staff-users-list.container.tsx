import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { type StaffUser, StaffUsersList } from './staff-users-list.tsx';

// TODO: Replace with GraphQL query when staff users API is available
const PLACEHOLDER_DATA: StaffUser[] = [];

export const StaffUsersListContainer: React.FC = () => {
	const navigate = useNavigate();

	const handleEdit = (id: string) => {
		navigate(id);
	};

	return (
		<StaffUsersList
			data={PLACEHOLDER_DATA}
			onEdit={handleEdit}
			loading={false}
		/>
	);
};
