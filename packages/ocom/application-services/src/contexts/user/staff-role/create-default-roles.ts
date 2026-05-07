import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export const StaffAppRoleNames = {
	CaseManager: 'Staff.CaseManager',
	ServiceLineOwner: 'Staff.ServiceLineOwner',
	Finance: 'Staff.Finance',
	TechAdmin: 'Staff.TechAdmin',
} as const;

export type StaffAppRoleName = (typeof StaffAppRoleNames)[keyof typeof StaffAppRoleNames];

interface DefaultRoleSpec {
	roleName: StaffAppRoleName;
	isDefault: boolean;
	communityPermissions: { canManageCommunities: boolean };
	financePermissions: { canManageFinance: boolean };
	techAdminPermissions: { canManageTechAdmin: boolean };
	userPermissions: { canManageUsers: boolean };
}

const DEFAULT_ROLE_SPECS: DefaultRoleSpec[] = [
	{
		roleName: StaffAppRoleNames.CaseManager,
		isDefault: false,
		communityPermissions: { canManageCommunities: true },
		financePermissions: { canManageFinance: false },
		techAdminPermissions: { canManageTechAdmin: false },
		userPermissions: { canManageUsers: true },
	},
	{
		roleName: StaffAppRoleNames.ServiceLineOwner,
		isDefault: false,
		communityPermissions: { canManageCommunities: true },
		financePermissions: { canManageFinance: false },
		techAdminPermissions: { canManageTechAdmin: false },
		userPermissions: { canManageUsers: true },
	},
	{
		roleName: StaffAppRoleNames.Finance,
		isDefault: false,
		communityPermissions: { canManageCommunities: false },
		financePermissions: { canManageFinance: true },
		techAdminPermissions: { canManageTechAdmin: false },
		userPermissions: { canManageUsers: false },
	},
	{
		roleName: StaffAppRoleNames.TechAdmin,
		isDefault: false,
		communityPermissions: { canManageCommunities: false },
		financePermissions: { canManageFinance: false },
		techAdminPermissions: { canManageTechAdmin: true },
		userPermissions: { canManageUsers: false },
	},
];

const roleExists = async (repository: Domain.Contexts.User.StaffRole.StaffRoleRepository<Domain.Contexts.User.StaffRole.StaffRoleProps>, roleName: string): Promise<boolean> => {
	try {
		await repository.getByRoleName(roleName);
		return true;
	} catch (error) {
		if (error instanceof Error && (error.name === 'NotFoundError' || error.message.toLowerCase().includes('not found'))) {
			return false;
		}
		throw error;
	}
};

const applyDefaultPermissions = (staffRole: Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>, spec: DefaultRoleSpec): void => {
	staffRole.permissions.communityPermissions.canManageCommunities = spec.communityPermissions.canManageCommunities;
	staffRole.permissions.financePermissions.canManageFinance = spec.financePermissions.canManageFinance;
	staffRole.permissions.techAdminPermissions.canManageTechAdmin = spec.techAdminPermissions.canManageTechAdmin;
	staffRole.permissions.userPermissions.canManageUsers = spec.userPermissions.canManageUsers;
};

export const createDefaultRoles = (dataSources: DataSources) => {
	return async (): Promise<Domain.Contexts.User.StaffRole.StaffRoleEntityReference[]> => {
		const created: Domain.Contexts.User.StaffRole.StaffRoleEntityReference[] = [];

		await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(async (repository) => {
			for (const spec of DEFAULT_ROLE_SPECS) {
				const exists = await roleExists(repository, spec.roleName);
				if (exists) {
					continue;
				}

				const staffRole = await repository.getNewInstance(spec.roleName);
				staffRole.isDefault = spec.isDefault;
				applyDefaultPermissions(staffRole, spec);

				const saved = await repository.save(staffRole);
				created.push(saved);
			}
		});

		return created;
	};
};
