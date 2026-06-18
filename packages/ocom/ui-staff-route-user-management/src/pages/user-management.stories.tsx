import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UserManagementPage } from './user-management.tsx';

const meta: Meta<typeof UserManagementPage> = {
	title: 'Pages/Staff/User Management/User Management',
	component: UserManagementPage,
	parameters: {
		layout: 'padded',
	},
};

export default meta;
type Story = StoryObj<typeof UserManagementPage>;

export const StaffUsersTab: Story = {
	render: () => (
		<MemoryRouter initialEntries={['/staff-users']}>
			<Routes>
				<Route
					path="/*"
					element={<UserManagementPage />}
				/>
			</Routes>
		</MemoryRouter>
	),
};

export const StaffRolesTab: Story = {
	render: () => (
		<MemoryRouter initialEntries={['/staff-roles']}>
			<Routes>
				<Route
					path="/*"
					element={<UserManagementPage />}
				/>
			</Routes>
		</MemoryRouter>
	),
};
