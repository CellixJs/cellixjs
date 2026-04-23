import type { Domain } from '@ocom/domain';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { PipelineStage } from 'mongoose';
import type { ModelsContext } from '../../../../index.ts';
import { EndUserDataSourceImpl, type EndUserDataSource } from './end-user.data.ts';
import type { FindOneOptions, FindOptions } from '../../mongo-data-source.ts';
import { EndUserConverter } from '../../../domain/user/end-user/end-user.domain-adapter.ts';

export interface EndUserReadRepository {
	getAll: (options?: FindOptions) => Promise<Domain.Contexts.User.EndUser.EndUserEntityReference[]>;
	getById: (id: string, options?: FindOneOptions) => Promise<Domain.Contexts.User.EndUser.EndUserEntityReference | null>;
	getByIds: (ids: string[], options?: FindOneOptions) => Promise<Array<Domain.Contexts.User.EndUser.EndUserEntityReference | null>>;
	getByName: (displayName: string, options?: FindOneOptions) => Promise<Domain.Contexts.User.EndUser.EndUserEntityReference[]>;
	getByExternalId: (externalId: string, options?: FindOneOptions) => Promise<Domain.Contexts.User.EndUser.EndUserEntityReference | null>;
}

export class EndUserReadRepositoryImpl implements EndUserReadRepository {
	private readonly mongoDataSource: EndUserDataSource;
	private readonly converter: EndUserConverter;
	private readonly passport: Domain.Passport;

	constructor(models: ModelsContext, passport: Domain.Passport) {
		this.mongoDataSource = new EndUserDataSourceImpl(models.EndUser);
		this.converter = new EndUserConverter();
		this.passport = passport;
	}

	async getAll(options?: FindOptions): Promise<Domain.Contexts.User.EndUser.EndUserEntityReference[]> {
		return await this.mongoDataSource.find({}, options);
	}

	async getById(id: string, options?: FindOneOptions): Promise<Domain.Contexts.User.EndUser.EndUserEntityReference | null> {
		const result = await this.mongoDataSource.findById(id, options);
		if (!result) {
			return null;
		}
		return this.converter.toDomain(result, this.passport);
	}

	async getByIds(ids: string[], options?: FindOneOptions): Promise<Array<Domain.Contexts.User.EndUser.EndUserEntityReference | null>> {
		if (ids.length === 0) {
			return [];
		}

		// Use aggregation pipeline with $match to batch query IDs
		// This avoids N+1 queries while properly handling ObjectId typing
		const objectIds = ids.map((id) => new MongooseSeedwork.ObjectId(id)) as unknown[];
		const pipeline: PipelineStage[] = [
			{
				$match: {
					_id: { $in: objectIds },
				},
			} as PipelineStage,
		];

		// Apply field projection if specified
		if (options?.fields?.length) {
			const projection: Record<string, 1 | 0> = {};
			for (const field of options.fields) {
				projection[field] = 1;
			}
			pipeline.push({ $project: projection } as PipelineStage);
		}

		// Apply population (lookup) if specified
		if (options?.populateFields?.length) {
			for (const field of options.populateFields) {
				pipeline.push({
					$lookup: {
						from: field,
						localField: field,
						foreignField: '_id',
						as: field,
					},
				} as PipelineStage);
			}
		}

		const documents = await this.mongoDataSource.aggregate(pipeline);

		// Create a map of documents by ID for efficient lookup
		const docMap = new Map(documents.map((doc) => [String(doc.id), doc]));

		// Return results in the same order as input IDs, with null for missing documents
		return ids.map((id) => {
			const doc = docMap.get(id);
			if (!doc) {
				return null;
			}
			return this.converter.toDomain(doc, this.passport);
		});
	}

	async getByName(displayName: string, options?: FindOneOptions): Promise<Domain.Contexts.User.EndUser.EndUserEntityReference[]> {
		const result = await this.mongoDataSource.find({ displayName }, options);
		return result.map((item) => this.converter.toDomain(item, this.passport));
	}

	async getByExternalId(externalId: string, options?: FindOneOptions): Promise<Domain.Contexts.User.EndUser.EndUserEntityReference | null> {
		const result = await this.mongoDataSource.findOne({ externalId }, options);
		if (!result) {
			return null;
		}
		return this.converter.toDomain(result, this.passport);
	}
}

export const getEndUserReadRepository = (models: ModelsContext, passport: Domain.Passport) => {
	return new EndUserReadRepositoryImpl(models, passport);
};
