import { MockedProvider } from '@apollo/client/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { App as AntdApp } from 'antd';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, userEvent, within } from 'storybook/test';
import { AdminPropertiesCreateContainerPropertyCreateDocument, AdminPropertiesListContainerPropertiesDocument } from '../generated.tsx';
import { PropertiesCreateContainer } from './properties-create.container.tsx';

const communityId = '65f1f77bcf86cd7994390001';
const newPropertyId = '65f1f77bcf86cd7994390110';

const listRefetchMock = {
	request: {
		query: AdminPropertiesListContainerPropertiesDocument,
		variables: { communityId },
	},
	result: {
		data: {
			propertiesByCommunityId: [],
		},
	},
};

const routerDecorator = (mocks: Parameters<typeof MockedProvider>[0]['mocks']) => {
	const Decorator = (Story: React.ComponentType) => (
		<MockedProvider mocks={mocks}>
			<AntdApp>
				<MemoryRouter initialEntries={[`/community/${communityId}/admin/65f1f77bcf86cd7994390002/properties/create`]}>
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
							<Route
								path=":id/*"
								element={<div>Property Detail Route</div>}
							/>
						</Route>
					</Routes>
				</MemoryRouter>
			</AntdApp>
		</MockedProvider>
	);
	return Decorator;
};

const meta = {
	title: 'Components/Layouts/Admin/PropertiesCreateContainer',
	component: PropertiesCreateContainer,
	parameters: {
		layout: 'padded',
	},
	args: {
		data: { communityId },
	},
} satisfies Meta<typeof PropertiesCreateContainer>;

export default meta;
type Story = StoryObj<typeof PropertiesCreateContainer>;

export const Default: Story = {
	decorators: [routerDecorator([])],
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		expect(canvas.getByLabelText('Property Name')).toBeInTheDocument();
		expect(canvas.getByRole('button', { name: /create property/i })).toBeInTheDocument();
	},
};

export const Success: Story = {
	decorators: [
		routerDecorator([
			{
				request: {
					query: AdminPropertiesCreateContainerPropertyCreateDocument,
					variables: { input: { propertyName: 'Clubhouse Cottage' } },
				},
				result: {
					data: {
						propertyCreate: {
							__typename: 'PropertyMutationResult',
							status: { __typename: 'MutationStatus', success: true, errorMessage: null },
							property: {
								__typename: 'Property',
								id: newPropertyId,
								propertyName: 'Clubhouse Cottage',
								createdAt: '2024-01-01T12:00:00.000Z',
								updatedAt: '2024-01-01T12:00:00.000Z',
							},
						},
					},
				},
			},
			listRefetchMock,
		]),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await userEvent.type(canvas.getByLabelText('Property Name'), 'Clubhouse Cottage');
		await userEvent.click(canvas.getByRole('button', { name: /create property/i }));

		// On success the container navigates to the new property's detail page
		expect(await canvas.findByText('Property Detail Route')).toBeInTheDocument();
	},
};

export const MutationFailure: Story = {
	decorators: [
		routerDecorator([
			{
				request: {
					query: AdminPropertiesCreateContainerPropertyCreateDocument,
					variables: { input: { propertyName: 'Duplicate Property' } },
				},
				result: {
					data: {
						propertyCreate: {
							__typename: 'PropertyMutationResult',
							status: { __typename: 'MutationStatus', success: false, errorMessage: 'Property name already in use' },
							property: null,
						},
					},
				},
			},
		]),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await userEvent.type(canvas.getByLabelText('Property Name'), 'Duplicate Property');
		await userEvent.click(canvas.getByRole('button', { name: /create property/i }));

		const body = within(canvasElement.ownerDocument.body);
		expect(await body.findByText('Property name already in use')).toBeInTheDocument();
	},
};

export const NetworkError: Story = {
	decorators: [
		routerDecorator([
			{
				request: {
					query: AdminPropertiesCreateContainerPropertyCreateDocument,
					variables: { input: { propertyName: 'Unlucky Property' } },
				},
				error: new Error('Network unavailable'),
			},
		]),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await userEvent.type(canvas.getByLabelText('Property Name'), 'Unlucky Property');
		await userEvent.click(canvas.getByRole('button', { name: /create property/i }));

		const body = within(canvasElement.ownerDocument.body);
		expect(await body.findByText(/Network unavailable/i)).toBeInTheDocument();
	},
};
