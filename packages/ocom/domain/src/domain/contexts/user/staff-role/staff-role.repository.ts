import type * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { StaffRole, StaffRoleProps } from './staff-role.ts';

export interface StaffRoleRepository<Props extends StaffRoleProps>
	extends DomainSeedwork.Repository<StaffRole<Props>> {
	getNewInstance(name: string): Promise<StaffRole<Props>>;
	getById(id: string): Promise<StaffRole<Props>>;
	getByRoleName(roleName: string): Promise<StaffRole<Props>>;
}
