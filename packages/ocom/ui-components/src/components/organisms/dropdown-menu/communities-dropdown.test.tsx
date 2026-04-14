import { test, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import type { CommunitiesDropdownProps } from './communities-dropdown.tsx';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ memberId: 'm1' }),
  useNavigate: () => () => undefined,
}));

import { CommunitiesDropdown } from './communities-dropdown.tsx';

test('CommunitiesDropdown renders current member info', () => {
  const props: CommunitiesDropdownProps = {
    data: {
      members: [
        { id: 'm1', memberName: 'Alice', isAdmin: true, community: { id: 'c1', name: 'Com1' } },
        { id: 'm2', memberName: 'Bob', isAdmin: false, community: { id: 'c1', name: 'Com1' } },
      ],
    },
  };

  const html = renderToString(React.createElement(CommunitiesDropdown, props));
  expect(html).toContain('Com1 | Alice');
});
