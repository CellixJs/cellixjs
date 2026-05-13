import type { Meta, StoryObj } from '@storybook/react';
import { Route, Routes } from 'react-router-dom';
import { StaffRolesPage } from './staff-roles.tsx';

const meta: Meta<typeof StaffRolesPage> = {
	title: 'UserManagement/Pages/StaffRolesPage',
	component: StaffRolesPage,
	parameters: {
		layout: 'padded',
		memoryRouter: {
			initialEntries: ['/'],
		},
	},
};

export default meta;
type Story = StoryObj<typeof StaffRolesPage>;

export const Default: Story = {
	render: () => (
		<Routes>
			<Route
				path="/*"
				element={<StaffRolesPage />}
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
				element={<StaffRolesPage />}
			/>
		</Routes>
	),
};
