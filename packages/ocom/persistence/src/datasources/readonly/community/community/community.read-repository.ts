import type { Models } from '@ocom/data-sources-mongoose-models';
import type { ModelsContext } from '../../../../index.ts';
import { CommunityDataSourceImpl, type CommunityDataSource } from './community.data.ts';
import type { FindOneOptions, FindOptions } from '../../mongo-data-source.ts';
import { CommunityConverter } from '../../../domain/community/community/community.domain-adapter.ts';
import type * as Community from '@ocom/domain/contexts/community';
import type { Passport } from '@ocom/domain/contexts/passport';

export interface CommunityReadRepository {
    getAll: (options?: FindOptions) => Promise<Community.CommunityEntityReference[]>;
    getById: (id: string, options?: FindOneOptions) => Promise<Community.CommunityEntityReference | null>;
    getByIdWithCreatedBy: (id: string, options?: FindOneOptions) => Promise<Community.CommunityEntityReference | null>;
    getByEndUserExternalId: (endUserId: string) => Promise<Community.CommunityEntityReference[]>;
}

export class CommunityReadRepositoryImpl implements CommunityReadRepository {
    private readonly mongoDataSource: CommunityDataSource;
    private readonly converter: CommunityConverter;
    private readonly passport: Passport;

    /**
     * Constructs a new CommunityReadRepositoryImpl.
     * @param models - The models context containing the Community model.
     * @param passport - The passport object for domain access.
     */
    constructor(models: ModelsContext, passport: Passport) {
        this.mongoDataSource = new CommunityDataSourceImpl(models.Community.Community);
        this.converter = new CommunityConverter();
        this.passport = passport;
    }

    /**
     * Retrieves all Community entities.
     * @param options - Optional find options for querying.
     * @returns A promise that resolves to an array of CommunityEntityReference objects.
     */
    async getAll(options?: FindOptions): Promise<Community.CommunityEntityReference[]> {
        const result = await this.mongoDataSource.find({}, options);
        return result.map(doc => this.converter.toDomain(doc, this.passport));
    }

    /**
     * Retrieves a Community entity by its ID.
     * @param id - The ID of the Community entity.
     * @param options - Optional find options for querying.
     * @returns A promise that resolves to a CommunityEntityReference object or null if not found.
     */
    async getById(id: string, options?: FindOneOptions): Promise<Community.CommunityEntityReference | null> {
        const result = await this.mongoDataSource.findById(id, options);
        if (!result) { return null; }
        return this.converter.toDomain(result, this.passport);
    }

    /**
     * Retrieves a Community entity by its ID, including the 'createdBy' field.
     * @param id - The ID of the Community entity.
     * @param options - Optional find options for querying.
     * @returns A promise that resolves to a CommunityEntityReference object or null if not found.
     */
    async getByIdWithCreatedBy(id: string, options?: FindOneOptions): Promise<Community.CommunityEntityReference | null> {
        const finalOptions: FindOneOptions = {
            ...options,
            populateFields: ['createdBy']
        };
        const result = await this.mongoDataSource.findById(id, finalOptions);
        if (!result) { return null; }
        return this.converter.toDomain(result, this.passport);
    }

    /**
     * Retrieves all Community entities for which the specified end-user is a member.
     * This performs an aggregation starting from the Community collection and joining Members,
     * then filtering by members.accounts.user == endUserId.
     */
    async getByEndUserExternalId(endUserId: string): Promise<Community.CommunityEntityReference[]> {
        // Starting from communities, join members, then resolve end-user by externalId
        // and keep communities where the member accounts include that end-user ObjectId.
        const pipeline = [
            // Join members of each community
            {
                $lookup: {
                    from: 'members',
                    localField: '_id',
                    foreignField: 'community',
                    as: 'm',
                },
            },
            { $unwind: '$m' },
            // Join all users referenced by the member's account user ids
            {
                $lookup: {
                    from: 'users',
                    localField: 'm.accounts.user',
                    foreignField: '_id',
                    as: 'accountUsers',
                },
            },
            // Filter those users to only the end-user with the provided externalId
            {
                $addFields: {
                    matchedEndUsers: {
                        $filter: {
                            input: '$accountUsers',
                            as: 'u',
                            cond: {
                                $and: [
                                    { $eq: ['$$u.userType', 'end-users'] },
                                    { $eq: ['$$u.externalId', endUserId] },
                                ],
                            },
                        },
                    },
                },
            },
            // Keep only communities where at least one matching end-user is found in member accounts
            { $match: { matchedEndUsers: { $ne: [] } } },
            // Deduplicate communities in case multiple members match
            { $group: { _id: '$_id', doc: { $first: '$$ROOT' } } },
            { $replaceRoot: { newRoot: '$doc' } },
            { $project: { m: 0, accountUsers: 0, matchedEndUsers: 0 } },
        ];
        const result = await this.mongoDataSource.aggregate(pipeline);
        return result.map((doc: Readonly<Models.Community.Community>) => this.converter.toDomain(doc, this.passport));
    }
}

export const getCommunityReadRepository = (
    models: ModelsContext,
    passport: Passport
) => {
    return new CommunityReadRepositoryImpl(models, passport);
};