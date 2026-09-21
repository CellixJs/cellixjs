import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { CommunityConfig } from '@ocom/data-sources-mongoose-models/community/community-config';
import { Domain } from '@ocom/domain';
import type { CommunityConfigDomainAdapter } from './community-config.domain-adapter.ts';

type CommunityConfigModelType = CommunityConfig;
type PropType = CommunityConfigDomainAdapter;

export class CommunityConfigRepository
	extends MongooseSeedwork.MongoRepositoryBase<CommunityConfigModelType, PropType, Domain.Passport, Domain.Contexts.Community.CommunityConfig.CommunityConfig<PropType>>
	implements Domain.Contexts.Community.CommunityConfig.CommunityConfigRepository<PropType>
{
	async getById(id: string): Promise<Domain.Contexts.Community.CommunityConfig.CommunityConfig<PropType>> {
		const mongoCommunityConfig = await this.model.findById(id).exec();
		if (!mongoCommunityConfig) {
			throw new Error(`CommunityConfig with id ${id} not found`);
		}
		return this.typeConverter.toDomain(mongoCommunityConfig, this.passport);
	}

	getNewInstance(subscriptionTier: string, pricePerMember: number, currency: string, maxMembers: number, maxAdmins: number, effectiveDate: Date): Promise<Domain.Contexts.Community.CommunityConfig.CommunityConfig<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(Domain.Contexts.Community.CommunityConfig.CommunityConfig.getNewInstance(adapter, subscriptionTier, pricePerMember, currency, maxMembers, maxAdmins, effectiveDate, this.passport));
	}
}
