import { FeatureFlagProvider, MaintenanceMessage } from '@cellix/ui-core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

const meta = {
	title: 'Organisms/Maintenance Message',
	component: MaintenanceMessage,
	args: {
		portalKey: 'EXAMPLE',
		displayConfig: {
			locale: 'en',
			timeZone: 'America/New_York',
			dateTimeFormat: 'h:mm a on dddd, MMMM DD, YYYY',
			dateFormat: 'MMMM DD',
			impendingTop: '60px',
			approachingTop: '100px',
		},
	},
	decorators: [
		(Story) => (
			<FeatureFlagProvider
				config={{
					url: '',
					fallbackFlagValues: {
						FeatureFlags: [
							{ Name: 'MAINTENANCE_START_TIMESTAMP_EXAMPLE', Value: '2026-09-03T13:30:00Z' },
							{ Name: 'MAINTENANCE_END_TIMESTAMP_EXAMPLE', Value: '2026-09-04T14:30:00Z' },
							{ Name: 'MAINTENANCE_MSG_SYSTEM_EXAMPLE', Value: '<b>Portal unavailable ##timeRangeStr##</b><p>From ##startTimestampStr## until ##endTimestampStr##.</p>' },
						],
					},
				}}
			>
				<Story />
			</FeatureFlagProvider>
		),
	],
} satisfies Meta<typeof MaintenanceMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText('Portal unavailable September 03 - September 04')).toBeVisible();
		await expect(canvas.getByText('From 9:30 am on Thursday, September 03, 2026 until 10:30 am on Friday, September 04, 2026.')).toBeVisible();
	},
};
