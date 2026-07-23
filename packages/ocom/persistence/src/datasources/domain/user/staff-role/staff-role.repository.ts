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
	async getById(id: string): Promise<Domain.Contexts.User.StaffRole.StaffRole<AdapterType>> {
		const staffRole = await this.model.findById(id).session(this.session).exec();
		if (!staffRole) {
			throw new NotFoundError(`StaffRole with id ${id} not found`);
		}
		return this.typeConverter.toDomain(staffRole, this.passport);
	}

	async getByRoleName(roleName: string): Promise<Domain.Contexts.User.StaffRole.StaffRole<AdapterType>> {
		const staffRole = await this.model.findOne({ roleName }).session(this.session).exec();
		if (!staffRole) {
			throw new NotFoundError(`StaffRole with roleName ${roleName} not found`);
		}
		return this.typeConverter.toDomain(staffRole, this.passport);
	}

	async getDefaultRoleByEnterpriseAppRole(enterpriseAppRole: string): Promise<Domain.Contexts.User.StaffRole.StaffRole<AdapterType>> {
		const staffRole = await this.model.findOne({ isDefault: true, enterpriseAppRole }).session(this.session).exec();
		if (!staffRole) {
			throw new NotFoundError(`Default StaffRole with enterpriseAppRole ${enterpriseAppRole} not found`);
		}
		return this.typeConverter.toDomain(staffRole, this.passport);
	}

	async restoreDeleted(role: Domain.Contexts.User.StaffRole.StaffRole<AdapterType>): Promise<void> {
		const persistence = this.typeConverter.toPersistence(role);
		const snapshot = persistence.toObject();
		Reflect.deleteProperty(snapshot, '_id');
		await this.model
			.updateOne(
				{ _id: persistence._id },
				{
					$setOnInsert: snapshot,
				},
				{
					upsert: true,
					session: this.session,
					timestamps: false,
					setDefaultsOnInsert: false,
				},
			)
			.exec();
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
