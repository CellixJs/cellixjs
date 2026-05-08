import { PlaceholderPage } from '@ocom/ui-staff-shared';
import type React from 'react';
import { Route, Routes } from 'react-router-dom';
import { SectionLayout } from './section-layout.tsx';

export const Root: React.FC = () => {
	const expectedRoles = ['Staff.Finance'];

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
							sectionName="Finance"
							description="Finance route package mounted under /staff/finance."
							expectedRoles={expectedRoles}
						/>
					}
				/>
				<Route
					path="*"
					element={
						<PlaceholderPage
							sectionName="Finance"
							description="Finance route package mounted under /staff/finance."
							expectedRoles={expectedRoles}
						/>
					}
				/>
			</Route>
		</Routes>
	);
};
