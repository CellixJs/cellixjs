import type { PageLayoutProps } from '@ocom/ui-shared';
import type { Meta, StoryObj } from '@storybook/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, within } from 'storybook/test';
import { SectionLayoutHeaderCurrentStaffUserDocument } from './generated.tsx';
import { SectionLayoutContainer } from './section-layout.container.tsx';
import { StaffAuthProvider } from './staff-route-shell.tsx';

const pageLayouts: PageLayoutProps[] = [
	{
		path: '/staff/custom',
		title: 'Custom',
		icon: <span>•</span>,
		id: 'ROOT',
	},
];

const meta = {
	title: 'Components/Staff/Section Layout Container',
	component: SectionLayoutContainer,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof SectionLayoutContainer>;

export default meta;
type Story = StoryObj<typeof SectionLayoutContainer>;

const renderContainer = (story: ReactElement) => (
	<StaffAuthProvider
		value={{
			name: 'Fallback Name',
			permissions: {
				canManageCommunities: true,
				canManageUsers: false,
				canManageFinance: false,
				canManageTechAdmin: false,
			},
		}}
	>
		<MemoryRouter initialEntries={['/staff/custom']}>
			<Routes>
				<Route
					path="/staff/*"
					element={story}
				/>
			</Routes>
		</MemoryRouter>
	</StaffAuthProvider>
);

export const WithDisplayName: Story = {
	args: {
		pageLayouts,
	} satisfies { pageLayouts: PageLayoutProps[] },
	parameters: {
		apolloClient: {
			mocks: [
				{
					request: {
						query: SectionLayoutHeaderCurrentStaffUserDocument,
						variables: {},
					},
					result: {
						data: {
							currentStaffUserAndCreateIfNotExists: {
								__typename: 'StaffUser',
								id: 'staff-user-1',
								displayName: 'Jess',
								firstName: 'Jess',
								lastName: 'Example',
								email: 'jess@example.com',
							},
						},
					},
				},
			],
		},
	},
	decorators: [(Story) => renderContainer(<Story />)],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await expect(canvas.findByText('Jess')).resolves.toBeInTheDocument();
		expect(canvas.getByText('Communities')).toBeInTheDocument();
	},
};

export const FallsBackToAuthName: Story = {
	args: {
		pageLayouts,
	} satisfies { pageLayouts: PageLayoutProps[] },
	parameters: {
		apolloClient: {
			mocks: [
				{
					request: {
						query: SectionLayoutHeaderCurrentStaffUserDocument,
						variables: {},
					},
					result: {
						data: {
							currentStaffUserAndCreateIfNotExists: {},
						},
					},
				},
			],
		},
	},
	decorators: [(Story) => renderContainer(<Story />)],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await expect(canvas.findByText('Fallback Name')).resolves.toBeInTheDocument();
	},
};
