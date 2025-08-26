// Global preview for Storybook in @ocom/ui-components
// Import Ant Design base styles so components render correctly
import type { Decorator } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import 'antd/dist/reset.css';

// Global MemoryRouter so any Link/useLocation has context
export const decorators: Decorator[] = [
	(Story) => (
		<MemoryRouter initialEntries={["/"]}>
			<Story />
		</MemoryRouter>
	),
];

// Global parameters
export const parameters = {
	layout: 'padded',
	actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
};