import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffRoleCreate, type StaffRoleFormValues } from './staff-role-create.tsx';

export const StaffRoleCreateContainer: React.FC = () => {
	const navigate = useNavigate();

	const handleSubmit = (_values: StaffRoleFormValues) => {
		// TODO: Implement create role mutation when API is available
		navigate('..');
	};

	const handleCancel = () => {
		navigate('..');
	};

	return (
		<StaffRoleCreate
			onSubmit={handleSubmit}
			onCancel={handleCancel}
			loading={false}
		/>
	);
};
