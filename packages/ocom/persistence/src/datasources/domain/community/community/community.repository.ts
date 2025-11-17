import { Domain } from '@ocom/domain';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { CommunityDomainAdapter } from './community.domain-adapter.ts';
import type * as Community from '@ocom/domain/contexts/community';
import type * as EndUser from '@ocom/domain/contexts/end-user';

type CommunityModelType = Models.Community.Community; // ReturnType<typeof Models.Community.CommunityModelFactory> & Models.Community.Community & { baseModelName: string };
type PropType = CommunityDomainAdapter;

export class CommunityRepository //<
	//PropType extends Community.CommunityProps
	//>
	extends MongooseSeedwork.MongoRepositoryBase<
		CommunityModelType,
		PropType,
		Domain.Passport,
		Community.Community<PropType>
	>
	implements Community.CommunityRepository<PropType>
{
	async getByIdWithCreatedBy(
		id: string,
	): Promise<Community.Community<PropType>> {
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
		user: EndUser.EndUserEntityReference,
	): Promise<Community.Community<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			Community.Community.getNewInstance(
				adapter,
				name,
				user,
				this.passport,
			),
		);
	}
}
