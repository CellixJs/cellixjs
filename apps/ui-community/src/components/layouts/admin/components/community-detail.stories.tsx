import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import type { AdminCommunityDetailContainerCommunityFieldsFragment } from '../../../../generated.tsx';
import { CommunityDetail } from './community-detail.tsx';

const mockData: AdminCommunityDetailContainerCommunityFieldsFragment = {
	__typename: 'Community',
	id: '507f1f77bcf86cd799439011',
	name: 'Test Community',
	domain: 'test.com',
	whiteLabelDomain: 'wl.test.com',
	handle: 'testcommunity',
	createdAt: '2024-01-01T12:00:00.000Z',
	updatedAt: '2024-01-15T12:00:00.000Z',
};

const meta = {
	title: 'Components/Layouts/Admin/CommunityDetail',
	component: CommunityDetail,
	parameters: {
		layout: 'padded',
	},
} satisfies Meta<typeof CommunityDetail>;

export default meta;
type Story = StoryObj<typeof CommunityDetail>;

export const Default: Story = {
	args: {
		data: mockData,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify community details are displayed
		expect(canvas.getByTestId('community-id')).toHaveTextContent(mockData.id);
		expect(canvas.getByTestId('community-name')).toHaveTextContent(
			mockData.name,
		);
		expect(canvas.getByText('White Label Name')).toBeInTheDocument();
		expect(canvas.getByText('Domain Name')).toBeInTheDocument();
		expect(canvas.getByText('Handle Name')).toBeInTheDocument();
	},
};

export const WithMinimalData: Story = {
	args: {
		data: {
			__typename: 'Community',
			id: '507f1f77bcf86cd799439011',
			name: 'Minimal Community',
			domain: null,
			whiteLabelDomain: null,
			handle: null,
			createdAt: '2024-01-01T12:00:00.000Z',
			updatedAt: '2024-01-01T12:00:00.000Z',
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify only required fields are displayed
		expect(canvas.getByTestId('community-id')).toHaveTextContent(
			'507f1f77bcf86cd799439011',
		);
		expect(canvas.getByTestId('community-name')).toHaveTextContent(
			'Minimal Community',
		);

		// Verify optional fields are not displayed
		expect(canvas.queryByText('White Label Name')).not.toBeInTheDocument();
		expect(canvas.queryByText('Domain Name')).not.toBeInTheDocument();
		expect(canvas.queryByText('Handle Name')).not.toBeInTheDocument();
	},
};

export const WithAllFields: Story = {
	args: {
		data: {
			__typename: 'Community',
			id: '507f1f77bcf86cd799439011',
			name: 'Complete Community',
			domain: 'completecommunity.com',
			whiteLabelDomain: 'custom.completecommunity.com',
			handle: 'complete-community',
			createdAt: '2024-01-01T12:00:00.000Z',
			updatedAt: '2024-01-15T12:00:00.000Z',
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify all fields are displayed
		expect(canvas.getByTestId('community-id')).toBeInTheDocument();
		expect(canvas.getByTestId('community-name')).toBeInTheDocument();
		expect(canvas.getByText('White Label Name')).toBeInTheDocument();
		expect(canvas.getByText('Domain Name')).toBeInTheDocument();
		expect(canvas.getByText('Handle Name')).toBeInTheDocument();
	},
};
