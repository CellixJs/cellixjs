import { test, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import type { MenuComponentProps } from './menu-component.tsx';

vi.mock('react-router-dom', () => ({
  useParams: () => ({}),
  useLocation: () => ({ pathname: '/' }),
  generatePath: (path: string) => path,
  Link: ({ children }: { children?: React.ReactNode }) => React.createElement('a', null, children),
  matchRoutes: () => null,
}));

import { MenuComponent } from './menu-component.tsx';

test('MenuComponent builds menu and renders root', () => {
  const pageLayouts: MenuComponentProps['pageLayouts'] = [
    { path: '/', title: 'Home', icon: React.createElement('span'), id: 'ROOT' },
    { path: '/a', title: 'A', icon: React.createElement('span'), id: '1', parent: 'ROOT' },
  ];

  const html = renderToString(
    React.createElement(MenuComponent, {
      pageLayouts,
      theme: undefined,
      mode: 'vertical',
    }),
  );
  expect(html).toContain('Home');
});
