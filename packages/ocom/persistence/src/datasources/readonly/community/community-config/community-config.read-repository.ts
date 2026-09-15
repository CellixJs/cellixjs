import type { CommunityConfig } from '@ocom/data-sources-mongoose-models/community/community-config';
import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { CommunityConfigConverter } from '../../../domain/community/community-config/community-config.domain-adapter.ts';
import { type CommunityConfigDataSource, CommunityConfigDataSourceImpl } from './community-config.data.ts';

export interface CommunityConfigReadRepository {
	getById: (id: string) => Promise<Domain.Contexts.Community.CommunityConfig.CommunityConfigEntityReference | null>;
	getLatestEffective: (subscriptionTier: string, asOf?: Date) => Promise<Domain.Contexts.Community.CommunityConfig.CommunityConfigEntityReference | null>;
}

export class CommunityConfigReadRepositoryImpl implements CommunityConfigReadRepository {
	private readonly mongoDataSource: CommunityConfigDataSource;
	private readonly converter: CommunityConfigConverter;
	private readonly passport: Domain.Passport;

	constructor(models: ModelsContext, passport: Domain.Passport) {
		this.mongoDataSource = new CommunityConfigDataSourceImpl(models.CommunityConfig);
		this.converter = new CommunityConfigConverter();
		this.passport = passport;
	}

	async getById(id: string): Promise<Domain.Contexts.Community.CommunityConfig.CommunityConfigEntityReference | null> {
		const result = await this.mongoDataSource.findById(id);
		if (!result) {
			return null;
		}
		return this.converter.toDomain(result as CommunityConfig, this.passport);
	}

	async getLatestEffective(subscriptionTier: string, asOf: Date = new Date()): Promise<Domain.Contexts.Community.CommunityConfig.CommunityConfigEntityReference | null> {
		const result = await this.mongoDataSource.aggregate([
			{
				$match: {
					subscriptionTier,
					effectiveDate: { $lte: asOf },
				},
			},
			{ $sort: { effectiveDate: -1 } },
			{ $limit: 1 },
		]);
		const latest = result[0];
		if (!latest) {
			return null;
		}
		return this.converter.toDomain(latest as CommunityConfig, this.passport);
	}
}

export const getCommunityConfigReadRepository = (models: ModelsContext, passport: Domain.Passport) => {
	return new CommunityConfigReadRepositoryImpl(models, passport);
};
