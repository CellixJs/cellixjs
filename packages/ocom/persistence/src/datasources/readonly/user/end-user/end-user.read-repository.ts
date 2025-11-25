import type { EndUserEntityReference, Passport } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { EndUserDataSourceImpl, type EndUserDataSource } from './end-user.data.ts';
import type { FindOneOptions, FindOptions } from '../../mongo-data-source.ts';
import { EndUserConverter } from '../../../domain/user/end-user/end-user.domain-adapter.ts';

export interface EndUserReadRepository {
    getAll: (options?: FindOptions) => Promise<EndUserEntityReference[]>;
    getById: (id: string, options?: FindOneOptions) => Promise<EndUserEntityReference | null>;
    getByName: (displayName: string, options?: FindOneOptions) => Promise<EndUserEntityReference[]>;
    getByExternalId: (externalId: string, options?: FindOneOptions) => Promise<EndUserEntityReference | null>;
}

export class EndUserReadRepositoryImpl implements EndUserReadRepository {
    private readonly mongoDataSource: EndUserDataSource;
    private readonly converter: EndUserConverter;
    private readonly passport: Passport;

    constructor(models: ModelsContext, passport: Passport) {
        this.mongoDataSource = new EndUserDataSourceImpl(models.EndUser);
        this.converter = new EndUserConverter();
        this.passport = passport;
    }

    async getAll(options?: FindOptions): Promise<EndUserEntityReference[]> {
        return await this.mongoDataSource.find({}, options);
    }

    async getById(id: string, options?: FindOneOptions): Promise<EndUserEntityReference | null> {
        const result = await this.mongoDataSource.findById(id, options);
        if (!result) { return null; }
        return this.converter.toDomain(result, this.passport);
    }

    async getByName(displayName: string, options?: FindOneOptions): Promise<EndUserEntityReference[]> {
        const result = await this.mongoDataSource.find({ displayName }, options);
        return result.map(item => this.converter.toDomain(item, this.passport));
    }

    async getByExternalId(externalId: string, options?: FindOneOptions): Promise<EndUserEntityReference | null> {
        const result = await this.mongoDataSource.findOne({ externalId }, options);
        if (!result) { return null; }
        return this.converter.toDomain(result, this.passport);
    }
}

export const getEndUserReadRepository = (
    models: ModelsContext,
    passport: Passport
) => {
    return new EndUserReadRepositoryImpl(models, passport);
};