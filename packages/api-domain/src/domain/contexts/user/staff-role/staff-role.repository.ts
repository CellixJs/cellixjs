import { StaffRole, type StaffRoleProps } from './staff-role.ts';
import { DomainSeedwork } from '@cellix/domain-seedwork';

export interface StaffRoleRepository<Props extends StaffRoleProps> extends DomainSeedwork.Repository<StaffRole<Props>> {
  getNewInstance(name: string): Promise<StaffRole<Props>>;
  getById(id: string): Promise<StaffRole<Props>>;
  getByRoleName(roleName: string): Promise<StaffRole<Props>>;
}