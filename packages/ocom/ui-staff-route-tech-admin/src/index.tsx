import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SectionLayout } from './section-layout.tsx';
import { PlaceholderPage } from '@ocom/ui-staff-shared';

export const Root: React.FC = () => {
	return (
		<Routes>
			<Route path="/*" element={<SectionLayout />}>
				<Route index element={<PlaceholderPage sectionName="Tech Admin" description="Tech admin route package mounted under /staff/tech." expectedRoles={["Staff.TechAdmin"]} />} />
				<Route path="*" element={<PlaceholderPage sectionName="Tech Admin" description="Tech admin route package mounted under /staff/tech." expectedRoles={["Staff.TechAdmin"]} />} />
			</Route>
		</Routes>
	);
};
