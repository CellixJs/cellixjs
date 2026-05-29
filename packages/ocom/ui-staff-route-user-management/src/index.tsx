import type React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { UserManagementPage } from './pages/user-management.tsx';
import { SectionLayout } from './section-layout.tsx';

export const Root: React.FC = () => {
	return (
		<Routes>
			<Route
				path="/*"
				element={<SectionLayout />}
			>
				<Route
					index
					element={
						<Navigate
							to="staff-users"
							replace
						/>
					}
				/>
				<Route
					path="*"
					element={<UserManagementPage />}
				/>
			</Route>
		</Routes>
	);
};
