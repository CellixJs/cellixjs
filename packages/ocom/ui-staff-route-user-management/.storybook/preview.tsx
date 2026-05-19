import { MockedProvider } from '@apollo/client/testing';
import type { Decorator, Preview } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import 'antd/dist/reset.css';

export const decorators: Decorator[] = [
	(Story, context) => {
		const initialEntries = context.parameters?.memoryRouter?.initialEntries ?? ['/'];
		const apolloMocks = context.parameters?.apolloMocks ?? [];

		return (
			<MockedProvider
				mocks={apolloMocks}
				addTypename={false}
			>
				<MemoryRouter initialEntries={initialEntries}>
					<Story />
				</MemoryRouter>
			</MockedProvider>
		);
	},
];

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/,
			},
		},
	},
};

export default preview;
