import { Helmet } from '@dr.pogodin/react-helmet';
import type React from 'react';
import { Route, Routes } from 'react-router-dom';
import { VideosDetail } from './videos-detail.tsx';
import { VideosList } from './videos-list.tsx';

export const Videos: React.FC = () => {
	return (
		<>
			<Helmet>
				<title>Videos</title>
			</Helmet>
			<Routes>
				<Route
					path=""
					element={<VideosList />}
				/>
				<Route
					path=":videoId"
					element={<VideosDetail />}
				/>
			</Routes>
		</>
	);
};
