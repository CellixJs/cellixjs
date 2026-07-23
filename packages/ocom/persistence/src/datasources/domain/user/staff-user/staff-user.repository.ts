import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { StaffUser } from '@ocom/data-sources-mongoose-models/user/staff-user';
import { Domain } from '@ocom/domain';
import type { StaffUserDomainAdapter } from './staff-user.domain-adapter.ts';

type StaffUserDocument = StaffUser;
type StaffUserAggregate = Domain.Contexts.User.StaffUser.StaffUser<StaffUserDomainAdapter>;
type StaffUserRepositoryContract = Domain.Contexts.User.StaffUser.StaffUserRepository<StaffUserDomainAdapter>;

export class StaffUserRepository extends MongooseSeedwork.MongoRepositoryBase<StaffUserDocument, StaffUserDomainAdapter, Domain.Passport, StaffUserAggregate> implements StaffUserRepositoryContract {
	async delete(id: string): Promise<void> {
		await this.model.findByIdAndDelete(id).exec();
	}

	override async get(id: string): Promise<StaffUserAggregate> {
		const staffUser = await this.model.findById(id).session(this.session).exec();
		if (!staffUser) {
			throw new NotFoundError(`StaffUser with id ${id} not found`);
		}
		return this.typeConverter.toDomain(staffUser, this.passport);
	}

	async getById(id: string): Promise<StaffUserAggregate> {
		const staffUser = await this.model.findById(id).populate('role').exec();
		if (!staffUser) {
			throw new NotFoundError(`StaffUser with id ${id} not found`);
		}
		return this.typeConverter.toDomain(staffUser, this.passport);
	}

	async getByExternalId(externalId: string): Promise<StaffUserAggregate> {
		const staffUser = await this.model.findOne({ externalId }).populate('role').exec();
		if (!staffUser) {
			throw new NotFoundError(`StaffUser with externalId ${externalId} not found`);
		}
		return this.typeConverter.toDomain(staffUser, this.passport);
	}

	async getAllAssignedToRole(roleId: string): Promise<StaffUserAggregate[]> {
		const staffUsers = await this.model.find({ role: roleId }).session(this.session).exec();
		return staffUsers.map((staffUser) => this.typeConverter.toDomain(staffUser, this.passport));
	}

	async setRoleIfCurrent(command: Domain.Contexts.User.StaffUser.SetStaffUserRoleIfCurrentCommand): Promise<boolean> {
		const now = new Date();
		const roleUpdate = command.replacementRoleId
			? {
					$set: {
						role: new MongooseSeedwork.ObjectId(command.replacementRoleId),
					},
				}
			: {
					$unset: {
						role: 1,
					},
				};
		const updated = await this.model
			.findOneAndUpdate(
				{
					_id: new MongooseSeedwork.ObjectId(command.staffUserId),
					role: new MongooseSeedwork.ObjectId(command.expectedCurrentRoleId),
					...(command.expectedUpdatedAt ? { updatedAt: command.expectedUpdatedAt } : {}),
				},
				{
					...roleUpdate,
					$push: {
						activityLog: {
							activityType: command.activityType,
							activityDescription: command.activityDescription,
							activityBy: new MongooseSeedwork.ObjectId(command.activityByStaffUserId),
							createdAt: now,
							updatedAt: now,
						},
					},
				},
				{
					session: this.session,
					new: false,
					runValidators: true,
				},
			)
			.exec();
		return updated !== null;
	}

	getNewInstance(externalId: string, firstName: string, lastName: string, email: string): Promise<StaffUserAggregate> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		adapter.tags = [];
		adapter.accessBlocked = false;
		return Promise.resolve(Domain.Contexts.User.StaffUser.StaffUser.getNewUser(adapter, this.passport, externalId, firstName, lastName, email));
	}
}
