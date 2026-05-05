import { PlaceholderPage } from '@ocom/ui-staff-shared';
import type React from 'react';
import { Route, Routes } from 'react-router-dom';
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
						<PlaceholderPage
							sectionName="User Management"
							description="User management route package mounted under /staff/user-management."
							expectedRoles={['Staff.Admin', 'Staff.UserManager']}
						/>
					}
				/>
				<Route
					path="*"
					element={
						<PlaceholderPage
							sectionName="User Management"
							description="User management route package mounted under /staff/user-management."
							expectedRoles={['Staff.Admin', 'Staff.UserManager']}
						/>
					}
				/>
			</Route>
		</Routes>
	);
};
