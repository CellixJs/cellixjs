import { MockedProvider } from '@apollo/client/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SharedMemberProfileContainerMemberSelfProfileDocument } from '@ocom/ui-community-shared/src/generated.tsx';
import { MemberProfilePage } from './member-profile.tsx';

const meta = {
	title: 'Pages/Accounts/MemberProfile',
	component: MemberProfilePage,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof MemberProfilePage>;

export default meta;
type Story = StoryObj<typeof meta>;

const mocks = [
	{
		request: {
			query: SharedMemberProfileContainerMemberSelfProfileDocument,
			variables: { communityId: 'community-1' },
		},
		result: {
			data: {
				memberMyProfile: {
					__typename: 'Member',
					id: 'member-1',
					memberName: 'jane-doe',
					createdAt: '2024-01-15T00:00:00.000Z',
					updatedAt: '2024-02-15T00:00:00.000Z',
					profile: {
						__typename: 'MemberProfile',
						name: 'Jane Doe',
						email: 'jane@example.com',
						bio: 'Community member and product designer.',
						showInterests: true,
						showEmail: true,
						showProfile: true,
						showLocation: true,
						showProperties: false,
					},
				},
			},
		},
	},
];

export const Default: Story = {
	decorators: [
		(Story) => (
			<MockedProvider mocks={mocks} addTypename={false}>
				<MemoryRouter initialEntries={['/community/community-1']}>
					<Routes>
						<Route path="/community/:communityId" element={<Story />} />
					</Routes>
				</MemoryRouter>
			</MockedProvider>
		),
	],
};
