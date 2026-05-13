import type React from 'react';
import { Route, Routes } from 'react-router-dom';
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
				path=":id"
				element={<StaffUserDetailContainer />}
			/>
		</Routes>
	);
};
