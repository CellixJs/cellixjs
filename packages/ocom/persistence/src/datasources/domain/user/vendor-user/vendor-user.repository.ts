import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { VendorUserDomainAdapter } from './vendor-user.domain-adapter.ts';

import { VendorUser } from '@ocom/domain/contexts/user/vendor-user';
type VendorUserDocument = Models.User.VendorUser;
type VendorUserAggregate = VendorUser<VendorUserDomainAdapter>;
type VendorUserRepositoryContract = VendorUserRepository<VendorUserDomainAdapter>;

export class VendorUserRepository
	extends MongooseSeedwork.MongoRepositoryBase<
	VendorUserDocument,
	VendorUserDomainAdapter,
	Passport,
	VendorUserAggregate
	>
	implements VendorUserRepositoryContract
{
	async delete(id: string): Promise<void> {
		await this.model.findByIdAndDelete(id).exec();
	}

	async getById(id: string): Promise<VendorUserAggregate> {
		const vendorUser = await this.model.findById(id).exec();
		if (!vendorUser) {
			throw new Error(`VendorUser with id ${id} not found`);
		}
		return this.typeConverter.toDomain(vendorUser, this.passport);
	}

	async getByExternalId(externalId: string): Promise<VendorUserAggregate> {
		const vendorUser = await this.model
			.findOne({ externalId })
			.exec();
		if (!vendorUser) {
			throw new Error(
				`VendorUser with externalId ${externalId} not found`,
			);
		}
		return this.typeConverter.toDomain(vendorUser, this.passport);
	}

	getNewInstance(
		externalId: string,
		lastName: string,
		restOfName?: string,
	): Promise<VendorUserAggregate> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		adapter.tags = [];
		adapter.accessBlocked = false;
		return Promise.resolve(
			getNewUser(
				adapter,
				this.passport,
				externalId,
				lastName,
				restOfName,
			),
		);
	}
}
