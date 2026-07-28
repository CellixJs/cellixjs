import { PlaceholderPage } from '@ocom/ui-staff-shared';
import type React from 'react';
import { Route, Routes } from 'react-router-dom';
import { BlobExplorerPage } from './pages/blob-explorer.tsx';
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
							sectionName="Tech Admin"
							description="Tech admin route package mounted under /staff/tech."
							expectedRoles={['Staff.TechAdmin']}
						/>
					}
				/>
				<Route
					path="blob-explorer"
					element={<BlobExplorerPage />}
				/>
				<Route
					path="*"
					element={
						<PlaceholderPage
							sectionName="Tech Admin"
							description="Tech admin route package mounted under /staff/tech."
							expectedRoles={['Staff.TechAdmin']}
						/>
					}
				/>
			</Route>
		</Routes>
	);
};
