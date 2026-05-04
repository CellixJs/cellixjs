import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SectionLayout } from './section-layout.tsx';
import { PlaceholderPage } from '@ocom/ui-staff-shared';

export const Root: React.FC = () => {
	return (
		<Routes>
			<Route path="/*" element={<SectionLayout />}>
				<Route index element={<PlaceholderPage sectionName="User Management" description="User management route package mounted under /staff/users." expectedRoles={["Staff.Admin", "Staff.UserManager"]} />} />
				<Route path="*" element={<PlaceholderPage sectionName="User Management" description="User management route package mounted under /staff/users." expectedRoles={["Staff.Admin", "Staff.UserManager"]} />} />
			</Route>
		</Routes>
	);
};
