import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { StaffUsersListDocument } from '../generated.tsx';
import { StaffUsersPage } from './staff-users.tsx';

const mockStaffUsers = [
	{ id: '1', displayName: 'Alice Admin', email: 'alice@example.com', createdAt: '2024-01-01T00:00:00.000Z', role: { id: 'r1', roleName: 'Case Manager' } },
	{ id: '2', displayName: 'Bob Staff', email: 'bob@example.com', createdAt: '2024-02-01T00:00:00.000Z', role: null },
];

const meta: Meta<typeof StaffUsersPage> = {
	title: 'Pages/Staff/User Management/Staff Users',
	component: StaffUsersPage,
	parameters: {
		layout: 'padded',
		apolloClient: {
			mocks: [
				{
					request: { query: StaffUsersListDocument },
					result: { data: { staffUsers: mockStaffUsers } },
				},
			],
		},
	},
};

export default meta;
type Story = StoryObj<typeof StaffUsersPage>;

export const Default: Story = {
	render: () => (
		<MemoryRouter initialEntries={['/']}>
			<Routes>
				<Route
					path="/*"
					element={<StaffUsersPage />}
				/>
			</Routes>
		</MemoryRouter>
	),
};
