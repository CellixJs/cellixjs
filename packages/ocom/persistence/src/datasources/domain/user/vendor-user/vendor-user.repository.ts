import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { VendorUserDomainAdapter } from './vendor-user.domain-adapter.ts';
import type * as VendorUser from '@ocom/domain/contexts/vendor-user';
import { VendorUser as VendorUserClass } from '@ocom/domain/contexts/vendor-user';
import type { Passport } from '@ocom/domain/contexts/passport';

type VendorUserDocument = Models.User.VendorUser;
type VendorUserAggregate = VendorUser.VendorUser<VendorUserDomainAdapter>;
type VendorUserRepositoryContract = VendorUser.VendorUserRepository<VendorUserDomainAdapter>;

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
			VendorUserClass.getNewUser(
				adapter,
				this.passport,
				externalId,
				lastName,
				restOfName,
			),
		);
	}
}
