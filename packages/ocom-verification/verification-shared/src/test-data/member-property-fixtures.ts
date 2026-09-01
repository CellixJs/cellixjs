import { MongoClient, MongoServerError, ObjectId } from 'mongodb';

export type MemberPropertyFixtureAccountStatus = 'ACCEPTED' | 'CREATED' | 'REJECTED';

export interface MemberPropertyFixture {
	communityId: string;
	endUserId: string;
	memberName: string;
	firstName: string;
	lastName: string;
	accountStatus: MemberPropertyFixtureAccountStatus;
	canEditOwnProperty: boolean;
	canManageProperties: boolean;
	/** Omit the member role entirely for no-role access-denial arrangements. */
	hasRole?: boolean;
}

export interface MemberPropertyFixtureIds {
	memberId: string;
	roleId: string | null;
}

export interface MemberPropertyFixtureDatabase {
	connectionString: string;
	dbName: string;
}

export interface MemberPropertyPersistenceRecord {
	id: string;
	propertyName: string;
	ownerId: string | null;
	propertyType: string | null;
	listedInDirectory: boolean;
	isDeleted: boolean;
}

const emptyPermissions = {
	servicePermissions: { canManageServices: false },
	serviceTicketPermissions: {
		canCreateTickets: false,
		canManageTickets: false,
		canAssignTickets: false,
		canWorkOnTickets: false,
	},
	violationTicketPermissions: {
		canCreateTickets: false,
		canManageTickets: false,
		canAssignTickets: false,
		canWorkOnTickets: false,
	},
	communityPermissions: {
		canManageRolesAndPermissions: false,
		canManageCommunitySettings: false,
		canManageSiteContent: false,
		canManageMembers: false,
		canEditOwnMemberProfile: false,
		canEditOwnMemberAccounts: false,
	},
};

const MONGO_WRITE_RETRY_ATTEMPTS = 5;

const delay = (milliseconds: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, milliseconds));

/**
 * Community creation provisions its default role asynchronously. Retrying a
 * transient Mongo catalog write conflict keeps fixture setup deterministic
 * without hiding non-transient fixture defects.
 */
async function retryTransientCatalogWrite<T>(operation: () => Promise<T>): Promise<T> {
	for (let attempt = 1; attempt <= MONGO_WRITE_RETRY_ATTEMPTS; attempt += 1) {
		try {
			return await operation();
		} catch (error) {
			const retryable = error instanceof MongoServerError && error.code === 112;
			if (!retryable || attempt === MONGO_WRITE_RETRY_ATTEMPTS) {
				throw error;
			}
			await delay(attempt * 50);
		}
	}
	throw new Error('Transient Mongo fixture write retries were unexpectedly exhausted');
}

/**
 * Creates a community-scoped member and, unless explicitly omitted, an
 * end-user role for property scenarios.
 * The member is linked to an already-seeded end user so API and browser tests
 * can authenticate as the same fixture principal.
 */
export async function provisionMemberPropertyFixture(database: MemberPropertyFixtureDatabase, fixture: MemberPropertyFixture): Promise<MemberPropertyFixtureIds> {
	const client = new MongoClient(database.connectionString);
	try {
		await client.connect();
		const db = client.db(database.dbName);
		const now = new Date();
		const communityId = new ObjectId(fixture.communityId);
		const endUserId = new ObjectId(fixture.endUserId);
		let roleId: string | null = null;
		if (fixture.hasRole !== false) {
			const roleName = `${fixture.memberName} Property Role`;
			const role = await retryTransientCatalogWrite(
				async () =>
					await db.collection('roles').findOneAndReplace(
						{ roleType: 'end-user-roles', community: communityId, roleName },
						{
							roleType: 'end-user-roles',
							community: communityId,
							roleName,
							isDefault: false,
							permissions: {
								...emptyPermissions,
								propertyPermissions: {
									canManageProperties: fixture.canManageProperties,
									canEditOwnProperty: fixture.canEditOwnProperty,
								},
							},
							schemaVersion: '1.0.0',
							createdAt: now,
							updatedAt: now,
						},
						{ upsert: true, returnDocument: 'after' },
					),
			);
			if (!role?._id) {
				throw new Error(`Could not provision the "${roleName}" role for member Property fixtures`);
			}
			roleId = String(role._id);
		}

		const member = await retryTransientCatalogWrite(
			async () =>
				await db.collection('members').findOneAndReplace(
					{ community: communityId, memberName: fixture.memberName },
					{
						memberName: fixture.memberName,
						community: communityId,
						...(roleId ? { role: new ObjectId(roleId) } : {}),
						accounts: [
							{
								_id: new ObjectId(),
								firstName: fixture.firstName,
								lastName: fixture.lastName,
								user: endUserId,
								statusCode: fixture.accountStatus,
								createdBy: endUserId,
								createdAt: now,
								updatedAt: now,
							},
						],
						customViews: [],
						profile: {
							interests: [],
							showInterests: false,
							showEmail: false,
							showProfile: false,
							showLocation: false,
							showProperties: false,
						},
						schemaVersion: '1.0.0',
						createdAt: now,
						updatedAt: now,
					},
					{ upsert: true, returnDocument: 'after' },
				),
		);
		if (!member?._id) {
			throw new Error(`Could not provision the "${fixture.memberName}" member for member Property fixtures`);
		}

		return { roleId, memberId: String(member._id) };
	} finally {
		await client.close();
	}
}

/** Reads the persisted property fields that member acceptance scenarios must verify without exposing UI-only projections. */
export async function findMemberPropertyFixtureRecord(database: MemberPropertyFixtureDatabase, communityId: string, propertyName: string): Promise<MemberPropertyPersistenceRecord | undefined> {
	const client = new MongoClient(database.connectionString);
	try {
		await client.connect();
		const property = await client
			.db(database.dbName)
			.collection('properties')
			.findOne({ community: new ObjectId(communityId), propertyName });
		if (!property?._id) {
			return undefined;
		}
		return {
			id: String(property._id),
			propertyName: String(property.propertyName ?? ''),
			ownerId: property.owner ? String(property.owner) : null,
			propertyType: property.propertyType === undefined || property.propertyType === null ? null : String(property.propertyType),
			listedInDirectory: property.listedInDirectory === true,
			isDeleted: property.isDeleted === true,
		};
	} finally {
		await client.close();
	}
}
