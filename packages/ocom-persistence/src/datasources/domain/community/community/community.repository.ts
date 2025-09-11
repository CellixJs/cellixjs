import { Domain } from '@ocom/domain';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { MongooseSeedwork } from '@cellix/data-sources-mongoose';
import type { CommunityDomainAdapter } from './community.domain-adapter.ts';

type CommunityModelType = Models.Community.Community; // ReturnType<typeof Models.Community.CommunityModelFactory> & Models.Community.Community & { baseModelName: string };
type PropType = CommunityDomainAdapter;

export class CommunityRepository //<
	//PropType extends Domain.Contexts.Community.Community.CommunityProps
	//>
	extends MongooseSeedwork.MongoRepositoryBase<
		CommunityModelType,
		PropType,
		Domain.Passport,
		Domain.Contexts.Community.Community.Community<PropType>
	>
	implements Domain.Contexts.Community.Community.CommunityRepository<PropType>
{
	async getByIdWithCreatedBy(
		id: string,
	): Promise<Domain.Contexts.Community.Community.Community<PropType>> {
		const mongoCommunity = await this.model
			.findById(id)
			.populate('createdBy')
			.exec();
		if (!mongoCommunity) {
			throw new Error(`Community with id ${id} not found`);
		}
		return this.typeConverter.toDomain(mongoCommunity, this.passport);
	}

	// biome-ignore lint:noRequireAwait
	async getNewInstance(
		name: string,
		user: Domain.Contexts.User.EndUser.EndUserEntityReference,
	): Promise<Domain.Contexts.Community.Community.Community<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			Domain.Contexts.Community.Community.Community.getNewInstance(
				adapter,
				name,
				user,
				this.passport,
			),
		);
	}
}
