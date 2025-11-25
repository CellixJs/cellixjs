import { MongooseSeedwork } from '@cellix/mongoose-seedwork';

import type { DomainDataSource, Passport } from '@ocom/domain';
import type { VendorUserDomainAdapter } from './vendor-user.domain-adapter.ts';
import type { VendorUser } from '@ocom/data-sources-mongoose-models/user/vendor-user';

type VendorUserDocument = VendorUser;
type VendorUserAggregate = Domain.Contexts.User.VendorUser.VendorUser<VendorUserDomainAdapter>;
type VendorUserRepositoryContract = Domain.Contexts.User.VendorUser.VendorUserRepository<VendorUserDomainAdapter>;

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
			Domain.Contexts.User.VendorUser.VendorUser.getNewUser(
				adapter,
				this.passport,
				externalId,
				lastName,
				restOfName,
			),
		);
	}
}
