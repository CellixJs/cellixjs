import type { Meta, StoryObj } from '@storybook/react';
import { Route, Routes } from 'react-router-dom';
import { StaffUsersPage } from './staff-users.tsx';

const meta: Meta<typeof StaffUsersPage> = {
	title: 'UserManagement/Pages/StaffUsersPage',
	component: StaffUsersPage,
	parameters: {
		layout: 'padded',
		memoryRouter: {
			initialEntries: ['/'],
		},
	},
};

export default meta;
type Story = StoryObj<typeof StaffUsersPage>;

export const Default: Story = {
	render: () => (
		<Routes>
			<Route
				path="/*"
				element={<StaffUsersPage />}
			/>
		</Routes>
	),
};

export const CreateView: Story = {
	parameters: {
		memoryRouter: {
			initialEntries: ['/create'],
		},
	},
	render: () => (
		<Routes>
			<Route
				path="/*"
				element={<StaffUsersPage />}
			/>
		</Routes>
	),
};
