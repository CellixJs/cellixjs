import type React from 'react';
import { Route, Routes } from 'react-router-dom';
import { StaffUserCreateContainer } from '../components/staff-user-create.container.tsx';
import { StaffUserDetailContainer } from '../components/staff-user-detail.container.tsx';
import { StaffUsersListContainer } from '../components/staff-users-list.container.tsx';

export const StaffUsersPage: React.FC = () => {
	return (
		<Routes>
			<Route
				path=""
				element={<StaffUsersListContainer />}
			/>
			<Route
				path="create"
				element={<StaffUserCreateContainer />}
			/>
			<Route
				path=":id"
				element={<StaffUserDetailContainer />}
			/>
		</Routes>
	);
};
