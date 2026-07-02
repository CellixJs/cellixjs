import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CommunitiesDropdownContainerMembersForCurrentEndUserDocument } from '../../../generated.tsx';
import { CommunitiesDropdownContainer } from './communities-dropdown.container.tsx';

const meta: Meta = {
	title: 'Components/Shared/Dropdown Menu/Communities Dropdown/Container',
	parameters: {
		layout: 'padded',
	},
};

export default meta;
type Story = StoryObj<{ data: { id?: string } }>;

export const Default: Story = {
	args: {
		data: {
			id: 'member-1',
		},
	},
	parameters: {
		apolloClient: {
			mocks: [
				{
					request: {
						query: CommunitiesDropdownContainerMembersForCurrentEndUserDocument,
					},
					result: {
						data: {
							__typename: 'Query',
							membersForCurrentEndUser: [
								{
									__typename: 'Member',
									id: 'member-1',
									memberName: 'Alice',
									isAdmin: true,
									community: {
										__typename: 'Community',
										id: 'community-1',
										name: 'Community One',
									},
								},
							],
						},
					},
				},
			],
		},
	},
	render: (args) => (
		<MemoryRouter initialEntries={['/community/community-1/member/member-1']}>
			<Routes>
				<Route
					path="/community/:communityId/member/:memberId"
					element={<CommunitiesDropdownContainer data={args.data} />}
				/>
			</Routes>
		</MemoryRouter>
	),
};
