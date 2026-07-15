import { type Document, MongoClient, ObjectId } from 'mongodb';
import { endUsers } from './end-users.ts';

export interface MongoDBSeedContext {
	connectionString: string;
	dbName: string;
}

export type MongoDBSeedDataFunction = (context: MongoDBSeedContext) => Promise<void>;

export interface EndUserRoleSeedDetails {
	communityId: string;
	roleName: string;
}

function toObjectId(id: string): ObjectId {
	return new ObjectId(id);
}

async function upsertSeedDocuments(client: MongoClient, dbName: string, collectionName: string, documents: Array<Document & { _id: ObjectId }>): Promise<void> {
	await client
		.db(dbName)
		.collection(collectionName)
		.bulkWrite(
			documents.map((document) => ({
				replaceOne: {
					filter: { _id: document._id },
					replacement: document,
					upsert: true,
				},
			})),
		);
}

export async function seedDatabase(context: MongoDBSeedContext): Promise<void> {
	const client = new MongoClient(context.connectionString);
	try {
		await client.connect();

		const users = endUsers.map((user) => ({
			...user,
			_id: toObjectId(user._id),
		}));
		await upsertSeedDocuments(client, context.dbName, 'users', users);
	} finally {
		await client.close();
	}
}

export async function seedEndUserRole(context: MongoDBSeedContext, details: EndUserRoleSeedDetails): Promise<string> {
	const client = new MongoClient(context.connectionString);
	const roleId = new ObjectId();
	const timestamp = new Date();
	try {
		await client.connect();
		await client
			.db(context.dbName)
			.collection('roles')
			.insertOne({
				_id: roleId,
				roleType: 'end-user-roles',
				community: toObjectId(details.communityId),
				roleName: details.roleName,
				isDefault: false,
				permissions: {
					servicePermissions: { canManageServices: false },
					serviceTicketPermissions: { canCreateTickets: false, canManageTickets: false, canAssignTickets: false, canWorkOnTickets: false },
					violationTicketPermissions: { canCreateTickets: false, canManageTickets: false, canAssignTickets: false, canWorkOnTickets: false },
					communityPermissions: {
						canManageRolesAndPermissions: false,
						canManageCommunitySettings: false,
						canManageSiteContent: false,
						canManageMembers: false,
						canEditOwnMemberProfile: false,
						canEditOwnMemberAccounts: false,
					},
					propertyPermissions: { canManageProperties: false, canEditOwnProperty: false },
				},
				schemaVersion: '1.0.0',
				createdAt: timestamp,
				updatedAt: timestamp,
			});
		return roleId.toHexString();
	} finally {
		await client.close();
	}
}
