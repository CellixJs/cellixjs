import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { StaffUserDomainAdapter } from './staff-user.domain-adapter.ts';

import { StaffUser } from '@ocom/domain/contexts/user/staff-user';
type StaffUserDocument = Models.User.StaffUser;
type StaffUserAggregate = StaffUser<StaffUserDomainAdapter>;
type StaffUserRepositoryContract = StaffUserRepository<StaffUserDomainAdapter>;

export class StaffUserRepository
	extends MongooseSeedwork.MongoRepositoryBase<
	StaffUserDocument,
	StaffUserDomainAdapter,
	Passport,
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
			getNewUser(
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
