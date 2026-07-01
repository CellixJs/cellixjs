import mongoose from 'mongoose';

function normalizeBsonValue(value: unknown): unknown {
	if (value === null || value === undefined) return value;
	if (Array.isArray(value)) return value.map(normalizeBsonValue);
	if (value instanceof Date) return value.toISOString();
	if (value && typeof (value as { toHexString?: unknown }).toHexString === 'function') return (value as { toHexString: () => string }).toHexString();
	if (value && (value as { _bsontype?: unknown })._bsontype === 'Decimal128') return (value as { toString: () => string }).toString();
	if (Buffer.isBuffer(value)) return value.toString('base64');
	if (value instanceof Uint8Array) return Buffer.from(value).toString('base64');
	if (typeof value === 'object') {
		const out: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
			out[k] = normalizeBsonValue(v);
		}
		return out;
	}
	return value;
}

const OBJECT_ID_KEYS = new Set(['_id', 'role']);
const objectIdPattern = /^[a-fA-F0-9]{24}$/;

function normalizeObjectIdValue(value: unknown): unknown {
	if (typeof value === 'string' && objectIdPattern.test(value)) {
		return new mongoose.Types.ObjectId(value);
	}
	if (Array.isArray(value)) {
		return value.map((item) => normalizeObjectIdValue(item));
	}
	if (value && typeof value === 'object') {
		const out: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
			out[k] = normalizeObjectIdValue(v);
		}
		return out;
	}
	return value;
}

function normalizeFilterObjectIds(obj: unknown): unknown {
	if (obj === null || obj === undefined) return obj;
	if (Array.isArray(obj)) {
		return obj.map((item) => normalizeFilterObjectIds(item));
	}
	if (typeof obj !== 'object') return obj;
	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
		if (k.startsWith('$')) {
			out[k] = normalizeFilterObjectIds(v);
			continue;
		}
		if (OBJECT_ID_KEYS.has(k)) {
			out[k] = normalizeObjectIdValue(v);
			continue;
		}
		out[k] = normalizeFilterObjectIds(v);
	}
	return out;
}

async function enrichStaffUserRoles(collection: string, docs: Record<string, unknown>[], db: mongoose.mongo.Db): Promise<Record<string, unknown>[]> {
	if (collection !== 'users') return docs;
	const roleIds = new Set<string>();
	for (const doc of docs) {
        //biome-ignore lint:useLiteralKeys
		const role = doc['role'];
		if (typeof role === 'string' && role.length === 24) roleIds.add(role);
		if (role && typeof role === 'object' && typeof (role as { id?: unknown }).id === 'string') roleIds.add((role as { id: string }).id);
	}
	if (roleIds.size === 0) return docs;
	const roleObjectIds = [...roleIds].map((id) => new mongoose.Types.ObjectId(id));
	const roles = await db.collection('roles').find({ _id: { $in: roleObjectIds } }, { projection: { roleName: 1, enterpriseAppRole: 1 } }).toArray();
	const roleMap = new Map(
		roles.map((role) => [
			String(role._id),
			{
                //biome-ignore lint:useLiteralKeys
				roleName: role['roleName'] ?? null,
                //biome-ignore lint:useLiteralKeys
				enterpriseAppRole: role['enterpriseAppRole'] ?? null,
			},
		]),
	);
	return docs.map((doc) => {
        //biome-ignore lint:useLiteralKeys
		const roleId = typeof doc['role'] === 'string' ? doc['role'] : (doc['role'] as { id?: string } | undefined)?.id ?? null;
		if (!roleId) return doc;
		const roleInfo = roleMap.get(roleId);
		if (!roleInfo) return doc;
		return { ...doc, role: { id: roleId, ...roleInfo } };
	});
}

import type { DatabaseDocumentsQueryCommand } from './database-documents.command-mapper.ts';

type DatabaseDocument = {
	id: string;
	json: string;
};

type DatabaseDocumentPage = {
	documents: DatabaseDocument[];
	totalCount: number;
};

export const DatabaseDocuments = () => {
	return async (command: DatabaseDocumentsQueryCommand): Promise<DatabaseDocumentPage> => {
		const { db } = mongoose.connection;
		if (!db) throw new Error('Database connection is not available');
		const skip = (command.page - 1) * command.pageSize;
		const coll = db.collection(command.collection);
		const filter = normalizeFilterObjectIds(command.filter) as Record<string, unknown>;
		const totalCount = await coll.countDocuments(filter);
		const docs = await coll.find(filter).skip(skip).limit(command.pageSize).toArray();
		const enrichedDocs = await enrichStaffUserRoles(command.collection, docs as Record<string, unknown>[], db);
		return {
			totalCount,
			documents: enrichedDocs.map((doc) => {
				const sanitized = normalizeBsonValue(doc as Record<string, unknown>);
                //biome-ignore lint:useLiteralKeys
				return { id: String(doc['_id']), json: JSON.stringify(sanitized) };
			}),
		};
	};
};
