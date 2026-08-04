import type { Passport } from '../../../src/domain/contexts/passport.ts';
import type { StaffRoleProps } from '../../../src/domain/contexts/user/staff-role/staff-role.ts';
import type { StaffUserProps } from '../../../src/domain/contexts/user/staff-user/staff-user.ts';

type StaffUserPermissions = {
	canManageStaffRolesAndPermissions?: boolean;
	isSystemAccount?: boolean;
};

function createVisa(permissions: StaffUserPermissions) {
	return {
		determineIf: (
			fn: (value: { canManageEndUsers: boolean; canManageStaffRolesAndPermissions: boolean; canManageStaffUsers: boolean; canManageVendorUsers: boolean; isEditingOwnAccount: boolean; isSystemAccount: boolean }) => boolean,
		) =>
			fn({
				canManageEndUsers: false,
				canManageStaffRolesAndPermissions: permissions.canManageStaffRolesAndPermissions ?? true,
				canManageStaffUsers: permissions.canManageStaffRolesAndPermissions ?? true,
				canManageVendorUsers: false,
				isEditingOwnAccount: false,
				isSystemAccount: permissions.isSystemAccount ?? false,
			}),
	};
}

export function createMockPassport(permissions: StaffUserPermissions = {}): Passport {
	const visa = createVisa(permissions);

	return {
		user: {
			forEndUser: () => visa,
			forStaffUser: () => visa,
			forStaffRole: () => visa,
			forVendorUser: () => visa,
		},
	} as unknown as Passport;
}

export function createAuthorizingStaffRoleProps(): StaffRoleProps {
	return {
		id: 'authorizing-role-1',
		roleName: 'Authorizing Role',
		isDefault: false,
		enterpriseAppRole: 'Staff.TechAdmin',
		permissions: {
			communityPermissions: {
				canManageCommunities: false,
				canManageStaffRolesAndPermissions: false,
				canManageAllCommunities: false,
				canDeleteCommunities: false,
				canChangeCommunityOwner: false,
				canReIndexSearchCollections: false,
			},
			propertyPermissions: {
				canManageProperties: false,
				canEditOwnProperty: false,
			},
			serviceTicketPermissions: {
				canCreateTickets: false,
				canManageTickets: false,
				canAssignTickets: false,
				canWorkOnTickets: false,
			},
			servicePermissions: {
				canManageServices: false,
			},
			violationTicketPermissions: {
				canCreateTickets: false,
				canManageTickets: false,
				canAssignTickets: false,
				canWorkOnTickets: false,
			},
			financePermissions: {
				canManageFinance: false,
				canViewGLBatchSummaries: false,
				canViewFinanceConfigs: false,
				canCreateFinanceConfigs: false,
			},
			techAdminPermissions: {
				canManageTechAdmin: false,
				canViewDatabaseDocuments: false,
				canViewBlobExplorer: false,
				canViewQueueDashboard: false,
				canSendQueueMessages: false,
			},
			userPermissions: {
				canManageUsers: false,
			},
		},
		roleType: 'staff-role',
		createdAt: new Date('2024-01-01T00:00:00Z'),
		updatedAt: new Date('2024-01-02T00:00:00Z'),
		schemaVersion: '1.0.0',
	};
}

export function createStaffUserProps(): StaffUserProps {
	let roleRef: StaffRoleProps | undefined;

	return {
		id: 'staff-user-1',
		firstName: 'Alice',
		lastName: 'Smith',
		email: 'alice@cellix.com',
		displayName: 'Alice Smith',
		externalId: '123e4567-e89b-12d3-a456-426614174000',
		accessBlocked: false,
		tags: [],
		userType: 'staff',
		get role() {
			return roleRef;
		},
		setRoleRef: (role) => {
			roleRef = role;
		},
		createdAt: new Date('2024-01-01T00:00:00Z'),
		updatedAt: new Date('2024-01-02T00:00:00Z'),
		schemaVersion: '1.0.0',
	};
}
