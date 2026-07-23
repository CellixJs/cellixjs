import type { StaffRoleModelType } from '@ocom/data-sources-mongoose-models/role/staff-role';
import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { StaffRoleConverter } from '../../../domain/user/staff-role/staff-role.domain-adapter.ts';

export interface StaffRoleReadRepository {
	getAll: () => Promise<Domain.Contexts.User.StaffRole.StaffRoleEntityReference[]>;
	getById: (id: string) => Promise<Domain.Contexts.User.StaffRole.StaffRoleEntityReference | null>;
}

class StaffRoleReadRepositoryImpl implements StaffRoleReadRepository {
	private readonly model: StaffRoleModelType;
	private readonly converter: StaffRoleConverter;
	private readonly passport: Domain.Passport;

	constructor(models: ModelsContext, passport: Domain.Passport) {
		if (!models.StaffRole) {
			throw new Error('StaffRole model is not available in the mongoose context');
		}
		this.model = models.StaffRole;
		this.converter = new StaffRoleConverter();
		this.passport = passport;
	}

	async getAll(): Promise<Domain.Contexts.User.StaffRole.StaffRoleEntityReference[]> {
		const docs = await this.model.find({}).exec();
		return docs.map((doc) => this.converter.toDomain(doc, this.passport));
	}

	async getById(id: string): Promise<Domain.Contexts.User.StaffRole.StaffRoleEntityReference | null> {
		const doc = await this.model.findById(id).exec();
		if (!doc) {
			return null;
		}
		return this.converter.toDomain(doc, this.passport);
	}
}

export const getStaffRoleReadRepository = (models: ModelsContext, passport: Domain.Passport): StaffRoleReadRepository => {
	return new StaffRoleReadRepositoryImpl(models, passport);
};
