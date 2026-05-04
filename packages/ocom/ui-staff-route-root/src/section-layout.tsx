import { Header } from './components/header.tsx';
import { LoginPage } from './pages/login-page.tsx';

export const SectionLayout: React.FC = () => {
	return (
		<div>
			<Header />
			<LoginPage />
		</div>
	);
};


