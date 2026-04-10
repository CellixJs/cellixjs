import { Header } from './components/header.js';
import { CmsPage } from './pages/cms-page.js';

export const SectionLayout: React.FC = () => {
	return (
		<div>
			<Header />
			<CmsPage />
		</div>
	);
};
