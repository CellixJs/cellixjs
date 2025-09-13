import type { EndUser, EndUserProps } from './end-user.ts';
import type { DomainSeedwork } from '@cellix/domain-seedwork';

export interface EndUserRepository<props extends EndUserProps>
	extends DomainSeedwork.Repository<EndUser<props>> {
	delete(id: string): Promise<void>;
	getByExternalId(externalId: string): Promise<EndUser<props>>;
	getNewInstance(
		externalId: string,
		lastName: string,
		restOfName: string | undefined,
		email: string,
	): Promise<EndUser<props>>;
}
