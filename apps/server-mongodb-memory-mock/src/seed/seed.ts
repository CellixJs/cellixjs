import type { Community } from '@ocom/data-sources-mongoose-models/community';
import type { Member } from '@ocom/data-sources-mongoose-models/member';
import type { Property } from '@ocom/data-sources-mongoose-models/property';
import type { EndUserRole } from '@ocom/data-sources-mongoose-models/role/end-user-role';
import type { Service } from '@ocom/data-sources-mongoose-models/service';
import type { EndUser } from '@ocom/data-sources-mongoose-models/user/end-user';
import { ObjectId } from 'mongodb';
import type { Connection } from 'mongoose';
import { communities } from './communities.ts';
import { endUsers } from './end-users.ts';
import { members } from './members.ts';
import { properties } from './properties.ts';
import { endUserRoles } from './roles.ts';
import { services } from './services.ts';

function toObjectId(id: string) {
	return new ObjectId(id);
}

async function upsertSeedDocuments(connection: Connection, collectionName: string, documents: Array<Record<string, unknown> & { _id: ObjectId }>) {
	await connection.collection(collectionName).bulkWrite(
		documents.map((document) => ({
			replaceOne: {
				filter: { _id: document._id },
				replacement: document,
				upsert: true,
			},
		})),
	);
}

export async function seedDatabase(connection: Connection): Promise<void> {
	const users = endUsers.map((u: EndUser) => ({
		...u,
		_id: toObjectId(u._id as string),
	}));
	await upsertSeedDocuments(connection, 'users', users);
	console.log(`  Seeded ${users.length} users`);

	const comms = communities.map((c: Community) => ({
		...c,
		_id: toObjectId(c._id as string),
		createdBy: toObjectId(String(c.createdBy)),
	}));
	await upsertSeedDocuments(connection, 'communities', comms);
	console.log(`  Seeded ${comms.length} communities`);

	const roles = endUserRoles.map((r: EndUserRole) => ({
		...r,
		_id: toObjectId(r._id as string),
		community: toObjectId(String(r.community)),
	}));
	await upsertSeedDocuments(connection, 'roles', roles);
	console.log(`  Seeded ${roles.length} roles`);

	const mems = members.map((m: Member) => ({
		...m,
		_id: toObjectId(m._id as string),
		community: toObjectId(String(m.community)),
		role: m.role ? toObjectId(String(m.role)) : undefined,
		accounts: m.accounts.map((a) => ({
			...a,
			user: toObjectId(String(a.user)),
			createdBy: toObjectId(String(a.createdBy)),
		})),
	}));
	await upsertSeedDocuments(connection, 'members', mems);
	console.log(`  Seeded ${mems.length} members`);

	const props = properties.map((p: Property) => ({
		...p,
		_id: toObjectId(p._id as string),
		community: toObjectId(String(p.community)),
		owner: p.owner ? toObjectId(String(p.owner)) : undefined,
	}));
	await upsertSeedDocuments(connection, 'properties', props);
	console.log(`  Seeded ${props.length} properties`);

	const svcs = services.map((s: Service) => ({
		...s,
		_id: toObjectId(s._id as string),
		community: toObjectId(String(s.community)),
	}));
	await upsertSeedDocuments(connection, 'services', svcs);
	console.log(`  Seeded ${svcs.length} services`);

	console.log('Seeded mock MongoDB memory server with initial data.');
}
