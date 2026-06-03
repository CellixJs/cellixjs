import { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

type StaffRoleRepo = Domain.Contexts.User.StaffRole.StaffRoleRepository<Domain.Contexts.User.StaffRole.StaffRoleProps>;

export const StaffAppRoleNames = Domain.Contexts.User.StaffRole.StaffRoleValueObjects.EnterpriseAppRoleNames;

const roleExists = async (repository: StaffRoleRepo, enterpriseAppRole: string): Promise<boolean> => {
	try {
		await repository.getDefaultRoleByEnterpriseAppRole(enterpriseAppRole);
		return true;
	} catch (error) {
		if (error instanceof Error && (error.name === 'NotFoundError' || error.message.toLowerCase().includes('not found'))) {
			return false;
		}
		throw error;
	}
};

const roleDefinitions: ReadonlyArray<{
	enterpriseAppRole: string;
	factory: (repo: StaffRoleRepo) => Promise<Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>>;
}> = [
	{ enterpriseAppRole: Domain.Contexts.User.StaffRole.StaffRoleValueObjects.EnterpriseAppRoleNames.CaseManager, factory: (repo) => repo.getNewDefaultCaseManagerInstance() },
	{ enterpriseAppRole: Domain.Contexts.User.StaffRole.StaffRoleValueObjects.EnterpriseAppRoleNames.ServiceLineOwner, factory: (repo) => repo.getNewDefaultServiceLineOwnerInstance() },
	{ enterpriseAppRole: Domain.Contexts.User.StaffRole.StaffRoleValueObjects.EnterpriseAppRoleNames.Finance, factory: (repo) => repo.getNewDefaultFinanceInstance() },
	{ enterpriseAppRole: Domain.Contexts.User.StaffRole.StaffRoleValueObjects.EnterpriseAppRoleNames.TechAdmin, factory: (repo) => repo.getNewDefaultTechAdminInstance() },
];

export const createDefaultRoles = (dataSources: DataSources) => {
	return async (): Promise<Domain.Contexts.User.StaffRole.StaffRoleEntityReference[]> => {
		const systemPassport = Domain.PassportFactory.forSystem({ canManageStaffRolesAndPermissions: true });
		const created: Domain.Contexts.User.StaffRole.StaffRoleEntityReference[] = [];

		for (const { enterpriseAppRole, factory } of roleDefinitions) {
			let saved: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | undefined;
			await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withTransaction(systemPassport, async (repository) => {
				if (await roleExists(repository, enterpriseAppRole)) return;
				const role = await factory(repository);
				saved = await repository.save(role);
			});
			if (saved) created.push(saved);
		}

		return created;
	};
};
