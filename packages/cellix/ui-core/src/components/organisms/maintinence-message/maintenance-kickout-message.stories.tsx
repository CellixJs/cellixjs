import type { Meta, StoryObj } from '@storybook/react-vite';
import { MaintenanceKickoutMessage } from './maintenance-kickout-message.tsx';

const meta = {
	title: 'Organisms/Maintenance Kickout Message',
	component: MaintenanceKickoutMessage,
} satisfies Meta<typeof MaintenanceKickoutMessage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		timer: '2:00',
	},
};
