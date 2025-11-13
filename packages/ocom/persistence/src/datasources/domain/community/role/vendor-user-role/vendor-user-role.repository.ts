import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { VendorUserRoleDomainAdapter } from './vendor-user-role.domain-adapter.ts';

import { VendorUserRole } from '@ocom/domain/contexts/community/role/vendor-user-role';
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
			getNewInstance(
				adapter,
				this.passport,
				roleName,
				isDefault,
				community,
			),
		);
	}
}