import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { StaffRoleDomainAdapter } from './staff-role.domain-adapter.ts';
import type * as StaffRole from '@ocom/domain/contexts/staff-role';
import { StaffRole as StaffRoleClass } from '@ocom/domain/contexts/staff-role';
import type { Passport } from '@ocom/domain/contexts/passport';

type StaffRoleModelType = Models.Role.StaffRole;
type AdapterType = StaffRoleDomainAdapter;

export class StaffRoleRepository
	extends MongooseSeedwork.MongoRepositoryBase<
		StaffRoleModelType,
		AdapterType,
		Passport,
		StaffRole.StaffRole<AdapterType>
	>
	implements StaffRole.StaffRoleRepository<AdapterType>
{
	async getById(
		id: string,
	): Promise<StaffRole.StaffRole<AdapterType>> {
		const staffRole = await this.model.findById(id).exec();
		if (!staffRole) {
			throw new Error(`StaffRole with id ${id} not found`);
		}
		return this.typeConverter.toDomain(staffRole, this.passport);
	}

	async getByRoleName(
		roleName: string,
	): Promise<StaffRole.StaffRole<AdapterType>> {
		const staffRole = await this.model.findOne({ roleName }).exec();
		if (!staffRole) {
			throw new Error(`StaffRole with roleName ${roleName} not found`);
		}
		return this.typeConverter.toDomain(staffRole, this.passport);
	}

	getNewInstance(
		name: string,
	): Promise<StaffRole.StaffRole<AdapterType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			StaffRoleClass.getNewInstance(
				adapter,
				this.passport,
				name,
				false,
			),
		);
	}
}
