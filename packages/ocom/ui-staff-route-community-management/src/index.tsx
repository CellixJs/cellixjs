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
							sectionName="Community Management"
							description="Community management route package mounted under /staff/community-management."
							expectedRoles={['Staff.CommunityAdmin']}
						/>
					}
				/>
				<Route
					path="*"
					element={
						<PlaceholderPage
							sectionName="Community Management"
							description="Community management route package mounted under /staff/community-management."
							expectedRoles={['Staff.CommunityAdmin']}
						/>
					}
				/>
			</Route>
		</Routes>
	);
};
