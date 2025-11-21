import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { EndUserConverter } from '../../../domain/user/end-user/end-user.domain-adapter.ts';
import type { FindOneOptions, FindOptions } from '../../mongo-data-source.ts';
import {
	type EndUserDataSource,
	EndUserDataSourceImpl,
} from './end-user.data.ts';

export interface EndUserReadRepository {
	getAll: (
		options?: FindOptions,
	) => Promise<Domain.Contexts.User.EndUser.EndUserEntityReference[]>;
	getById: (
		id: string,
		options?: FindOneOptions,
	) => Promise<Domain.Contexts.User.EndUser.EndUserEntityReference | null>;
	getByName: (
		displayName: string,
		options?: FindOneOptions,
	) => Promise<Domain.Contexts.User.EndUser.EndUserEntityReference[]>;
	getByExternalId: (
		externalId: string,
		options?: FindOneOptions,
	) => Promise<Domain.Contexts.User.EndUser.EndUserEntityReference | null>;
}

export class EndUserReadRepositoryImpl implements EndUserReadRepository {
	private readonly mongoDataSource: EndUserDataSource;
	private readonly converter: EndUserConverter;
	private readonly passport: Domain.Passport;

	constructor(models: ModelsContext, passport: Domain.Passport) {
		this.mongoDataSource = new EndUserDataSourceImpl(models.User.EndUser);
		this.converter = new EndUserConverter();
		this.passport = passport;
	}

	async getAll(
		options?: FindOptions,
	): Promise<Domain.Contexts.User.EndUser.EndUserEntityReference[]> {
		return await this.mongoDataSource.find({}, options);
	}

	async getById(
		id: string,
		options?: FindOneOptions,
	): Promise<Domain.Contexts.User.EndUser.EndUserEntityReference | null> {
		const result = await this.mongoDataSource.findById(id, options);
		if (!result) {
			return null;
		}
		return this.converter.toDomain(result, this.passport);
	}

	async getByName(
		displayName: string,
		options?: FindOneOptions,
	): Promise<Domain.Contexts.User.EndUser.EndUserEntityReference[]> {
		const result = await this.mongoDataSource.find({ displayName }, options);
		return result.map((item) => this.converter.toDomain(item, this.passport));
	}

	async getByExternalId(
		externalId: string,
		options?: FindOneOptions,
	): Promise<Domain.Contexts.User.EndUser.EndUserEntityReference | null> {
		const result = await this.mongoDataSource.findOne({ externalId }, options);
		if (!result) {
			return null;
		}
		return this.converter.toDomain(result, this.passport);
	}
}

export const getEndUserReadRepository = (
	models: ModelsContext,
	passport: Domain.Passport,
) => {
	return new EndUserReadRepositoryImpl(models, passport);
};
