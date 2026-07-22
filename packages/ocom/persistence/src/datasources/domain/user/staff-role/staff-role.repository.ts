import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { StaffRole } from '@ocom/data-sources-mongoose-models/role/staff-role';
import { Domain } from '@ocom/domain';
import type { StaffRoleDomainAdapter } from './staff-role.domain-adapter.ts';

type StaffRoleModelType = StaffRole;
type AdapterType = StaffRoleDomainAdapter;

export class StaffRoleRepository
	extends MongooseSeedwork.MongoRepositoryBase<StaffRoleModelType, AdapterType, Domain.Passport, Domain.Contexts.User.StaffRole.StaffRole<AdapterType>>
	implements Domain.Contexts.User.StaffRole.StaffRoleRepository<AdapterType>
{
	override async get(id: string): Promise<Domain.Contexts.User.StaffRole.StaffRole<AdapterType>> {
		return await this.getById(id);
	}

	async getById(id: string): Promise<Domain.Contexts.User.StaffRole.StaffRole<AdapterType>> {
		const staffRole = await this.model
			.findOne({ _id: id, deletionStatus: { $ne: 'deleted' } })
			.session(this.session)
			.exec();
		if (!staffRole) {
			throw new NotFoundError(`StaffRole with id ${id} not found`);
		}
		return this.typeConverter.toDomain(staffRole, this.passport);
	}

	async getByIdForDeletion(id: string): Promise<Domain.Contexts.User.StaffRole.StaffRole<AdapterType>> {
		const staffRole = await this.model.findById(id).session(this.session).exec();
		if (!staffRole) {
			throw new NotFoundError(`StaffRole with id ${id} not found`);
		}
		return this.typeConverter.toDomain(staffRole, this.passport);
	}

	async getByIdForAssignment(id: string): Promise<Domain.Contexts.User.StaffRole.StaffRole<AdapterType>> {
		const staffRole = await this.model
			.findOne({
				_id: id,
				deletionStatus: { $nin: ['deleting', 'deleted'] },
			})
			.session(this.session)
			.exec();
		if (!staffRole) {
			throw new NotFoundError(`StaffRole with id ${id} not found`);
		}
		return this.typeConverter.toDomain(staffRole, this.passport);
	}

	async getDeletionStatus(id: string): Promise<Domain.Contexts.User.StaffRole.StaffRoleDeletionStatus> {
		const staffRole = await this.model.findById(id).session(this.session).select({ deletionStatus: 1 }).exec();
		if (!staffRole) {
			throw new NotFoundError(`StaffRole with id ${id} not found`);
		}
		return staffRole.deletionStatus ?? 'active';
	}

	async getReplacementRoleForDeletion(id: string): Promise<Domain.Contexts.User.StaffRole.StaffRole<AdapterType>> {
		const roleBeingDeleted = await this.model
			.findOne({
				_id: id,
				deletionStatus: { $in: ['deleting', 'deleted'] },
			})
			.session(this.session)
			.exec();
		if (!roleBeingDeleted?.replacementRole) {
			throw new NotFoundError(`Replacement StaffRole for deleted role ${id} not found`);
		}

		const replacementRole = await this.model
			.findOne({
				_id: roleBeingDeleted.replacementRole,
				isDefault: true,
				deletionStatus: { $nin: ['deleting', 'deleted'] },
			})
			.session(this.session)
			.exec();
		if (!replacementRole) {
			throw new NotFoundError(`Replacement StaffRole for deleted role ${id} not found`);
		}
		return this.typeConverter.toDomain(replacementRole, this.passport);
	}

	async getByRoleName(roleName: string): Promise<Domain.Contexts.User.StaffRole.StaffRole<AdapterType>> {
		const staffRole = await this.model
			.findOne({ roleName, deletionStatus: { $ne: 'deleted' } })
			.session(this.session)
			.exec();
		if (!staffRole) {
			throw new NotFoundError(`StaffRole with roleName ${roleName} not found`);
		}
		return this.typeConverter.toDomain(staffRole, this.passport);
	}

	async getDefaultRoleByEnterpriseAppRole(enterpriseAppRole: string): Promise<Domain.Contexts.User.StaffRole.StaffRole<AdapterType>> {
		const staffRole = await this.model
			.findOne({
				isDefault: true,
				enterpriseAppRole,
				deletionStatus: { $nin: ['deleting', 'deleted'] },
			})
			.session(this.session)
			.exec();
		if (!staffRole) {
			throw new NotFoundError(`Default StaffRole with enterpriseAppRole ${enterpriseAppRole} not found`);
		}
		return this.typeConverter.toDomain(staffRole, this.passport);
	}

	getNewInstance(name: string): Promise<Domain.Contexts.User.StaffRole.StaffRole<AdapterType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(Domain.Contexts.User.StaffRole.StaffRole.getNewInstance(adapter, this.passport, name, false));
	}

	getNewDefaultCaseManagerInstance(): Promise<Domain.Contexts.User.StaffRole.StaffRole<AdapterType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(Domain.Contexts.User.StaffRole.StaffRole.getNewDefaultCaseManagerInstance(adapter, this.passport));
	}

	getNewDefaultServiceLineOwnerInstance(): Promise<Domain.Contexts.User.StaffRole.StaffRole<AdapterType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(Domain.Contexts.User.StaffRole.StaffRole.getNewDefaultServiceLineOwnerInstance(adapter, this.passport));
	}

	getNewDefaultFinanceInstance(): Promise<Domain.Contexts.User.StaffRole.StaffRole<AdapterType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(Domain.Contexts.User.StaffRole.StaffRole.getNewDefaultFinanceInstance(adapter, this.passport));
	}

	getNewDefaultTechAdminInstance(): Promise<Domain.Contexts.User.StaffRole.StaffRole<AdapterType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(Domain.Contexts.User.StaffRole.StaffRole.getNewDefaultTechAdminInstance(adapter, this.passport));
	}
}
