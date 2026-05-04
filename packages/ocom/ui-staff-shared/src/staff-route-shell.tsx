import { type FC, createContext, useContext, type ReactNode, useMemo } from 'react';
import { SectionLayout, type SectionLayoutProps } from './section-layout.tsx';
import type { PageLayoutProps } from '@ocom/ui-shared';
import { DashboardOutlined, HomeOutlined } from '@ant-design/icons';

export interface StaffRouteShellProps {
	title: string;
	description?: string;
}

export type StaffAuth = {
	name?: string;
	username?: string;
	email?: string;
	roles?: string[];
	raw?: Record<string, unknown>;
	onLogout?: () => Promise<void> | void;
};

export const StaffAuthContext = createContext<StaffAuth | undefined>(undefined);

export const StaffAuthProvider: FC<{ value: StaffAuth; children?: ReactNode }> = ({ value, children }) => (
	<StaffAuthContext.Provider value={value}>{children}</StaffAuthContext.Provider>
);

export const StaffRouteShell: FC<StaffRouteShellProps> = ({ title, description }) => {
	const auth = useContext(StaffAuthContext);

	// Default page layouts for staff portal with ROOT entry and parent relationships
	const pageLayouts: PageLayoutProps[] = useMemo(
		() => [
			{
				path: '/staff',
				title: 'Home',
				icon: <HomeOutlined />,
				id: 'ROOT',
			},
			{
				path: '/staff/community/*',
				title: 'Community Management',
				icon: <DashboardOutlined />,
				id: 'community',
				parent: 'ROOT',
			},
			{
				path: '/staff/users/*',
				title: 'User Management',
				icon: <DashboardOutlined />,
				id: 'users',
				parent: 'ROOT',
			},
			{
				path: '/staff/finance/*',
				title: 'Finance',
				icon: <DashboardOutlined />,
				id: 'finance',
				parent: 'ROOT',
			},
			{
				path: '/staff/tech/*',
				title: 'Tech Admin',
				icon: <DashboardOutlined />,
				id: 'tech',
				parent: 'ROOT',
			},
		],
		[],
	);

	const sectionLayoutProps: SectionLayoutProps = {
		pageLayouts,
		memberData: auth,
		title,
		description: description ?? '',
	};

	return <SectionLayout {...sectionLayoutProps} />;
};
