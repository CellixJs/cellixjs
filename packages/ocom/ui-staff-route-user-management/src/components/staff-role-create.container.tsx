import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffRoleCreate, type StaffRoleFormValues } from './staff-role-create.tsx';
import { createStaffRole } from './staff-users.mock-store.ts';

export const StaffRoleCreateContainer: React.FC = () => {
	const navigate = useNavigate();

	const handleSubmit = (values: StaffRoleFormValues) => {
		createStaffRole(values);
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
