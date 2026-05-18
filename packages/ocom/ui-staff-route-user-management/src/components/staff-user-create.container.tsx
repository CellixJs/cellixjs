import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffUserCreate, type StaffUserCreateFormValues } from './staff-user-create.tsx';
import { createStaffUser, getAvailableStaffRoles } from './staff-users.mock-store.ts';

export const StaffUserCreateContainer: React.FC = () => {
	const navigate = useNavigate();

	const handleSubmit = (values: StaffUserCreateFormValues) => {
		createStaffUser(values);
		navigate('..');
	};

	const handleCancel = () => {
		navigate('..');
	};

	return (
		<StaffUserCreate
			availableRoles={getAvailableStaffRoles()}
			onSubmit={handleSubmit}
			onCancel={handleCancel}
			loading={false}
		/>
	);
};
