import type { Domain } from '@ocom/domain';
import { Domain as DomainRuntime } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export const StaffAppRoleNames = {
	CaseManager: 'Default.CaseManager',
	ServiceLineOwner: 'Default.ServiceLineOwner',
	Finance: 'Default.Finance',
	TechAdmin: 'Default.TechAdmin',
} as const;

type StaffAppRoleName = (typeof StaffAppRoleNames)[keyof typeof StaffAppRoleNames];

type StaffRoleRepo = Domain.Contexts.User.StaffRole.StaffRoleRepository<Domain.Contexts.User.StaffRole.StaffRoleProps>;

const roleExists = async (repository: StaffRoleRepo, roleName: string): Promise<boolean> => {
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

const roleDefinitions: ReadonlyArray<{
	roleName: StaffAppRoleName;
	factory: (repo: StaffRoleRepo) => Promise<Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>>;
}> = [
	{ roleName: StaffAppRoleNames.CaseManager, factory: (repo) => repo.getNewDefaultCaseManagerInstance() },
	{ roleName: StaffAppRoleNames.ServiceLineOwner, factory: (repo) => repo.getNewDefaultServiceLineOwnerInstance() },
	{ roleName: StaffAppRoleNames.Finance, factory: (repo) => repo.getNewDefaultFinanceInstance() },
	{ roleName: StaffAppRoleNames.TechAdmin, factory: (repo) => repo.getNewDefaultTechAdminInstance() },
];

export const createDefaultRoles = (dataSources: DataSources) => {
	return async (): Promise<Domain.Contexts.User.StaffRole.StaffRoleEntityReference[]> => {
		const systemPassport = DomainRuntime.PassportFactory.forSystem({ canManageStaffRolesAndPermissions: true });
		const created: Domain.Contexts.User.StaffRole.StaffRoleEntityReference[] = [];

		for (const { roleName, factory } of roleDefinitions) {
			let saved: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | undefined;
			await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withTransaction(systemPassport, async (repository) => {
				if (await roleExists(repository, roleName)) return;
				const role = await factory(repository);
				saved = await repository.save(role);
			});
			if (saved) created.push(saved);
		}

		return created;
	};
};
