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
	const maybeBuffer = value as { readUInt8?: unknown };
	if (value && typeof maybeBuffer.readUInt8 === 'function') {
		// Buffer-like
		try {
			return Buffer.isBuffer(value) ? value.toString('base64') : Buffer.from(value as Uint8Array).toString('base64');
		} catch (_e) {
			// fall through
		}
	}
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

function validateFilterOperators(obj: unknown, path = ''): void {
	if (obj === null || obj === undefined) return;
	if (Array.isArray(obj)) {
		for (let i = 0; i < obj.length; i++) validateFilterOperators(obj[i], `${path}[${i}]`);
		return;
	}
	if (typeof obj !== 'object') return;
	for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
		if (k.startsWith('$')) {
			if (k === '$where' || k === '$function' || k === '$expr') {
				throw userInputError(`Operator ${k} is not allowed in filter`);
			}
			if (!ALLOWED_OPERATORS.has(k)) {
				throw userInputError(`Unknown operator: ${k}`);
			}
		}
		validateFilterOperators(v, path ? `${path}.${k}` : k);
	}
}

const techAdminResolvers: Resolvers = {
	Query: {
		techAdminDatabaseCollections: async (_parent: unknown, _args: unknown, context: GraphContext, _info: GraphQLResolveInfo) => {
			const jwt = context.applicationServices.verifiedUser?.verifiedJwt;
			if (!jwt) {
				throw unauthorizedError();
			}

			const staff = await context.applicationServices.User.StaffUser.createIfNotExists({
				externalId: jwt.sub,
				firstName: jwt.given_name ?? '',
				lastName: jwt.family_name ?? '',
				email: jwt.email ?? '',
				aadRoles: jwt.roles ?? [],
			});

			const canView = staff.role?.permissions?.techAdminPermissions?.canViewDatabaseDocuments === true;
			const canManage = staff.role?.permissions?.techAdminPermissions?.canManageTechAdmin === true;
			if (!canView && !canManage) {
				throw unauthorizedError();
			}

			const db = mongoose.connection.db;
			if (!db) throw new Error('Database connection is not available');
			const cols = await db.listCollections().toArray();
			return cols.map((c) => (c as { name: string }).name).filter((n) => !n.startsWith('system.')).sort();
		},

		techAdminDatabaseDocuments: async (_parent: unknown, args, context: GraphContext, _info: GraphQLResolveInfo) => {
			const jwt = context.applicationServices.verifiedUser?.verifiedJwt;
			if (!jwt) {
				throw unauthorizedError();
			}

			const staff = await context.applicationServices.User.StaffUser.createIfNotExists({
				externalId: jwt.sub,
				firstName: jwt.given_name ?? '',
				lastName: jwt.family_name ?? '',
				email: jwt.email ?? '',
				aadRoles: jwt.roles ?? [],
			});

			const canView = staff.role?.permissions?.techAdminPermissions?.canViewDatabaseDocuments === true;
			const canManage = staff.role?.permissions?.techAdminPermissions?.canManageTechAdmin === true;
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
			}

			const pageSize = Math.min(Math.max(args.pageSize ?? 20, 1), 100);
			const page = Math.max(args.page ?? 1, 1);
			const skip = (page - 1) * pageSize;

			const coll = db.collection(args.collection);
			const totalCount = await coll.countDocuments(parsedFilter);
			const docs = await coll.find(parsedFilter).skip(skip).limit(pageSize).toArray();

			const documents = docs.map((d) => {
				const sanitized = normalizeBsonValue(d as Record<string, unknown>);
				return { id: String((d as { _id?: unknown })._id), json: JSON.stringify(sanitized) };
			});

			return { documents, totalCount };
		},
	},
};

export default techAdminResolvers;
