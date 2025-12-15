import type { Domain } from '@ocom/domain';
import type { ModelsContext, PersistenceFactory } from '../../../../types.ts';
import { EndUserDataSourceImpl, type EndUserDataSource } from './end-user.data.ts';
import type { FindOneOptions, FindOptions, Lean } from '../../mongo-data-source.ts';
import { EndUserConverter } from '../../../domain/user/end-user/end-user.domain-adapter.ts';
import type { EndUser } from '@ocom/data-sources-mongoose-models/user/end-user';

export interface EndUserReadRepository {
    getAll: (options?: FindOptions) => Promise<Domain.Contexts.User.EndUser.EndUserEntityReference[]>;
    getById: (id: string, options?: FindOneOptions) => Promise<Domain.Contexts.User.EndUser.EndUserEntityReference | null>;
    getByName: (displayName: string, options?: FindOneOptions) => Promise<Domain.Contexts.User.EndUser.EndUserEntityReference[]>;
    getByExternalId: (externalId: string, options?: FindOneOptions) => Promise<Domain.Contexts.User.EndUser.EndUserEntityReference | null>;
}

export class EndUserReadRepositoryImpl implements EndUserReadRepository {
    private readonly mongoDataSource: EndUserDataSource;
    private readonly converter: EndUserConverter;
    private readonly passport: Domain.Passport;

    private toDomain(doc: Lean<EndUser>) {
        return this.converter.toDomain(this.mongoDataSource.hydrate(doc), this.passport);
    }

    constructor(models: ModelsContext, passport: Domain.Passport) {
        this.mongoDataSource = new EndUserDataSourceImpl(models.EndUser);
        this.converter = new EndUserConverter();
        this.passport = passport;
    }

    async getAll(options?: FindOptions): Promise<Domain.Contexts.User.EndUser.EndUserEntityReference[]> {
        const result = await this.mongoDataSource.find({}, options);
        return result.map(doc => this.toDomain(doc));
    }

    async getById(id: string, options?: FindOneOptions): Promise<Domain.Contexts.User.EndUser.EndUserEntityReference | null> {
        const result = await this.mongoDataSource.findById(id, options);
        if (!result) { return null; }
        return this.toDomain(result);
    }

    async getByName(displayName: string, options?: FindOneOptions): Promise<Domain.Contexts.User.EndUser.EndUserEntityReference[]> {
        const result = await this.mongoDataSource.find({ displayName }, options);
        return result.map(item => this.toDomain(item));
    }

    async getByExternalId(externalId: string, options?: FindOneOptions): Promise<Domain.Contexts.User.EndUser.EndUserEntityReference | null> {
        const result = await this.mongoDataSource.findOne({ externalId }, options);
        if (!result) { return null; }
        return this.toDomain(result);
    }
}

export const getEndUserReadRepository: PersistenceFactory<EndUserReadRepository> = (
    models: ModelsContext,
    passport: Domain.Passport
) => {
    return new EndUserReadRepositoryImpl(models, passport);
};