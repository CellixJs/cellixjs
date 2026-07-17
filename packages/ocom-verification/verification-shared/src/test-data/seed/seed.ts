import { type Document, MongoClient, ObjectId } from 'mongodb';
import { communities } from './communities.ts';
import { endUserRoles } from './end-user-roles.ts';
import { endUsers } from './end-users.ts';
import { members } from './members.ts';
import { staffRoles } from './staff-roles.ts';
import { staffUsers } from './staff-users.ts';

export interface MongoDBSeedContext {
	connectionString: string;
	dbName: string;
}

export type MongoDBSeedDataFunction = (context: MongoDBSeedContext) => Promise<void>;

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
		const staff = staffUsers.map((user) => ({
			...user,
			_id: toObjectId(user._id),
			role: toObjectId(user.role),
		}));
		const roles = staffRoles.map((role) => ({
			...role,
			_id: toObjectId(role._id),
		}));
		const memberRoles = endUserRoles.map((role) => ({
			...role,
			_id: toObjectId(role._id),
			community: toObjectId(role.community),
		}));
		const communityDocuments = communities.map((community) => ({
			...community,
			_id: toObjectId(community._id),
			createdBy: toObjectId(community.createdBy),
		}));
		const memberDocuments = members.map((member) => ({
			...member,
			_id: toObjectId(member._id),
			community: toObjectId(member.community),
			role: toObjectId(member.role),
			accounts: member.accounts.map((account) => ({
				...account,
				_id: toObjectId(account._id),
				user: toObjectId(account.user),
				createdBy: toObjectId(account.createdBy),
			})),
		}));
		await upsertSeedDocuments(client, context.dbName, 'users', [...users, ...staff]);
		await upsertSeedDocuments(client, context.dbName, 'roles', [...roles, ...memberRoles]);
		await upsertSeedDocuments(client, context.dbName, 'communities', communityDocuments);
		await upsertSeedDocuments(client, context.dbName, 'members', memberDocuments);
	} finally {
		await client.close();
	}
}
