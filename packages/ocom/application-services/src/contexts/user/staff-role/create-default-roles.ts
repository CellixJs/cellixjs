import type { Domain } from '@ocom/domain';
import { Domain as DomainRuntime } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export const StaffAppRoleNames = {
	CaseManager: 'Default.CaseManager',
	ServiceLineOwner: 'Default.ServiceLineOwner',
	Finance: 'Default.Finance',
	TechAdmin: 'Default.TechAdmin',
} as const;

export type StaffAppRoleName = (typeof StaffAppRoleNames)[keyof typeof StaffAppRoleNames];

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

export const createDefaultRoles = (dataSources: DataSources) => {
	return async (): Promise<Domain.Contexts.User.StaffRole.StaffRoleEntityReference[]> => {
		const created: Domain.Contexts.User.StaffRole.StaffRoleEntityReference[] = [];

		await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withTransaction(DomainRuntime.PassportFactory.forSystem({ canManageStaffRolesAndPermissions: true }), async (repository) => {
			const defaultRoleSpecs = DomainRuntime.Contexts.User.StaffRole.StaffRole.getDefaultRoleSpecs();
			for (const defaultRoleSpec of defaultRoleSpecs) {
				const { roleName } = defaultRoleSpec;
				const exists = await roleExists(repository, roleName);
				if (exists) {
					continue;
				}

				const staffRole = await repository.getNewInstance(roleName);
				defaultRoleSpec.apply(staffRole);
				const saved: Domain.Contexts.User.StaffRole.StaffRoleEntityReference = await repository.save(staffRole);
				created.push(saved);
			}
		});

		return created;
	};
};
