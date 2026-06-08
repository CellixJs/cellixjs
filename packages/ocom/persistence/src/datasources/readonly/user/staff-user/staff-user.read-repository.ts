import type { StaffUserModelType } from '@ocom/data-sources-mongoose-models/user/staff-user';
import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { StaffUserConverter } from '../../../domain/user/staff-user/staff-user.domain-adapter.ts';

export interface StaffUserReadRepository {
	getByExternalId: (externalId: string) => Promise<Domain.Contexts.User.StaffUser.StaffUserEntityReference | null>;
}

class StaffUserReadRepositoryImpl implements StaffUserReadRepository {
	private readonly model: StaffUserModelType;
	private readonly converter: StaffUserConverter;
	private readonly passport: Domain.Passport;

	constructor(models: ModelsContext, passport: Domain.Passport) {
		if (!models.StaffUser) {
			throw new Error('StaffUser model is not available in the mongoose context');
		}
		this.model = models.StaffUser;
		this.converter = new StaffUserConverter();
		this.passport = passport;
	}

	async getByExternalId(externalId: string): Promise<Domain.Contexts.User.StaffUser.StaffUserEntityReference | null> {
		const doc = await this.model.findOne({ externalId }).populate('role').exec();
		if (!doc) {
			return null;
		}
		return this.converter.toDomain(doc, this.passport);
	}
}

export const getStaffUserReadRepository = (models: ModelsContext, passport: Domain.Passport): StaffUserReadRepository => {
	return new StaffUserReadRepositoryImpl(models, passport);
};
