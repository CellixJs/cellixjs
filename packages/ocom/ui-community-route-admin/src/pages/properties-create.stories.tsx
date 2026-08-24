import { MockedProvider } from '@apollo/client/testing';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { App as AntdApp } from 'antd';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, within } from 'storybook/test';
import { AdminPropertiesOwnerOptionsDocument } from '../generated.tsx';
import { PropertiesCreate } from './properties-create.tsx';

const communityId = '65f1f77bcf86cd7994390001';
const memberId = '65f1f77bcf86cd7994390002';

const membersMock = {
	request: {
		query: AdminPropertiesOwnerOptionsDocument,
		variables: { communityId },
	},
	result: {
		data: {
			membersByCommunityId: [
				{
					__typename: 'Member',
					id: memberId,
					memberName: 'Alice Property Manager',
				},
			],
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
