import type { Meta, StoryObj } from '@storybook/react';
import { Route, Routes } from 'react-router-dom';
import { LoggedInUserCommunityContainer, type LoggedInUserCommunityContainerProps } from './logged-in-user-community.container.tsx';

const meta = {
	title: 'UI/Organisms/Header/LoggedInUserCommunity/Container',
	component: LoggedInUserCommunityContainer,
	parameters: {
		layout: 'padded',
	},
} satisfies Meta<typeof LoggedInUserCommunityContainer>;

export default meta;
type Story = StoryObj<typeof LoggedInUserCommunityContainer>;

export const Default: Story = {
	args: {
		autoLogin: false,
	} satisfies LoggedInUserCommunityContainerProps,
	parameters: {
		memoryRouter: {
			initialEntries: ['/community/123'],
		},
	},
	render: (args) => (
		<Routes>
			<Route
				path="/community/:communityId"
				element={<LoggedInUserCommunityContainer autoLogin={args.autoLogin} />}
			/>
		</Routes>
	),
};
