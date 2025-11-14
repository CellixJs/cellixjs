import { Domain } from '@ocom/domain';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { CommunityDomainAdapter } from './community.domain-adapter.ts';

type CommunityModelType = Models.Community.Community; // ReturnType<typeof Models.Community.CommunityModelFactory> & Models.Community.Community & { baseModelName: string };
type PropType = CommunityDomainAdapter;

export class CommunityRepository //<
	//PropType extends Domain.Community.CommunityProps
	//>
	extends MongooseSeedwork.MongoRepositoryBase<
		CommunityModelType,
		PropType,
		Domain.Passport,
		Domain.Community.Community<PropType>
	>
	implements Domain.Community.CommunityRepository<PropType>
{
	async getByIdWithCreatedBy(
		id: string,
	): Promise<Domain.Community.Community<PropType>> {
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
		user: Domain.EndUser.EndUserEntityReference,
	): Promise<Domain.Community.Community<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			Domain.Community.Community.getNewInstance(
				adapter,
				name,
				user,
				this.passport,
			),
		);
	}
}
