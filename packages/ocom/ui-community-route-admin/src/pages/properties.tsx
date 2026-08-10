import { Helmet } from '@dr.pogodin/react-helmet';
import type React from 'react';
import { Route, Routes } from 'react-router-dom';
import { PropertiesRouteGuardContainer } from '../components/properties-route-guard.container.tsx';
import { PropertiesCreate } from './properties-create.tsx';
import { PropertiesDetail } from './properties-detail.tsx';
import { PropertiesList } from './properties-list.tsx';

export const Properties: React.FC = () => {
	return (
		<>
			<Helmet>
				<title>Properties</title>
			</Helmet>
			<PropertiesRouteGuardContainer>
				<Routes>
					<Route
						path=""
						element={<PropertiesList />}
					/>
					<Route
						path="create"
						element={<PropertiesCreate />}
					/>
					<Route
						path=":id/*"
						element={<PropertiesDetail />}
					/>
				</Routes>
			</PropertiesRouteGuardContainer>
		</>
	);
};
