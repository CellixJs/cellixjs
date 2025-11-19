import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { VendorUserRoleDomainAdapter } from './vendor-user-role.domain-adapter.ts';
import type { CommunityEntityReference } from '@ocom/domain/contexts/community';
import type { VendorUserRole, VendorUserRoleRepository } from '@ocom/domain/contexts/vendor-user-role';
import type { Passport } from '@ocom/domain/contexts/passport';
// Runtime import for class constructor
import { VendorUserRole as VendorUserRoleClass } from '@ocom/domain/contexts/vendor-user-role';

type VendorUserRoleModelType = Models.Role.VendorUserRole;
type PropType = VendorUserRoleDomainAdapter;

export class VendorUserRoleRepository
	extends MongooseSeedwork.MongoRepositoryBase<
		VendorUserRoleModelType,
		PropType,
		Passport,
		VendorUserRole<PropType>
	>
	implements VendorUserRoleRepository<PropType>
{
	async getById(
		id: string,
	): Promise<VendorUserRole<PropType>> {
		const mongoVendorUserRole = await this.model
			.findById(id)
			.exec();
		if (!mongoVendorUserRole) {
			throw new Error(`VendorUserRole with id ${id} not found`);
		}
		return this.typeConverter.toDomain(mongoVendorUserRole, this.passport);
	}

	// biome-ignore lint:noRequireAwait
	async getNewInstance(
		roleName: string,
		isDefault: boolean,
		community: CommunityEntityReference
	): Promise<VendorUserRole<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			VendorUserRoleClass.getNewInstance(
				adapter,
				this.passport,
				roleName,
				isDefault,
				community,
			),
		);
	}
}