import { MockedProvider } from '@apollo/client/testing';
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
	title: 'Staff/SectionLayoutContainer',
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
	decorators: [
		(Story) => (
			<MockedProvider
				addTypename={false}
				mocks={[
					{
						request: {
							query: SectionLayoutHeaderCurrentStaffUserDocument,
						},
						result: {
							data: {
								currentStaffUserAndCreateIfNotExists: {
									id: 'staff-user-1',
									displayName: 'Jess',
									firstName: 'Jess',
									lastName: 'Example',
									email: 'jess@example.com',
								},
							},
						},
					},
				]}
			>
				{renderContainer(<Story />)}
			</MockedProvider>
		),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await expect(canvas.findByText('Jess')).resolves.toBeInTheDocument();
		expect(canvas.getByText('Custom')).toBeInTheDocument();
	},
};

export const FallsBackToAuthName: Story = {
	args: {
		pageLayouts,
	} satisfies { pageLayouts: PageLayoutProps[] },
	decorators: [
		(Story) => (
			<MockedProvider
				addTypename={false}
				mocks={[
					{
						request: {
							query: SectionLayoutHeaderCurrentStaffUserDocument,
						},
						result: {
							data: {
								currentStaffUserAndCreateIfNotExists: {},
							},
						},
					},
				]}
			>
				{renderContainer(<Story />)}
			</MockedProvider>
		),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await expect(canvas.findByText('Fallback Name')).resolves.toBeInTheDocument();
	},
};
