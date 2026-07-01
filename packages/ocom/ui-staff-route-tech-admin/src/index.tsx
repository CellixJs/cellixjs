import type React from 'react';
import { Route, Routes } from 'react-router-dom';
import { SectionLayout } from './section-layout.tsx';
import { DatabaseExplorerPage } from './pages/database-explorer.tsx';

export const Root: React.FC = () => {
	return (
		<Routes>
			<Route
				path="/*"
				element={<SectionLayout />}
			>
				<Route
					path="database-explorer"
					element={<DatabaseExplorerPage />}
				/>
			</Route>
		</Routes>
	);
};
