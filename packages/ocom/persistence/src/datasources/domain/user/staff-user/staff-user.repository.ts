import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { Domain } from '@ocom/domain';
import type { StaffUserDomainAdapter } from './staff-user.domain-adapter.ts';

type StaffUserDocument = Models.User.StaffUser;
type StaffUserAggregate = Domain.Contexts.User.StaffUser.StaffUser<StaffUserDomainAdapter>;
type StaffUserRepositoryContract = Domain.Contexts.User.StaffUser.StaffUserRepository<StaffUserDomainAdapter>;

export class StaffUserRepository
	extends MongooseSeedwork.MongoRepositoryBase<
	StaffUserDocument,
	StaffUserDomainAdapter,
	Domain.Passport,
	StaffUserAggregate
	>
	implements StaffUserRepositoryContract
{
	async delete(id: string): Promise<void> {
		await this.model.findByIdAndDelete(id).exec();
	}

	async getById(id: string): Promise<StaffUserAggregate> {
		const staffUser = await this.model.findById(id).populate('role').exec();
		if (!staffUser) {
			throw new Error(`StaffUser with id ${id} not found`);
		}
		return this.typeConverter.toDomain(staffUser, this.passport);
	}

	async getByExternalId(externalId: string): Promise<StaffUserAggregate> {
		const staffUser = await this.model
			.findOne({ externalId })
			.populate('role')
			.exec();
		if (!staffUser) {
			throw new Error(`StaffUser with externalId ${externalId} not found`);
		}
		return this.typeConverter.toDomain(staffUser, this.passport);
	}

	getNewInstance(
		externalId: string,
		firstName: string,
		lastName: string,
		email: string,
	): Promise<StaffUserAggregate> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		adapter.tags = [];
		adapter.accessBlocked = false;
		return Promise.resolve(
			Domain.Contexts.User.StaffUser.StaffUser.getNewUser(
				adapter,
				this.passport,
				externalId,
				firstName,
				lastName,
				email,
			),
		);
	}
}
