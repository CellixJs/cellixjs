import type React from 'react';
import { Route, Routes } from 'react-router-dom';
import { StaffRoleCreateContainer } from '../components/staff-role-create.container.tsx';
import { StaffRolesListContainer } from '../components/staff-roles-list.container.tsx';

export const StaffRolesPage: React.FC = () => {
	return (
		<Routes>
			<Route
				path=""
				element={<StaffRolesListContainer />}
			/>
			<Route
				path="create"
				element={<StaffRoleCreateContainer />}
			/>
		</Routes>
	);
};
