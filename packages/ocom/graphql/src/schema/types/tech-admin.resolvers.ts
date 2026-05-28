import mongoose from 'mongoose';
import { GraphQLError, type GraphQLResolveInfo } from 'graphql';
import type { Resolvers } from '../builder/generated.ts';
import type { GraphContext } from '../context.ts';
 
function unauthorizedError() {
    return new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHENTICATED' } });
}
 
function userInputError(message: string) {
    return new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });
}
 
function normalizeBsonValue(value: unknown): unknown {
	if (value === null || value === undefined) return value;
	if (Array.isArray(value)) return value.map(normalizeBsonValue);
	if (value instanceof Date) return value.toISOString();
	// ObjectId
	if (value && typeof (value as { toHexString?: unknown }).toHexString === 'function') return (value as { toHexString: () => string }).toHexString();
	// Decimal128
	if (value && (value as { _bsontype?: unknown })._bsontype === 'Decimal128') return (value as { toString: () => string }).toString();
	// Buffer
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
 
const ALLOWED_OPERATORS = new Set([
    '$eq',
    '$in',
    '$gt',
    '$gte',
    '$lt',
    '$lte',
    '$exists',
    '$regex',
    '$and',
    '$or',
    '$not',
]);

function validateOperatorKey(key: string): void {
	if (!key.startsWith('$')) return;
	if (key === '$where' || key === '$function' || key === '$expr') {
		throw userInputError(`Operator ${key} is not allowed in filter`);
	}
	if (!ALLOWED_OPERATORS.has(key)) {
		throw userInputError(`Unknown operator: ${key}`);
	}
}

function validateFilterOperators(obj: unknown, path = ''): void {
	if (obj === null || obj === undefined) return;
	if (Array.isArray(obj)) {
		for (let i = 0; i < obj.length; i++) validateFilterOperators(obj[i], `${path}[${i}]`);
		return;
	}
	if (typeof obj !== 'object') return;
	for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
		validateOperatorKey(k);
		validateFilterOperators(v, path ? `${path}.${k}` : k);
	}
}

const OBJECT_ID_KEYS = new Set(['_id', 'role']);
const objectIdPattern = /^[a-fA-F0-9]{24}$/;

function compareAlphabetically(a: string, b: string): number {
	return a.localeCompare(b, 'en', { sensitivity: 'base' });
}

function getObjectIdHex(value: unknown): string | null {
	if (!value) return null;
	if (typeof value === 'string' && objectIdPattern.test(value)) {
		return value;
	}
	if (typeof value === 'object') {
		if (value instanceof mongoose.Types.ObjectId) {
			return value.toHexString();
		}
		const maybeHex = value as { toHexString?: unknown };
		if (typeof maybeHex.toHexString === 'function') {
			return maybeHex.toHexString();
		}
		const maybeBson = value as { _bsontype?: unknown; toString?: unknown };
		if (maybeBson._bsontype === 'ObjectId' && typeof maybeBson.toString === 'function') {
			return maybeBson.toString();
		}
	}
	return null;
}

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
        // biome-ignore lint:useLiteralKeys
		const roleId = getObjectIdHex(doc['role']);
		if (roleId) roleIds.add(roleId);
	}
	if (roleIds.size === 0) return docs;

	const roleObjectIds = [...roleIds].map((id) => new mongoose.Types.ObjectId(id));
	const roles = await db.collection('roles').find({ _id: { $in: roleObjectIds } }, { projection: { roleName: 1, enterpriseAppRole: 1 } }).toArray();
	const roleMap = new Map(
		roles.map((role) => [
			String(role._id),
			{
				// biome-ignore lint:useLiteralKeys
				roleName: role['roleName'] ?? null,
				// biome-ignore lint:useLiteralKeys
				enterpriseAppRole: role['enterpriseAppRole'] ?? null,
			},
		]),
	);

	return docs.map((doc) => {
        // biome-ignore lint:useLiteralKeys
		const roleId = getObjectIdHex(doc['role']);
		if (!roleId) return doc;
		const roleInfo = roleMap.get(roleId);
		if (!roleInfo) return doc;
		return { ...doc, role: { id: roleId, ...roleInfo } };
	});
}

const techAdminResolvers: Resolvers = {
	Query: {
		techAdminDatabaseCollections: async (_parent: unknown, _args: unknown, context: GraphContext, _info: GraphQLResolveInfo) => {
			const jwt = context.applicationServices.verifiedUser?.verifiedJwt;
			if (!jwt) {
				throw unauthorizedError();
                }

			const staff = await context.applicationServices.User.StaffUser.queryByExternalId({ externalId: jwt.sub });

			const canView = staff?.role?.permissions?.techAdminPermissions?.canViewDatabaseDocuments === true;
			const canManage = staff?.role?.permissions?.techAdminPermissions?.canManageTechAdmin === true;
			if (!canView && !canManage) {
				throw unauthorizedError();
			}

			const db = mongoose.connection.db;
			if (!db) throw new Error('Database connection is not available');
			const cols = await db.listCollections().toArray();
			return cols.map((c) => (c as { name: string }).name).filter((n) => !n.startsWith('system.')).sort(compareAlphabetically);
		},

		techAdminDatabaseDocuments: async (_parent: unknown, args, context: GraphContext, _info: GraphQLResolveInfo) => {
			const jwt = context.applicationServices.verifiedUser?.verifiedJwt;
			if (!jwt) {
				throw unauthorizedError();
			}

			const staff = await context.applicationServices.User.StaffUser.queryByExternalId({ externalId: jwt.sub });

			const canView = staff?.role?.permissions?.techAdminPermissions?.canViewDatabaseDocuments === true;
			const canManage = staff?.role?.permissions?.techAdminPermissions?.canManageTechAdmin === true;
			if (!canView && !canManage) {
				throw unauthorizedError();
			}

			// Validate collection name
			if (!/^[a-zA-Z0-9_-]+$/.test(args.collection)) {
				throw userInputError('Invalid collection name');
			}

			const db = mongoose.connection.db;
			if (!db) throw new Error('Database connection is not available');
			const cols = await db.listCollections().toArray();
			const available = cols.map((c) => (c as { name: string }).name).filter((n) => !n.startsWith('system.'));
			if (!available.includes(args.collection)) {
				throw userInputError('Collection not found or not allowed');
			}

			let parsedFilter: Record<string, unknown> = {};
			if (args.filter) {
				try {
					parsedFilter = JSON.parse(args.filter);
				} catch (_e) {
					throw userInputError('Invalid filter JSON');
				}
				// Validate operators
				validateFilterOperators(parsedFilter);
				parsedFilter = normalizeFilterObjectIds(parsedFilter) as Record<string, unknown>;
			}

			const pageSize = Math.min(Math.max(args.pageSize ?? 20, 1), 100);
			const page = Math.max(args.page ?? 1, 1);
			const skip = (page - 1) * pageSize;

			const coll = db.collection(args.collection);
			const totalCount = await coll.countDocuments(parsedFilter);
			const docs = await coll.find(parsedFilter).skip(skip).limit(pageSize).toArray();
			const enrichedDocs = await enrichStaffUserRoles(args.collection, docs as Record<string, unknown>[], db);

			const documents = enrichedDocs.map((d) => {
				const sanitized = normalizeBsonValue(d as Record<string, unknown>);
				return { id: String((d as { _id?: unknown })._id), json: JSON.stringify(sanitized) };
			});

			return { documents, totalCount };
		},
	},
};
 
export default techAdminResolvers;
 