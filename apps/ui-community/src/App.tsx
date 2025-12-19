import { RequireAuth } from '@cellix/ui-core';
import { Route, Routes } from 'react-router-dom';
import './App.css';
import { Accounts } from './components/layouts/accounts/index.tsx';
import { Admin } from './components/layouts/admin/index.tsx';
import { Root } from './components/layouts/root/index.tsx';
import { AuthLanding } from './components/ui/molecules/auth-landing/index.tsx';
import { ApolloConnection } from './components/ui/organisms/apollo-connection/index.tsx';

export default function App() {
	const authSection = (
        <RequireAuth forceLogin={true}>
            <AuthLanding />
        </RequireAuth>
	);

	const rootSection = <Root />;

	const communitySection = (
		<RequireAuth forceLogin={false}>
            <Routes>
                <Route path="/" element={<Accounts />} />
                <Route path="/accounts/*" element={<Accounts />} />
                <Route path="/admin/*" element={<Admin />} />
            </Routes>
		</RequireAuth>
	);

	return (
        <ApolloConnection>
            <Routes>
                <Route path="*" element={rootSection} />
                <Route path="/auth-redirect" element={authSection} />
                <Route path="/community/*" element={communitySection} />
            </Routes>
        </ApolloConnection>
	);
}
