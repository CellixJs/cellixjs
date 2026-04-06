import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { MemberAddModal } from './member-add-modal.tsx';

const meta: Meta<typeof MemberAddModal> = {
	title: 'Admin/MemberAddModal',
	component: MemberAddModal,
	args: {
		open: true,
		loading: false,
		onAdd: fn(),
		onCancel: fn(),
	},
};

export default meta;
type Story = StoryObj<typeof MemberAddModal>;

export const Default: Story = {};

export const Loading: Story = {
	args: {
		loading: true,
	},
};

export const Closed: Story = {
	args: {
		open: false,
	},
};
