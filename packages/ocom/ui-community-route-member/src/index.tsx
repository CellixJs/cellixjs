import type React from 'react';
import { Route, Routes } from 'react-router-dom';
import { MemberSectionLayout } from './components/member-section-layout.tsx';
import { MemberHome } from './pages/member-home.tsx';
import { MemberProperties } from './pages/member-properties.tsx';

export const Member: React.FC = () => (
	<Routes>
		<Route
			path=""
			element={<MemberSectionLayout />}
		>
			<Route
				index
				element={<MemberHome />}
			/>
			<Route
				path="properties/*"
				element={<MemberProperties />}
			/>
		</Route>
	</Routes>
);

export { MemberPropertiesCreate } from './components/member-properties-create.tsx';
export { MemberPropertiesDetail } from './components/member-properties-detail.tsx';
export { MemberPropertiesList } from './components/member-properties-list.tsx';
export { MemberPropertiesRouteGuardContainer } from './components/member-properties-route-guard.container.tsx';
export {
	MemberPropertiesListDocument,
	MemberPropertiesRouteGuardMembersForCurrentEndUserDocument,
	MemberPropertyCreateDocument,
	MemberPropertyDetailDocument,
	MemberPropertyUpdateDocument,
} from './generated.tsx';
