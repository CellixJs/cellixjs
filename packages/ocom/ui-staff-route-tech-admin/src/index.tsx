import type React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { TechAdminPage } from './pages/tech-admin.tsx';
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
							to="queue-explorer"
							replace
						/>
					}
				/>
				<Route
					path="*"
					element={<TechAdminPage />}
				/>
			</Route>
		</Routes>
	);
};
