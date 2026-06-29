import { StaffAuthProvider } from '@ocom/ui-staff-shared';
 import type { Meta, StoryObj } from '@storybook/react';
 import type { ReactElement } from 'react';
 import { MemoryRouter, Route, Routes } from 'react-router-dom';
 import { Root } from './index.tsx';
 
 const meta = {
 	title: 'Pages/Staff/Finance/Placeholder',
 	component: Root,
 	parameters: {
 		layout: 'fullscreen',
 	},
 } satisfies Meta<typeof Root>;
 
 export default meta;
 type Story = StoryObj<typeof Root>;
 
 const renderWithContext = (story: ReactElement) => (
 	<StaffAuthProvider
 		value={{
 			name: 'Staff User',
 			permissions: {
 				canManageStaffRolesAndPermissions: true,
                canManageUsers: true,
                canAssignStaffRoles: true,
                canViewStaffUsers: true,
                canManageFinance: true,
                canViewRoles: true,
                canAddRole: true,
                canEditRole: true,
                canRemoveRole: true,
 			},
 		}}
 	>
 		<MemoryRouter initialEntries={['/staff/finance']}>
 			<Routes>
 				<Route path="/staff/*" element={story} />
 			</Routes>
 		</MemoryRouter>
 	</StaffAuthProvider>
 );
 
 export const Default: Story = {
 	decorators: [(Story) => renderWithContext(<Story />)],
 };
