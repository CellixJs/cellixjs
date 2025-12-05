import { MongooseSeedwork } from '@cellix/mongoose-seedwork'; 
import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { MemberConverter } from '../../../domain/community/member/member.domain-adapter.ts';
import type { FindOneOptions, FindOptions } from '../../mongo-data-source.ts';
import { type MemberDataSource, MemberDataSourceImpl } from './member.data.ts';



export interface MemberReadRepository {
    getByCommunityId: (communityId: string, options?: FindOptions) => Promise<Domain.Contexts.Community.Member.MemberEntityReference[]>;
    getById: (id: string, options?: FindOneOptions) => Promise<Domain.Contexts.Community.Member.MemberEntityReference | null>;
    getByIdWithRole: (id: string, options?: FindOneOptions) => Promise<Domain.Contexts.Community.Member.MemberEntityReference | null>;
     /**
     * Retrieves all Member entities for a given end-user external ID.
     * Finds members whose accounts reference a user with the specified external ID.
     *
     * @param externalId - The external ID of the end user to match.
     * @returns A promise that resolves to an array of MemberEntityReference objects for the matching end user.
     */
    getMembersForEndUserExternalId: (externalId: string) => Promise<Domain.Contexts.Community.Member.MemberEntityReference[]>;
    isAdmin: (id: string) => Promise<boolean>;
}

export class MemberReadRepositoryImpl implements MemberReadRepository {
    private readonly mongoDataSource: MemberDataSource;
    private readonly converter: MemberConverter;
    private readonly passport: Domain.Passport;

    /**
     * Constructs a new MemberReadRepositoryImpl.
     * @param models - The models context containing the Member model.
     * @param passport - The passport object for domain access.
     */
    constructor(models: ModelsContext, passport: Domain.Passport) {
        this.mongoDataSource = new MemberDataSourceImpl(models.Member);
        this.converter = new MemberConverter();
        this.passport = passport;
    }

    /**
     * Retrieves all Member entities for a given community ID.
     * @param communityId - The ID of the community to retrieve members for.
     * @param options - Optional find options for querying.
     * @returns A promise that resolves to an array of MemberEntityReference objects that belong to the specified community.
     */
    async getByCommunityId(communityId: string, options?: FindOptions): Promise<Domain.Contexts.Community.Member.MemberEntityReference[]> {
        const result = await this.mongoDataSource.find({ community: new MongooseSeedwork.ObjectId(communityId) }, options);
        return result.map(doc => this.converter.toDomain(doc, this.passport));
    }

    /**
     * Retrieves a Member entity by its ID.
     * @param id - The ID of the Member entity.
     * @param options - Optional find options for querying.
     * @returns A promise that resolves to a MemberEntityReference object or null if not found.
     */
    async getById(id: string, options?: FindOneOptions): Promise<Domain.Contexts.Community.Member.MemberEntityReference | null> {
        const result = await this.mongoDataSource.findById(id, options);
        if (!result) { return null; }
        return this.converter.toDomain(result, this.passport);
    }

    /**
     * Retrieves a Member entity by its ID, including the 'createdBy' field.
     * @param id - The ID of the Member entity.
     * @param options - Optional find options for querying.
     * @returns A promise that resolves to a MemberEntityReference object or null if not found.
     */
    async getByIdWithRole(id: string, options?: FindOneOptions): Promise<Domain.Contexts.Community.Member.MemberEntityReference | null> {
        const finalOptions: FindOneOptions = {
            ...options,
            populateFields: ['role']
        };
        const result = await this.mongoDataSource.findById(id, finalOptions);
        if (!result) { return null; }
        return this.converter.toDomain(result, this.passport);
    }

    async getMembersForEndUserExternalId(externalId: string): Promise<Domain.Contexts.Community.Member.MemberEntityReference[]> {
        // Goal: Given an EndUser's externalId (unique in `users` where userType === 'end-users'),
        // return Members whose accounts reference that EndUser's _id.
        // We handle both schemas:
        //  - accounts.user: ObjectId[]
        //  - accounts.user.id: ObjectId[] (nested subdocuments)

    const pipeline = [
        // 1) Consolidate possible account user ObjectIds
        {
            $addFields: {
                __candidateUserIds: {
                    $setUnion: [
                        { $ifNull: [ '$accounts.user', [] ] },
                        { $ifNull: [ '$accounts.user.id', [] ] }
                    ]
                }
            }
        },
        // 2) Join to users using localField/foreignField (no `let`)
        {
            $lookup: {
                from: 'users',
                localField: '__candidateUserIds',
                foreignField: '_id',
                as: '__users'
            }
        },
        // 3) Keep only members where any joined user matches the discriminator + externalId
        {
            $match: {
                '__users.userType': 'end-users',
                '__users.externalId': externalId
            }
        },
        // 4) Clean up temporary arrays
        { $project: { __candidateUserIds: 0, __users: 0 } }
    ];

        const result = await this.mongoDataSource.aggregate(pipeline);
        return result.map((doc) => this.converter.toDomain(doc, this.passport));
    }

    async isAdmin(id: string): Promise<boolean> {
        const member = await this.getByIdWithRole(id);
        const p = member?.role.permissions;
        return (
            p?.serviceTicketPermissions?.canWorkOnTickets ||
            p?.serviceTicketPermissions?.canManageTickets ||
            p?.serviceTicketPermissions?.canAssignTickets ||
            p?.communityPermissions?.canManageEndUserRolesAndPermissions ||
            p?.communityPermissions?.canManageCommunitySettings ||
            p?.communityPermissions?.canManageSiteContent ||
            p?.communityPermissions?.canManageMembers ||
            p?.propertyPermissions?.canManageProperties ||
            p?.violationTicketPermissions?.canManageTickets ||
            p?.violationTicketPermissions?.canAssignTickets ||
            p?.violationTicketPermissions?.canWorkOnTickets ||
            p?.violationTicketPermissions?.canCreateTickets || 
            false
        );
    }
}

type MemberReadRepositoryType = (
    models: ModelsContext,
    passport: Domain.Passport
) => MemberReadRepository;

export const getMemberReadRepository: MemberReadRepositoryType = (
    models: ModelsContext,
    passport: Domain.Passport
) => {
    return new MemberReadRepositoryImpl(models, passport);
};