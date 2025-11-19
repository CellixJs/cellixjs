import type { Repository } from '@cellix/domain-seedwork/repository';
import type { StaffUser, StaffUserProps } from './staff-user.ts';
export interface StaffUserRepository<props extends StaffUserProps>
	extends Repository<StaffUser<props>> {
	delete(id: string): Promise<void>;
	getByExternalId(externalId: string): Promise<StaffUser<props>>;
	getNewInstance(
		externalId: string,
		firstName: string,
		lastName: string,
		email: string,
	): Promise<StaffUser<props>>;
}
