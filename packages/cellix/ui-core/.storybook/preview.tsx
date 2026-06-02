import type { Decorator, Parameters } from '@storybook/react-vite';
import { message } from 'antd';
import { MemoryRouter } from 'react-router-dom';
import 'antd/dist/reset.css';

message.config({ duration: 0 });

// Global MemoryRouter so any Link/useLocation has context
export const decorators: Decorator[] = [
	(Story, context) => {
		const initialEntries = context.parameters?.memoryRouter?.initialEntries ?? ['/'];
		return (
			<MemoryRouter initialEntries={initialEntries}>
				<Story />
			</MemoryRouter>
		);
	},
];

export const parameters: Parameters = {
    layout: 'padded',
    actions: { argTypesRegex: '^on[A-Z].*' },

    controls: {
		matchers: {
			color: /(background|color)$/i,
			date: /Date$/i,
		},
	},

    a11y: {
        // 'todo' - show a11y violations in the test UI only
        // 'error' - fail CI on a11y violations
        // 'off' - skip a11y checks entirely
        test: 'todo'
    }
};
