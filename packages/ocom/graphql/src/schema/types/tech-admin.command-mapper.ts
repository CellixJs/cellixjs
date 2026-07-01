type DatabaseDocumentsQueryArgs = {
	collection: string;
	filter?: string | null | undefined;
	page?: number | null | undefined;
	pageSize?: number | null | undefined;
};

const ALLOWED_OPERATORS = new Set(['$eq', '$in', '$gt', '$gte', '$lt', '$lte', '$exists', '$regex', '$and', '$or', '$not']);

function validateOperatorKey(key: string): void {
	if (!key.startsWith('$')) return;
	if (key === '$where' || key === '$function' || key === '$expr') {
		throw new Error(`Operator ${key} is not allowed in filter`);
	}
	if (!ALLOWED_OPERATORS.has(key)) {
		throw new Error(`Unknown operator: ${key}`);
	}
}

function validateFilterOperators(obj: unknown): void {
	if (obj === null || obj === undefined) return;
	if (Array.isArray(obj)) {
		for (const item of obj) validateFilterOperators(item);
		return;
	}
	if (typeof obj !== 'object') return;
	for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
		validateOperatorKey(k);
		validateFilterOperators(v);
	}
}

type DatabaseDocumentsQueryCommand = {
	collection: string;
	filter: Record<string, unknown>;
	page: number;
	pageSize: number;
};

export function buildDatabaseDocumentsQueryCommand(args: DatabaseDocumentsQueryArgs): DatabaseDocumentsQueryCommand {
	if (!/^[a-zA-Z0-9_-]+$/.test(args.collection)) {
		throw new Error('Invalid collection name');
	}

	let parsedFilter: Record<string, unknown> = {};
	if (args.filter) {
		try {
			parsedFilter = JSON.parse(args.filter) as Record<string, unknown>;
		} catch {
			throw new Error('Invalid filter JSON');
		}
		validateFilterOperators(parsedFilter);
	}

	return {
		collection: args.collection,
		filter: parsedFilter,
		pageSize: Math.min(Math.max(args.pageSize ?? 20, 1), 100),
		page: Math.max(args.page ?? 1, 1),
	};
}
