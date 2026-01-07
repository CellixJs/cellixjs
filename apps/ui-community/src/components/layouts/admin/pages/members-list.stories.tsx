import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { MembersList } from './members-list.tsx';

const meta: Meta<typeof MembersList> = {
	title: 'Pages/Layouts/Admin/MembersList',
	component: MembersList,
	decorators: [
		(Story) => (
			<BrowserRouter>
				<Story />
			</BrowserRouter>
		),
	],
};

export default meta;
type Story = StoryObj<typeof MembersList>;

export const Default: Story = {};
