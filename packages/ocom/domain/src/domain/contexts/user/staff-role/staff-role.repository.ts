import type { Repository } from '@cellix/domain-seedwork/repository';
import type { StaffRole, StaffRoleProps } from './staff-role.ts';
export interface StaffRoleRepository<Props extends StaffRoleProps> extends Repository<StaffRole<Props>> {
	getNewInstance(name: string): Promise<StaffRole<Props>>;
	getNewDefaultCaseManagerInstance(): Promise<StaffRole<Props>>;
	getNewDefaultServiceLineOwnerInstance(): Promise<StaffRole<Props>>;
	getNewDefaultFinanceInstance(): Promise<StaffRole<Props>>;
	getNewDefaultTechAdminInstance(): Promise<StaffRole<Props>>;
	getById(id: string): Promise<StaffRole<Props>>;
	getByRoleName(roleName: string): Promise<StaffRole<Props>>;
	getDefaultRoleByEnterpriseAppRole(enterpriseAppRole: string): Promise<StaffRole<Props>>;
}
