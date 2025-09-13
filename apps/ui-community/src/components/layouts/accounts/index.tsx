import { Route, Routes } from 'react-router-dom';
import { CreateCommunity } from './pages/create-community.tsx';
import { Home } from './pages/home.tsx';
import { SectionLayout } from './section-layout.tsx';

export const Accounts: React.FC = () => {
  return (
      <Routes>
        <Route path="" element={<SectionLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="create-community" element={<CreateCommunity />} />
        </Route>
      </Routes>
  );
};
