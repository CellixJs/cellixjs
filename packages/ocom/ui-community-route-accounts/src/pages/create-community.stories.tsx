import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { expect, within } from 'storybook/test';
import { AccountsCommunityCreateContainerCommunityCreateDocument } from '../generated.tsx';
import { LoggedInUserRootContainerCurrentEndUserAndCreateIfNotExistsDocument } from '../../../ui-shared/src/generated.tsx';
import { Accounts } from '../index.tsx';

const meta = {
	title: 'Pages/Community/Accounts/Create Community',
	component: Accounts,
	parameters: {
		layout: 'fullscreen',
		apolloClient: {
			mocks: [
				{
					request: {
						query: LoggedInUserRootContainerCurrentEndUserAndCreateIfNotExistsDocument,
						variables: {},
					},
					result: {
						data: {
							currentEndUserAndCreateIfNotExists: {
								__typename: 'EndUser',
								id: 'enduser-1',
								externalId: 'user-123',
								personalInformation: {
									__typename: 'EndUserPersonalInformation',
									identityDetails: {
										__typename: 'EndUserIdentityDetails',
										lastName: 'Doe',
										restOfName: 'John',
									},
								},
							},
						},
					},
				},
				{
					request: {
						query: AccountsCommunityCreateContainerCommunityCreateDocument,
						variables: {
							input: {
								name: 'fefe',
							},
						},
					},
					result: {
						data: {
							communityCreate: {
								__typename: 'CommunityMutationResult',
								status: {
									__typename: 'MutationStatus',
									success: true,
									errorMessage: null,
								},
								community: {
									__typename: 'Community',
									id: 'community-fefe',
									name: 'fefe',
									domain: null,
									whiteLabelDomain: null,
									handle: null,
									schemaVersion: '1.0.0',
									createdAt: '2024-01-01T00:00:00.000Z',
									updatedAt: '2024-01-02T00:00:00.000Z',
								},
							},
						},
					},
				},
			],
		},
	},
} satisfies Meta<typeof Accounts>;

export default meta;
type Story = StoryObj<typeof Accounts>;

export const Default: Story = {
	args: {},
	decorators: [
		(Story) => (
			<MemoryRouter initialEntries={['/create-community']}>
				<Story />
			</MemoryRouter>
		),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify the page header title is present
		const pageTitle = await canvas.findByText('Create a Community');
		expect(pageTitle).toBeInTheDocument();
	},
};
