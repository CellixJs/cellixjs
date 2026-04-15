import { gql } from '@apollo/client';
import type { Meta, StoryObj } from '@storybook/react';
import { CommunitiesDropdownContainer } from './communities-dropdown.container.tsx';

const UI_COMPONENTS_COMMUNITIES_DROPDOWN_MEMBERS = gql(`
	query UiComponentsCommunitiesDropdownMembersForCurrentEndUser {
		membersForCurrentEndUser {
			id
			memberName
			isAdmin
			community {
				id
				name
			}
		}
	}
`);

const meta: Meta = {
	title: 'UI/Organisms/DropdownMenu/CommunitiesDropdown/Container',
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
		memoryRouter: {
			initialEntries: ['/community/community-1/member/member-1'],
		},
		apolloClient: {
			mocks: [
				{
					request: {
						query: UI_COMPONENTS_COMMUNITIES_DROPDOWN_MEMBERS,
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
	render: (args) => <CommunitiesDropdownContainer data={args.data} />,
};
