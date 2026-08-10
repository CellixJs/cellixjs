import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Domain } from '@ocom/domain';

import type { ModelsContext } from '../../../../index.ts';
import { PropertyConverter } from '../../../domain/property/property/property.domain-adapter.ts';
import type { FindOneOptions, FindOptions } from '../../mongo-data-source.ts';
import { type PropertyDataSource, PropertyDataSourceImpl } from './property.data.ts';

export interface PropertyReadRepository {
	getById: (id: string, options?: FindOneOptions) => Promise<Domain.Contexts.Property.Property.PropertyEntityReference | null>;
	getByCommunityId: (communityId: string, options?: FindOptions) => Promise<Domain.Contexts.Property.Property.PropertyEntityReference[]>;
}

export class PropertyReadRepositoryImpl implements PropertyReadRepository {
	private readonly mongoDataSource: PropertyDataSource;
	private readonly converter: PropertyConverter;
	private readonly passport: Domain.Passport;

	/**
	 * Constructs a new PropertyReadRepositoryImpl.
	 * @param models - The models context containing the Property model.
	 * @param passport - The passport object for domain access.
	 */
	constructor(models: ModelsContext, passport: Domain.Passport) {
		this.mongoDataSource = new PropertyDataSourceImpl(models.Property);
		this.converter = new PropertyConverter();
		this.passport = passport;
	}

	/**
	 * Retrieves a Property entity by its ID.
	 * Soft-deleted properties are treated as not found.
	 * @param id - The ID of the Property entity.
	 * @param options - Optional find options for querying.
	 * @returns A promise that resolves to a PropertyEntityReference object or null if not found.
	 */
	async getById(id: string, options?: FindOneOptions): Promise<Domain.Contexts.Property.Property.PropertyEntityReference | null> {
		const defaultPopulateFields = ['community', 'owner'];
		const finalOptions: FindOneOptions = {
			...options,
			populateFields: options?.populateFields ? [...new Set([...defaultPopulateFields, ...options.populateFields])] : defaultPopulateFields,
		};
		const result = await this.mongoDataSource.findById(id, finalOptions);
		if (!result || result.isDeleted === true) {
			return null;
		}
		return this.converter.toDomain(result, this.passport);
	}

	/**
	 * Retrieves all Property entities for a given community ID.
	 * Soft-deleted properties are excluded.
	 * @param communityId - The ID of the community to retrieve properties for.
	 * @param options - Optional find options for querying.
	 * @returns A promise that resolves to an array of PropertyEntityReference objects that belong to the specified community.
	 */
	async getByCommunityId(communityId: string, options?: FindOptions): Promise<Domain.Contexts.Property.Property.PropertyEntityReference[]> {
		const defaultPopulateFields = ['community', 'owner'];
		const finalOptions: FindOptions = {
			...options,
			populateFields: options?.populateFields ? [...new Set([...defaultPopulateFields, ...options.populateFields])] : defaultPopulateFields,
		};
		const result = await this.mongoDataSource.find(
			{
				community: new MongooseSeedwork.ObjectId(communityId) as unknown,
				isDeleted: { $ne: true } as unknown,
			} as Parameters<typeof this.mongoDataSource.find>[0],
			finalOptions,
		);
		return result.map((doc) => this.converter.toDomain(doc, this.passport));
	}
}

export const getPropertyReadRepository = (models: ModelsContext, passport: Domain.Passport) => {
	return new PropertyReadRepositoryImpl(models, passport);
};
