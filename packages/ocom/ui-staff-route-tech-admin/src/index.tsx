import type React from 'react';
import { Route, Routes } from 'react-router-dom';
import { BlobStorageExplorerPage } from './pages/blob-storage-explorer.tsx';
import { DatabaseExplorerPage } from './pages/database-explorer.tsx';
import { SectionLayout } from './section-layout.tsx';

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
				<Route
					path="blob-storage-explorer"
					element={<BlobStorageExplorerPage />}
				/>
			</Route>
		</Routes>
	);
};
