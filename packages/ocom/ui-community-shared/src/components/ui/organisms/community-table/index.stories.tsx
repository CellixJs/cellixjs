import type { Meta, StoryObj } from '@storybook/react-vite';
import { CommunityTable } from './index.tsx';

const meta: Meta<typeof CommunityTable> = {
	title: 'OwnerCommunity/Organisms/CommunityTable',
	component: CommunityTable,
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CommunityTable>;

const communities = [
	{ id: '1', name: 'Riverside Community' },
	{ id: '2', name: 'Tech Team Community' },
	{ id: '3', name: 'The Cool Community' },
];

const members = [
	[
		{ id: 'm1', memberName: 'Olivia K.', isAdmin: true },
		{ id: 'm2', memberName: 'John D.', isAdmin: false },
	],
	[{ id: 'm3', memberName: 'Jane S.', isAdmin: true }],
	[
		{ id: 'm4', memberName: 'Bob B.', isAdmin: true },
		{ id: 'm5', memberName: 'Alice A.', isAdmin: false },
	],
];

export const Default: Story = {
	args: {
		communities,
		members,
		onMemberPortalClick: () => undefined,
		onAdminPortalClick: () => undefined,
		onCreateCommunity: () => undefined,
	},
};
