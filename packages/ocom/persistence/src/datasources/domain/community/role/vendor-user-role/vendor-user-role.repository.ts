import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { Domain } from '@ocom/domain';
import type { VendorUserRoleDomainAdapter } from './vendor-user-role.domain-adapter.ts';

type VendorUserRoleModelType = Models.Role.VendorUserRole;
type PropType = VendorUserRoleDomainAdapter;

export class VendorUserRoleRepository
	extends MongooseSeedwork.MongoRepositoryBase<
		VendorUserRoleModelType,
		PropType,
		Domain.Passport,
		Domain.Contexts.Community.Role.VendorUserRole.VendorUserRole<PropType>
	>
	implements Domain.Contexts.Community.Role.VendorUserRole.VendorUserRoleRepository<PropType>
{
	async getById(
		id: string,
	): Promise<Domain.Contexts.Community.Role.VendorUserRole.VendorUserRole<PropType>> {
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
		community: Domain.Contexts.Community.Community.CommunityEntityReference
	): Promise<Domain.Contexts.Community.Role.VendorUserRole.VendorUserRole<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			Domain.Contexts.Community.Role.VendorUserRole.VendorUserRole.getNewInstance(
				adapter,
				this.passport,
				roleName,
				isDefault,
				community,
			),
		);
	}
}