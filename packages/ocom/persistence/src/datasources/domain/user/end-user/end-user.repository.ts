import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';

import { EndUser } from '@ocom/domain/contexts/user/end-user';
import type { EndUserProps } from '@ocom/domain/contexts/user/end-user';
export class EndUserRepository<
		PropType extends EndUserProps,
	>
	extends MongooseSeedwork.MongoRepositoryBase<
		Models.User.EndUser,
		PropType,
		Passport,
		EndUser<PropType>
	>
	implements EndUserRepository<PropType>
{
	async getByExternalId(
		externalId: string,
	): Promise<EndUser<PropType>> {
		const user = await this.model.findOne({ externalId: externalId }).exec();
		if (!user) {
			throw new Error(`User with externalId ${externalId} not found`);
		}
		return this.typeConverter.toDomain(user, this.passport);
	}

	// biome-ignore lint:noRequireAwait
	async getNewInstance(
		externalId: string,
		lastName: string,
		restOfName: string | undefined,
		email: string,
	): Promise<EndUser<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			getNewInstance(
				adapter,
				this.passport,
				externalId,
				lastName,
				restOfName,
				email,
			),
		); //no context needed for new user
	}

	async delete(id: string): Promise<void> {
		await this.model.deleteOne({ _id: id }).exec();
	}
}
