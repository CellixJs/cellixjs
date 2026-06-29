import { StaffAuthProvider } from '@ocom/ui-staff-shared';
import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { Root } from './index.tsx';

const meta = {
	title: 'Pages/Staff/Community/Placeholder',
	component: Root,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(Story) => (
			<StaffAuthProvider
				value={{
					name: 'Staff User',
					permissions: {
						canManageCommunities: true,
						canManageUsers: true,
						canManageFinance: true,
						canManageTechAdmin: true,
					},
				}}
			>
				<MemoryRouter initialEntries={['/staff/community-management']}>
					<Story />
				</MemoryRouter>
			</StaffAuthProvider>
		),
	],
} satisfies Meta<typeof Root>;

export default meta;

type Story = StoryObj<typeof Root>;

export const Default: Story = {};
