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
	sectionPermissions: {
		canManageCommunities: boolean;
		canManageUser: boolean;
		canManageFinance: boolean;
		canManageTechAdmin: boolean;
	};
}

const DEFAULT_ROLE_SPECS: DefaultRoleSpec[] = [
	{
		roleName: StaffAppRoleNames.CaseManager,
		isDefault: false,
		sectionPermissions: { canManageCommunities: true, canManageUser: true, canManageFinance: false, canManageTechAdmin: false },
	},
	{
		roleName: StaffAppRoleNames.ServiceLineOwner,
		isDefault: false,
		sectionPermissions: { canManageCommunities: true, canManageUser: true, canManageFinance: false, canManageTechAdmin: false },
	},
	{
		roleName: StaffAppRoleNames.Finance,
		isDefault: false,
		sectionPermissions: { canManageCommunities: false, canManageUser: false, canManageFinance: true, canManageTechAdmin: false },
	},
	{
		roleName: StaffAppRoleNames.TechAdmin,
		isDefault: false,
		sectionPermissions: { canManageCommunities: false, canManageUser: false, canManageFinance: false, canManageTechAdmin: true },
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

const applySectionPermissions = (staffRole: Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>, sectionPerms: DefaultRoleSpec['sectionPermissions']): void => {
	const { sectionPermissions } = staffRole.permissions;
	sectionPermissions.canManageCommunities = sectionPerms.canManageCommunities;
	sectionPermissions.canManageUser = sectionPerms.canManageUser;
	sectionPermissions.canManageFinance = sectionPerms.canManageFinance;
	sectionPermissions.canManageTechAdmin = sectionPerms.canManageTechAdmin;
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
				applySectionPermissions(staffRole, spec.sectionPermissions);

				const saved = await repository.save(staffRole);
				created.push(saved);
			}
		});

		return created;
	};
};
