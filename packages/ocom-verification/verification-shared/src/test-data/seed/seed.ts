import { type Document, MongoClient, ObjectId } from 'mongodb';
import { endUsers } from './end-users.ts';
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
		const roles = staffRoles.map((role) => ({
			...role,
			_id: toObjectId(role._id),
		}));
		const staff = staffUsers.map((user) => ({
			...user,
			_id: toObjectId(user._id),
			role: toObjectId(user.role),
		}));
		await upsertSeedDocuments(client, context.dbName, 'users', [...users, ...staff]);
		await upsertSeedDocuments(client, context.dbName, 'roles', roles);
	} finally {
		await client.close();
	}
}
