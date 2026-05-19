import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffUserCreate, type StaffUserCreateFormValues } from './staff-user-create.tsx';

export const StaffUserCreateContainer: React.FC = () => {
	const navigate = useNavigate();

	const handleSubmit = (_values: StaffUserCreateFormValues) => {
		navigate('..');
	};

	const handleCancel = () => {
		navigate('..');
	};

	return (
		<StaffUserCreate
			availableRoles={[]}
			onSubmit={handleSubmit}
			onCancel={handleCancel}
			loading={false}
		/>
	);
};
