import type { Meta, StoryObj } from '@storybook/react';
import { Route, Routes } from 'react-router-dom';
import { UserManagementPage } from './user-management.tsx';

const meta: Meta<typeof UserManagementPage> = {
	title: 'UserManagement/Pages/UserManagementPage',
	component: UserManagementPage,
	parameters: {
		layout: 'padded',
		memoryRouter: {
			initialEntries: ['/staff-users'],
		},
	},
};

export default meta;
type Story = StoryObj<typeof UserManagementPage>;

export const StaffUsersTab: Story = {
	render: () => (
		<Routes>
			<Route
				path="/*"
				element={<UserManagementPage />}
			/>
		</Routes>
	),
};

export const StaffRolesTab: Story = {
	parameters: {
		memoryRouter: {
			initialEntries: ['/staff-roles'],
		},
	},
	render: () => (
		<Routes>
			<Route
				path="/*"
				element={<UserManagementPage />}
			/>
		</Routes>
	),
};
