
import { Header } from './components/header';
import { CmsPage } from './pages/cms-page.tsx';

export const SectionLayout: React.FC = () => {
  return (
    <div>
      <Header />
      <CmsPage />
    </div>
  );
};
