import { MongooseSeedwork } from '@cellix/data-sources-mongoose';
import type { Models } from '@ocom/api-data-sources-mongoose-models';
import { Domain } from '@ocom/api-domain';

export class EndUserRepository<
		PropType extends Domain.Contexts.User.EndUser.EndUserProps,
	>
	extends MongooseSeedwork.MongoRepositoryBase<
		Models.User.EndUser,
		PropType,
		Domain.Passport,
		Domain.Contexts.User.EndUser.EndUser<PropType>
	>
	implements Domain.Contexts.User.EndUser.EndUserRepository<PropType>
{
	async getByExternalId(
		externalId: string,
	): Promise<Domain.Contexts.User.EndUser.EndUser<PropType>> {
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
	): Promise<Domain.Contexts.User.EndUser.EndUser<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			Domain.Contexts.User.EndUser.EndUser.getNewInstance(
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
