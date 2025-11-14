import type { Repository } from '@cellix/domain-seedwork/repository';
import type { EndUser, EndUserProps } from './end-user.ts';
export interface EndUserRepository<props extends EndUserProps>
	extends Repository<EndUser<props>> {
	delete(id: string): Promise<void>;
	getByExternalId(externalId: string): Promise<EndUser<props>>;
	getNewInstance(
		externalId: string,
		lastName: string,
		restOfName: string | undefined,
		email: string,
	): Promise<EndUser<props>>;
}
