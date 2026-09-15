import { MongoClient, ObjectId } from 'mongodb';

interface CommunityConfigSeedContext {
	connectionString: string;
	dbName: string;
}

/** Mongo collection Task 2 should persist CommunityConfig documents into. */
export const COMMUNITY_CONFIG_COLLECTION = 'communityconfigs';

export const COMMUNITY_CONFIG_IDS = {
	proDefault: 'c00000000000000000000001',
	enterpriseDefault: 'c00000000000000000000002',
} as const;

export interface CommunityConfigSeedDocument {
	_id: string;
	subscriptionTier: 'pro' | 'enterprise';
	subscription: {
		pricePerMember: number;
		currency: string;
	};
	limits: {
		maxMembers: number;
		maxAdmins: number;
	};
	effectiveDate: Date;
	schemaVersion: string;
	createdAt: Date;
	updatedAt: Date;
}

const seededAt = new Date('2020-01-01T00:00:00.000Z');

export const communityConfigs: CommunityConfigSeedDocument[] = [
	{
		_id: COMMUNITY_CONFIG_IDS.proDefault,
		subscriptionTier: 'pro',
		subscription: {
			pricePerMember: 1000,
			currency: 'USD',
		},
		limits: {
			maxMembers: 50,
			maxAdmins: 2,
		},
		effectiveDate: seededAt,
		schemaVersion: '1.0.0',
		createdAt: seededAt,
		updatedAt: seededAt,
	},
	{
		_id: COMMUNITY_CONFIG_IDS.enterpriseDefault,
		subscriptionTier: 'enterprise',
		subscription: {
			pricePerMember: 2000,
			currency: 'USD',
		},
		limits: {
			maxMembers: 200,
			maxAdmins: 10,
		},
		effectiveDate: seededAt,
		schemaVersion: '1.0.0',
		createdAt: seededAt,
		updatedAt: seededAt,
	},
];

export async function upsertCommunityConfigs(context: CommunityConfigSeedContext, documents: CommunityConfigSeedDocument[] = communityConfigs): Promise<void> {
	if (documents.length === 0) {
		return;
	}

	const client = new MongoClient(context.connectionString);
	try {
		await client.connect();
		await client
			.db(context.dbName)
			.collection(COMMUNITY_CONFIG_COLLECTION)
			.bulkWrite(
				documents.map((document) => ({
					replaceOne: {
						filter: { _id: new ObjectId(document._id) },
						replacement: {
							...document,
							_id: new ObjectId(document._id),
						},
						upsert: true,
					},
				})),
			);
	} finally {
		await client.close();
	}
}
