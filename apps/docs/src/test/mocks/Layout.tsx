import type React from 'react';

interface LayoutProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, title, description }) => (
  <div data-testid="layout" data-title={title} data-description={description}>
    {children}
  </div>
);

export default Layout;
