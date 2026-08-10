import { MockedProvider } from '@apollo/client/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { App as AntdApp } from 'antd';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, userEvent, within } from 'storybook/test';
import { AdminPropertiesDetailContainerPropertyDeleteDocument, AdminPropertiesDetailContainerPropertyDocument, AdminPropertiesListContainerPropertiesDocument } from '../generated.tsx';
import { PropertiesDetailContainer } from './properties-detail.container.tsx';

const communityId = '65f1f77bcf86cd7994390001';
const propertyId = '65f1f77bcf86cd7994390201';

const mockProperty = {
	__typename: 'Property',
	id: propertyId,
	propertyName: 'Harborview Unit 205',
	propertyType: 'condo',
	listingDetail: {
		__typename: 'PropertyListingDetail',
		bedrooms: 3,
		bathrooms: 2.5,
		squareFeet: 1750,
	},
	createdAt: '2024-01-01T12:00:00.000Z',
	updatedAt: '2024-01-15T12:00:00.000Z',
};

const propertyQueryMock = {
	request: {
		query: AdminPropertiesDetailContainerPropertyDocument,
		variables: { id: propertyId },
	},
	result: {
		data: {
			property: mockProperty,
		},
	},
};

const routerDecorator = (mocks: Parameters<typeof MockedProvider>[0]['mocks']) => {
	const Decorator = (Story: React.ComponentType) => (
		<MockedProvider mocks={mocks}>
			<AntdApp>
				<MemoryRouter initialEntries={[`/community/${communityId}/admin/65f1f77bcf86cd7994390002/properties/${propertyId}`]}>
					<Routes>
						<Route path="/community/:communityId/admin/:memberId/properties">
							<Route
								path=""
								element={<div>Properties List Route</div>}
							/>
							<Route
								path=":id/*"
								element={<Story />}
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
	title: 'Components/Layouts/Admin/PropertiesDetailContainer',
	component: PropertiesDetailContainer,
	parameters: {
		layout: 'padded',
	},
	args: {
		data: { id: propertyId },
	},
} satisfies Meta<typeof PropertiesDetailContainer>;

export default meta;
type Story = StoryObj<typeof PropertiesDetailContainer>;

export const Success: Story = {
	decorators: [routerDecorator([propertyQueryMock])],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		expect(await canvas.findByLabelText('Property Name')).toHaveValue('Harborview Unit 205');
		expect(canvas.getByLabelText('Property Type')).toHaveValue('condo');
		expect(canvas.getByRole('button', { name: /save/i })).toBeInTheDocument();
		expect(canvas.getByRole('button', { name: /remove property/i })).toBeInTheDocument();
	},
};

export const Loading: Story = {
	decorators: [
		routerDecorator([
			{
				...propertyQueryMock,
				delay: 1_000_000,
			},
		]),
	],
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		expect(canvas.queryByLabelText('Property Name')).not.toBeInTheDocument();
	},
};

export const NotFound: Story = {
	decorators: [
		routerDecorator([
			{
				request: {
					query: AdminPropertiesDetailContainerPropertyDocument,
					variables: { id: propertyId },
				},
				result: {
					data: {
						property: null,
					},
				},
			},
		]),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		expect(await canvas.findByText('Property Not Found')).toBeInTheDocument();
	},
};

export const ErrorState: Story = {
	decorators: [
		routerDecorator([
			{
				request: {
					query: AdminPropertiesDetailContainerPropertyDocument,
					variables: { id: propertyId },
				},
				error: new Error('Failed to load property'),
			},
		]),
	],
	play: async ({ canvasElement }) => {
		const body = within(canvasElement.ownerDocument.body);

		expect(await body.findByText(/Failed to load property/i)).toBeInTheDocument();
	},
};

export const RemoveFlow: Story = {
	decorators: [
		routerDecorator([
			propertyQueryMock,
			{
				request: {
					query: AdminPropertiesDetailContainerPropertyDeleteDocument,
					variables: { input: { id: propertyId } },
				},
				result: {
					data: {
						propertyDelete: {
							__typename: 'PropertyMutationResult',
							status: { __typename: 'MutationStatus', success: true, errorMessage: null },
						},
					},
				},
			},
			{
				request: {
					query: AdminPropertiesListContainerPropertiesDocument,
					variables: { communityId },
				},
				result: {
					data: {
						propertiesByCommunityId: [],
					},
				},
			},
		]),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(canvasElement.ownerDocument.body);

		await userEvent.click(await canvas.findByRole('button', { name: /remove property/i }));

		// Confirm the removal through the confirmation modal
		await body.findByText('Remove this property?');
		const confirmButton = body.getAllByRole('button', { name: /remove property/i }).find((button) => button.closest('.ant-modal-footer'));
		expect(confirmButton).toBeDefined();
		await userEvent.click(confirmButton as HTMLElement);

		// After the delete succeeds, the container navigates back to the list
		expect(await canvas.findByText('Properties List Route')).toBeInTheDocument();
	},
};
