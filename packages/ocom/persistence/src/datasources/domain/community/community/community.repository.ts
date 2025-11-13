import type { Passport } from '@ocom/domain';
import type { Models } from '@ocom/data-sources-mongoose-models';
import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import type { CommunityDomainAdapter } from './community.domain-adapter.ts';

import { Community } from '@ocom/domain/contexts/community/community';
type CommunityModelType = Models.Community.Community; // ReturnType<typeof Models.Community.CommunityModelFactory> & Models.Community.Community & { baseModelName: string };
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
			getNewInstance(
				adapter,
				name,
				user,
				this.passport,
			),
		);
	}
}
