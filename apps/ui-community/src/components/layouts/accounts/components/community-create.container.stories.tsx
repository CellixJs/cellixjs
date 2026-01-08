import { App as AntdApp } from 'antd';
import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, userEvent, within } from 'storybook/test';
import {
	AccountsCommunityCreateContainerCommunityCreateDocument,
	AccountsCommunityListContainerCommunitiesForCurrentEndUserDocument,
} from '../../../../generated.tsx';
import { CommunityCreateContainer } from './community-create.container.tsx';

const meta = {
	title: 'Components/Accounts/CommunityCreateContainer',
	component: CommunityCreateContainer,
	decorators: [
		(Story) => (
			<AntdApp>
				<MemoryRouter initialEntries={['/accounts/create']}>
					<Routes>
						<Route path="/accounts" element={<div>Accounts List Page</div>} />
						<Route path="/accounts/create" element={<Story />} />
						<Route path="/" element={<div>Root Page</div>} />
					</Routes>
				</MemoryRouter>
			</AntdApp>
		),
	],
} satisfies Meta<typeof CommunityCreateContainer>;

export default meta;
type Story = StoryObj<typeof CommunityCreateContainer>;

export const Default: Story = {
	parameters: {
		apolloClient: {
			mocks: [
				{
					request: {
						query: AccountsCommunityListContainerCommunitiesForCurrentEndUserDocument,
					},
					result: {
						data: {
							communitiesForCurrentEndUser: [],
						},
					},
				},
			],
		},
	},
};

export const Success: Story = {
	parameters: {
		apolloClient: {
			mocks: [
				{
					request: {
						query: AccountsCommunityListContainerCommunitiesForCurrentEndUserDocument,
					},
					result: {
						data: {
							communitiesForCurrentEndUser: [
								{ id: '1', name: 'Existing Community', __typename: 'Community' },
							],
						},
					},
				},
				{
					request: {
						query: AccountsCommunityCreateContainerCommunityCreateDocument,
						variables: {
							input: { name: 'New Community' },
						},
					},
					result: {
						data: {
							communityCreate: {
								community: {
									id: '2',
									name: 'New Community',
									__typename: 'Community',
								},
								__typename: 'CommunityCreatePayload',
							},
						},
					},
				},
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Fill out the form
		const nameInput = await canvas.findByPlaceholderText('Name');
		await userEvent.type(nameInput, 'New Community');

		// Submit the form
		const submitButton = await canvas.findByRole('button', {
			name: /create community/i,
		});
		await userEvent.click(submitButton);

// Verify navigation happened (Root Page should be visible because navigate('../') from /accounts/create goes to /)
  const rootPage = await canvas.findByText('Root Page');
  expect(rootPage).toBeInTheDocument();
	},
};

export const ErrorState: Story = {
	parameters: {
		apolloClient: {
			mocks: [
				{
					request: {
						query: AccountsCommunityListContainerCommunitiesForCurrentEndUserDocument,
					},
					result: {
						data: {
							communitiesForCurrentEndUser: [],
						},
					},
				},
				{
					request: {
						query: AccountsCommunityCreateContainerCommunityCreateDocument,
						variables: {
							input: { name: 'Error Community' },
						},
					},
					error: new Error('Failed to create community'),
				},
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Fill out the form
		const nameInput = await canvas.findByPlaceholderText('Name');
		await userEvent.type(nameInput, 'Error Community');

		// Submit the form
		const submitButton = await canvas.findByRole('button', {
			name: /create community/i,
		});
		await userEvent.click(submitButton);

		// Verify error message appears (Antd message)
		// Note: Antd messages are rendered outside the canvasElement usually, 
		// but in Storybook they might be in the body.
		const body = within(canvasElement.ownerDocument.body);
		const errorMessage = await body.findByText(/Error creating community/);
		expect(errorMessage).toBeInTheDocument();
	},
};

export const LoadingState: Story = {
	parameters: {
		apolloClient: {
			mocks: [
				{
					request: {
						query: AccountsCommunityListContainerCommunitiesForCurrentEndUserDocument,
					},
					delay: 1000000, // Infinite delay to stay in loading state
					result: {
						data: {
							communitiesForCurrentEndUser: [],
						},
					},
				},
			],
		},
	},
};

export const MutationError: Story = {
	parameters: {
		apolloClient: {
			mocks: [
				{
					request: {
						query: AccountsCommunityListContainerCommunitiesForCurrentEndUserDocument,
					},
					result: {
						data: {
							communitiesForCurrentEndUser: [],
						},
					},
				},
				{
					request: {
						query: AccountsCommunityCreateContainerCommunityCreateDocument,
					},
					error: new Error('Initial load error'),
				},
			],
		},
	},
};
