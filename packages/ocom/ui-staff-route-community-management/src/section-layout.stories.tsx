import { StaffAuthProvider } from '@ocom/ui-staff-shared';
import type { Meta, StoryObj } from '@storybook/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SectionLayout } from './section-layout.tsx';

const meta = {
	title: 'Components/Staff/Community Management/Section Layout',
	component: SectionLayout,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof SectionLayout>;

export default meta;
type Story = StoryObj<typeof SectionLayout>;

const renderWithContext = (story: ReactElement) => (
	<StaffAuthProvider
		value={{
			name: 'Staff User',
			permissions: {
				canManageCommunities: true,
				canManageUsers: false,
				canManageFinance: false,
				canManageTechAdmin: false,
			},
		}}
	>
		<MemoryRouter initialEntries={['/staff/community-management']}>
			<Routes>
				<Route
					path="/staff/*"
					element={story}
				/>
			</Routes>
		</MemoryRouter>
	</StaffAuthProvider>
);

export const Default: Story = {
	decorators: [(Story) => renderWithContext(<Story />)],
};
