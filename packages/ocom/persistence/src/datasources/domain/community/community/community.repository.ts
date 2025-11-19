import type { Models } from '@ocom/data-sources-mongoose-models';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { CommunityDomainAdapter } from './community.domain-adapter.ts';
import type { Community, CommunityProps, CommunityRepository } from '@ocom/domain/contexts/community';
import type { EndUserEntityReference } from '@ocom/domain/contexts/end-user';
import type { Passport } from '@ocom/domain/contexts/passport';
// Runtime import for class constructor
import { Community as CommunityClass } from '@ocom/domain/contexts/community';

type CommunityModelType = Models.Community; // ReturnType<typeof Models.Community.CommunityModelFactory> & Models.Community & { baseModelName: string };
type PropType = CommunityDomainAdapter;

export class CommunityRepository //<
	//PropType extends CommunityProps
	//>
	extends MongooseSeedwork.MongoRepositoryBase<
		CommunityModelType,
		PropType,
		Passport,
		Community<PropType>
	>
	implements CommunityRepository<PropType>
{
	async getByIdWithCreatedBy(
		id: string,
	): Promise<Community<PropType>> {
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
		user: EndUserEntityReference,
	): Promise<Community<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			CommunityClass.getNewInstance(
				adapter,
				name,
				user,
				this.passport,
			),
		);
	}
}
