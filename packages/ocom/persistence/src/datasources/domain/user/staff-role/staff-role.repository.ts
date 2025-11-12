import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { Passport } from '@ocom/domain';
import type { StaffRoleDomainAdapter } from './staff-role.domain-adapter.ts';

type StaffRoleModelType = Models.Role.StaffRole;
type AdapterType = StaffRoleDomainAdapter;

export class StaffRoleRepository
	extends MongooseSeedwork.MongoRepositoryBase<
		StaffRoleModelType,
		AdapterType,
		Domain.Passport,
		Domain.Contexts.User.StaffRole.StaffRole<AdapterType>
	>
	implements Domain.Contexts.User.StaffRole.StaffRoleRepository<AdapterType>
{
	async getById(
		id: string,
	): Promise<Domain.Contexts.User.StaffRole.StaffRole<AdapterType>> {
		const staffRole = await this.model.findById(id).exec();
		if (!staffRole) {
			throw new Error(`StaffRole with id ${id} not found`);
		}
		return this.typeConverter.toDomain(staffRole, this.passport);
	}

	async getByRoleName(
		roleName: string,
	): Promise<Domain.Contexts.User.StaffRole.StaffRole<AdapterType>> {
		const staffRole = await this.model.findOne({ roleName }).exec();
		if (!staffRole) {
			throw new Error(`StaffRole with roleName ${roleName} not found`);
		}
		return this.typeConverter.toDomain(staffRole, this.passport);
	}

	getNewInstance(
		name: string,
	): Promise<Domain.Contexts.User.StaffRole.StaffRole<AdapterType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			Domain.Contexts.User.StaffRole.StaffRole.getNewInstance(
				adapter,
				this.passport,
				name,
				false,
			),
		);
	}
}
