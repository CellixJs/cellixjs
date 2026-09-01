import { Helmet } from '@dr.pogodin/react-helmet';
import type React from 'react';
import { Route, Routes } from 'react-router-dom';
import { MemberPropertiesRouteGuardContainer } from '../components/member-properties-route-guard.container.tsx';
import { MemberPropertiesCreatePage } from './member-properties-create.tsx';
import { MemberPropertiesDetailPage } from './member-properties-detail.tsx';
import { MemberPropertiesListPage } from './member-properties-list.tsx';

export const MemberProperties: React.FC = () => (
	<>
		<Helmet>
			<title>Properties</title>
		</Helmet>
		<MemberPropertiesRouteGuardContainer>
			<Routes>
				<Route
					path=""
					element={<MemberPropertiesListPage />}
				/>
				<Route
					path="create"
					element={<MemberPropertiesCreatePage />}
				/>
				<Route
					path=":id/*"
					element={<MemberPropertiesDetailPage />}
				/>
			</Routes>
		</MemberPropertiesRouteGuardContainer>
	</>
);
