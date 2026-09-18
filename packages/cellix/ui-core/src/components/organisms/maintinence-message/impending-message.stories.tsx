import { FeatureFlagProvider, ImpendingMessage, MaintenanceMessageProvider } from '@cellix/ui-core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

const meta = {
	title: 'Organisms/Impending Message',
	component: ImpendingMessage,
	args: {
		portalKey: 'EXAMPLE',
		isRootPage: true,
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
							{ Name: 'MAINTENANCE_END_TIMESTAMP_EXAMPLE', Value: '2026-09-03T14:30:00Z' },
							{ Name: 'MAINTENANCE_MSG_IMPENDING_EXAMPLE', Value: 'Scheduled maintenance ##timeRangeStr##: ##startTimestampStr## to ##endTimestampStr##.' },
						],
					},
				}}
			>
				<MaintenanceMessageProvider
					portalKey="EXAMPLE"
					runtime={{ getServerDate: () => Promise.resolve(undefined), isAuthenticated: false, onMaintenanceKickout: () => undefined }}
					storybookShowImpendingMessage
				>
					<Story />
				</MaintenanceMessageProvider>
			</FeatureFlagProvider>
		),
	],
} satisfies Meta<typeof ImpendingMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RootPage: Story = {
	play: async ({ canvasElement }) => {
		await expect(within(canvasElement).getByRole('alert')).toHaveTextContent('Scheduled maintenance September 03: 9:30 am on Thursday, September 03, 2026 to 10:30 am on Thursday, September 03, 2026.');
	},
};

export const FixedBanner: Story = { args: { isRootPage: false } };
