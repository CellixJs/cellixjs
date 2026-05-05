import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SectionLayout } from './section-layout.tsx';
import { PlaceholderPage } from '@ocom/ui-staff-shared';

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
							sectionName="Finance"
							description="Finance route package mounted under /staff/finance."
							expectedRoles={['Staff.Finance']}
						/>
					}
				/>
				<Route
					path="*"
					element={
						<PlaceholderPage
							sectionName="Finance"
							description="Finance route package mounted under /staff/finance."
							expectedRoles={['Staff.Finance']}
						/>
					}
				/>
			</Route>
		</Routes>
	);
};
