import type { Repository } from '@cellix/domain-seedwork/repository';
import type { StaffRole, StaffRoleProps } from './staff-role.ts';
export interface StaffRoleRepository<Props extends StaffRoleProps>
	extends Repository<StaffRole<Props>> {
	getNewInstance(name: string): Promise<StaffRole<Props>>;
	getById(id: string): Promise<StaffRole<Props>>;
	getByRoleName(roleName: string): Promise<StaffRole<Props>>;
}
