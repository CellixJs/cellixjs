import { MongooseSeedwork } from '@cellix/mongoose-seedwork';

import type { Passport } from '@ocom/domain';
import type { StaffRoleDomainAdapter } from './staff-role.domain-adapter.ts';
import type { StaffRole } from '@ocom/data-sources-mongoose-models/role/staff-role';

type StaffRoleModelType = StaffRole;
type AdapterType = StaffRoleDomainAdapter;

export class StaffRoleRepository
	extends MongooseSeedwork.MongoRepositoryBase<
		StaffRoleModelType,
		AdapterType,
		Passport,
		StaffRole<AdapterType>
	>
	implements StaffRoleRepository<AdapterType>
{
	async getById(
		id: string,
	): Promise<StaffRole<AdapterType>> {
		const staffRole = await this.model.findById(id).exec();
		if (!staffRole) {
			throw new Error(`StaffRole with id ${id} not found`);
		}
		return this.typeConverter.toDomain(staffRole, this.passport);
	}

	async getByRoleName(
		roleName: string,
	): Promise<StaffRole<AdapterType>> {
		const staffRole = await this.model.findOne({ roleName }).exec();
		if (!staffRole) {
			throw new Error(`StaffRole with roleName ${roleName} not found`);
		}
		return this.typeConverter.toDomain(staffRole, this.passport);
	}

	getNewInstance(
		name: string,
	): Promise<StaffRole<AdapterType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			StaffRole.getNewInstance(
				adapter,
				this.passport,
				name,
				false,
			),
		);
	}
}
