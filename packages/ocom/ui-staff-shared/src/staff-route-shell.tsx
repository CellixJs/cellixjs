import { createContext, type FC, type ReactNode, useContext } from 'react';
import { SectionLayout, type SectionLayoutProps } from './section-layout.tsx';

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
	enterpriseAppRole?: string;
	permissions?: {
		canManageCommunities?: boolean;
		canManageStaffRolesAndPermissions?: boolean;
		canManageUsers?: boolean;
		canAssignStaffRoles?: boolean;
		canViewStaffUsers?: boolean;
		canManageFinance?: boolean;
		canManageTechAdmin?: boolean;
		canViewRoles?: boolean;
		canAddRole?: boolean;
		canEditRole?: boolean;
		canRemoveRole?: boolean;
	};
};

export const StaffAuthContext = createContext<StaffAuth | undefined>(undefined);

export const StaffAuthProvider: FC<{ value: StaffAuth; children?: ReactNode }> = ({ value, children }) => <StaffAuthContext.Provider value={value}>{children}</StaffAuthContext.Provider>;

export const StaffRouteShell: FC<StaffRouteShellProps> = ({ title, description }) => {
	const auth = useContext(StaffAuthContext);

	// Navigation items are built from backend permissions in SectionLayout.
	// Pass an empty array so SectionLayout is the single source of truth for the menu.
	const sectionLayoutProps: SectionLayoutProps = {
		pageLayouts: [],
		memberData: auth,
		title,
		description: description ?? '',
	};

	return <SectionLayout {...sectionLayoutProps} />;
};
