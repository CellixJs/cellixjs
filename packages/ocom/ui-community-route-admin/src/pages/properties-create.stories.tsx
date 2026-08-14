import { MockedProvider } from '@apollo/client/testing';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { App as AntdApp } from 'antd';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, within } from 'storybook/test';
import { AdminMemberListContainerMembersDocument } from '../generated.tsx';
import { PropertiesCreate } from './properties-create.tsx';

const communityId = '65f1f77bcf86cd7994390001';
const memberId = '65f1f77bcf86cd7994390002';

const membersMock = {
	request: {
		query: AdminMemberListContainerMembersDocument,
		variables: { communityId },
	},
	result: {
		data: {
			membersByCommunityId: [
				{
					__typename: 'Member',
					id: memberId,
					memberName: 'Alice Property Manager',
					isAdmin: true,
					accounts: [
						{
							__typename: 'MemberAccount',
							id: '65f1f77bcf86cd7994390003',
							firstName: 'Alice',
							lastName: 'Manager',
							statusCode: 'ACCEPTED',
							user: {
								__typename: 'EndUser',
								id: '65f1f77bcf86cd7994390004',
								externalId: 'f9c2d0e1-0000-4000-8000-000000000001',
							},
							createdAt: '2024-01-01T00:00:00.000Z',
							updatedAt: '2024-01-01T00:00:00.000Z',
						},
					],
					profile: {
						__typename: 'MemberProfile',
						name: 'Alice Property Manager',
						email: 'alice@example.com',
						bio: null,
						showEmail: false,
						showProfile: true,
					},
					createdAt: '2024-01-01T00:00:00.000Z',
					updatedAt: '2024-01-01T00:00:00.000Z',
				},
			],
			memberForCurrentCommunity: {
				__typename: 'Member',
				id: memberId,
			},
		},
	},
};

const routerDecorator = () => {
	const Decorator = (Story: React.ComponentType) => (
		<HelmetProvider>
			<MockedProvider mocks={[membersMock]}>
				<AntdApp>
					<MemoryRouter initialEntries={[`/community/${communityId}/admin/${memberId}/properties/create`]}>
						<Routes>
							<Route path="/community/:communityId/admin/:memberId/properties">
								<Route
									path=""
									element={<div>Properties List Route</div>}
								/>
								<Route
									path="create"
									element={<Story />}
								/>
							</Route>
						</Routes>
					</MemoryRouter>
				</AntdApp>
			</MockedProvider>
		</HelmetProvider>
	);
	return Decorator;
};

const meta = {
	title: 'Pages/Admin/PropertiesCreate',
	component: PropertiesCreate,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof PropertiesCreate>;

export default meta;
type Story = StoryObj<typeof PropertiesCreate>;

export const Default: Story = {
	decorators: [routerDecorator()],
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// Page header with back navigation and the create form
		expect(canvas.getByText('Add Property')).toBeInTheDocument();
		expect(canvas.getByLabelText('Property Name')).toBeInTheDocument();
		expect(canvas.getByRole('button', { name: /create property/i })).toBeInTheDocument();
	},
};
