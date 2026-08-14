import { MockedProvider } from '@apollo/client/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MemberHomeContainerMemberMyProfileDocument } from '../generated.tsx';
import { MemberHome } from './member-home.tsx';

const meta = {
	title: 'Pages/Accounts/MemberHome',
	component: MemberHome,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof MemberHome>;

export default meta;
type Story = StoryObj<typeof meta>;

const mocks = [
	{
		request: {
			query: MemberHomeContainerMemberMyProfileDocument,
			variables: { communityId: 'community-1' },
		},
		result: {
			data: {
				memberMyProfile: {
					__typename: 'Member',
					id: 'member-1',
					memberName: 'jane-doe',
					community: {
						__typename: 'Community',
						id: 'community-1',
						name: 'Sample Community',
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
