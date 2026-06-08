import { gql } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import type { Meta, StoryObj } from '@storybook/react';
import type { ReactElement } from 'react';
import { expect, within } from 'storybook/test';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RequireRole, type RequireRoleProps } from './require-role.tsx';

const REQUIRE_ROLE_STAFF_USER_CURRENT_QUERY = gql`
	query RequireRoleStaffUserCurrent {
		staffUserCurrent: currentStaffUserAndCreateIfNotExists {
			role {
				permissions {
					communityPermissions {
						canManageCommunities
					}
					userPermissions {
						canManageUsers
					}
					financePermissions {
						canManageFinance
					}
					techAdminPermissions {
						canManageTechAdmin
					}
				}
			}
		}
	}
`;

const protectedPermissions = {
	communityPermissions: { canManageCommunities: false },
	userPermissions: { canManageUsers: false },
	financePermissions: { canManageFinance: false },
	techAdminPermissions: { canManageTechAdmin: true },
};

const deniedPermissions = {
	communityPermissions: { canManageCommunities: false },
	userPermissions: { canManageUsers: false },
	financePermissions: { canManageFinance: false },
	techAdminPermissions: { canManageTechAdmin: false },
};

const meta = {
	title: 'Staff/RequireRole',
	component: RequireRole,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof RequireRole>;

export default meta;
type Story = StoryObj<typeof RequireRole>;

const ProtectedContent = () => <div>protected content</div>;

const routeWrapper = (story: ReactElement) => (
	<Routes>
		<Route
			path="/staff/tech"
			element={story}
		/>
		<Route
			path="/unauthorized"
			element={<div>unauthorized</div>}
		/>
	</Routes>
);

export const Authorized: Story = {
	args: {
		roles: [],
		permKey: 'canManageTechAdmin',
		children: <ProtectedContent />,
	} satisfies RequireRoleProps,
	parameters: {
		memoryRouter: {
			initialEntries: ['/staff/tech'],
		},
	},
	decorators: [
		(Story) => (
			<MockedProvider
				addTypename={false}
				mocks={[
					{
						request: {
							query: REQUIRE_ROLE_STAFF_USER_CURRENT_QUERY,
						},
						result: {
							data: {
								staffUserCurrent: {
									role: {
										permissions: protectedPermissions,
									},
								},
							},
						},
					},
				]}
			>
				<MemoryRouter initialEntries={['/staff/tech']}>{routeWrapper(<Story />)}</MemoryRouter>
			</MockedProvider>
		),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await expect(canvas.findByText('protected content')).resolves.toBeInTheDocument();
		expect(canvas.queryByText('unauthorized')).not.toBeInTheDocument();
	},
};

export const Unauthorized: Story = {
	args: {
		roles: [],
		permKey: 'canManageTechAdmin',
		children: <ProtectedContent />,
	} satisfies RequireRoleProps,
	parameters: {
		memoryRouter: {
			initialEntries: ['/staff/tech'],
		},
	},
	decorators: [
		(Story) => (
			<MockedProvider
				addTypename={false}
				mocks={[
					{
						request: {
							query: REQUIRE_ROLE_STAFF_USER_CURRENT_QUERY,
						},
						result: {
							data: {
								staffUserCurrent: {
									role: {
										permissions: deniedPermissions,
									},
								},
							},
						},
					},
				]}
			>
				<MemoryRouter initialEntries={['/staff/tech']}>{routeWrapper(<Story />)}</MemoryRouter>
			</MockedProvider>
		),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await expect(canvas.findByText('unauthorized')).resolves.toBeInTheDocument();
		expect(canvas.queryByText('protected content')).not.toBeInTheDocument();
	},
};
