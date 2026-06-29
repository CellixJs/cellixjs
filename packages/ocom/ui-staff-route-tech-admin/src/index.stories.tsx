import { StaffAuthProvider } from '@ocom/ui-staff-shared';
import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { Root } from './index';

const meta = {
	title: 'Pages/Staff/Tech Admin/Tech Admin',
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
						canManageCommunities: false,
						canManageUsers: false,
						canManageFinance: false,
						canManageTechAdmin: true,
					},
				}}
			>
				<MemoryRouter initialEntries={['/staff/tech']}>
					<Story />
				</MemoryRouter>
			</StaffAuthProvider>
		),
	],
} satisfies Meta<typeof Root>;

export default meta;

type Story = StoryObj<typeof Root>;

export const Default: Story = {};