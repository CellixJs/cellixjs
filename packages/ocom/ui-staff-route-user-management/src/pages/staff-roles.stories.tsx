import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { StaffRoleCreateDocument, StaffRolesListDocument } from '../generated.tsx';
import { StaffRolesPage } from './staff-roles.tsx';

const mockStaffRoles = [
	{ id: 'r1', roleName: 'Case Manager', enterpriseAppRole: 'Staff.CaseManager', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-15T00:00:00.000Z' },
	{ id: 'r2', roleName: 'Finance', enterpriseAppRole: 'Staff.Finance', createdAt: '2024-01-02T00:00:00.000Z', updatedAt: '2024-01-15T00:00:00.000Z' },
];

const listMock = {
	request: { query: StaffRolesListDocument },
	result: { data: { staffRoles: mockStaffRoles } },
};

const createMock = {
	request: { query: StaffRoleCreateDocument, variables: { input: { roleName: 'New Role' } } },
	result: { data: { staffRoleCreate: { status: { success: true, errorMessage: null }, staffRole: { id: 'r3', roleName: 'New Role', enterpriseAppRole: '' } } } },
};

const meta: Meta<typeof StaffRolesPage> = {
	title: 'Pages/Staff/User Management/Staff Roles',
	component: StaffRolesPage,
	parameters: {
		layout: 'padded',
		apolloClient: { mocks: [listMock, createMock] },
	},
};

export default meta;
type Story = StoryObj<typeof StaffRolesPage>;

export const Default: Story = {
	render: () => (
		<MemoryRouter initialEntries={['/']}>
			<Routes>
				<Route
					path="/*"
					element={<StaffRolesPage />}
				/>
			</Routes>
		</MemoryRouter>
	),
};

export const CreateView: Story = {
	parameters: {
		apolloClient: { mocks: [listMock, createMock] },
	},
	render: () => (
		<MemoryRouter initialEntries={['/create']}>
			<Routes>
				<Route
					path="/*"
					element={<StaffRolesPage />}
				/>
			</Routes>
		</MemoryRouter>
	),
};
