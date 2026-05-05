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
							sectionName="Community Management"
							description="Community management route package mounted under /staff/community."
							expectedRoles={['Staff.CommunityAdmin']}
						/>
					}
				/>
				<Route
					path="*"
					element={
						<PlaceholderPage
							sectionName="Community Management"
							description="Community management route package mounted under /staff/community."
							expectedRoles={['Staff.CommunityAdmin']}
						/>
					}
				/>
			</Route>
		</Routes>
	);
};
