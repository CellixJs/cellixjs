import type { Meta, StoryObj } from '@storybook/react';
import { MemberInviteModal } from './member-invite-modal.tsx';

const meta: Meta<typeof MemberInviteModal> = {
	title: 'Admin/Components/MemberInviteModal',
	component: MemberInviteModal,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	argTypes: {
		open: {
			control: 'boolean',
			description: 'Whether the modal is visible',
		},
		loading: {
			control: 'boolean',
			description: 'Loading state for form submission',
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		open: true,
		onClose: () => console.log('onClose'),
		onSingleInvite: (email, message, expiresInDays) => {
			console.log('onSingleInvite', { email, message, expiresInDays });
			return Promise.resolve();
		},
		onBulkInvite: (invitations, expiresInDays) => {
			console.log('onBulkInvite', { invitations, expiresInDays });
			return Promise.resolve();
		},
		loading: false,
	},
};

export const Loading: Story = {
	args: {
		...Default.args,
		loading: true,
	},
};

export const Closed: Story = {
	args: {
		...Default.args,
		open: false,
	},
};
