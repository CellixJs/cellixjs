import { type RateLimitCounterDecision, type RateLimitCounterRequest, type RateLimitPolicy, ServiceRateLimiting } from '@cagematch/rate-limiting';
import { type Collection, type Filter, MongoClient, type UpdateFilter } from 'mongodb';

interface MongoRateLimitDocument {
	_id: string;
	count: number;
	expiresAt: Date;
}

/**
 * MongoDB fixed-window rate-limiting service.
 *
 * The service reads `COSMOSDB_CONNECTION_STRING`, creates one MongoDB client,
 * and reuses that client for its full lifecycle. The application remains
 * responsible for defining the `rate-limits` collection schema and TTL index.
 *
 * @example
 * ```ts
 * process.env.COSMOSDB_CONNECTION_STRING = 'mongodb://127.0.0.1:27017/application';
 * const service = new ServiceMongoRateLimiting([
 *   { feature: 'document.create', limit: 5, windowMs: 60_000 },
 * ]);
 * ```
 */
export class ServiceMongoRateLimiting extends ServiceRateLimiting {
	private readonly client: MongoClient;
	private collection: Collection<MongoRateLimitDocument> | undefined;

	constructor(policies: readonly RateLimitPolicy[]) {
		super(policies);
		const env = process.env as Partial<Record<'COSMOSDB_CONNECTION_STRING', string>>;
		const connectionString = env.COSMOSDB_CONNECTION_STRING;
		if (!connectionString || connectionString.trim().length === 0) throw new Error('COSMOSDB_CONNECTION_STRING is required for MongoDB rate limiting');
		this.client = new MongoClient(connectionString);
	}

	protected override async onStartUp(): Promise<void> {
		await this.client.connect();
		this.collection = this.client.db().collection<MongoRateLimitDocument>('rate-limits');
	}

	protected override async onShutDown(): Promise<void> {
		this.collection = undefined;
		await this.client.close();
	}

	protected override async consumeCounter(request: RateLimitCounterRequest): Promise<RateLimitCounterDecision> {
		if (!this.collection) throw new Error('ServiceMongoRateLimiting collection is not available');
		const resetAt = new Date(Math.floor(request.now.getTime() / request.windowMs) * request.windowMs + request.windowMs);
		const filter: Filter<MongoRateLimitDocument> = { _id: request.key, count: { $lte: request.limit - request.cost } };
		const update: UpdateFilter<MongoRateLimitDocument> = {
			$inc: { count: request.cost },
			$setOnInsert: { expiresAt: resetAt },
		};

		let counter: MongoRateLimitDocument | null;
		try {
			counter = await this.collection.findOneAndUpdate(filter, update, { upsert: true, returnDocument: 'after' });
		} catch (error) {
			if (!isDuplicateKeyError(error)) throw error;
			counter = await this.collection.findOneAndUpdate(filter, update, { returnDocument: 'after' });
		}

		if (!counter) {
			const current = await this.collection.findOne({ _id: request.key });
			return { allowed: false, remaining: Math.max(0, request.limit - (current?.count ?? request.limit)), resetAt };
		}
		return { allowed: true, remaining: Math.max(0, request.limit - counter.count), resetAt };
	}
}

function isDuplicateKeyError(error: unknown): error is { code: 11000 } {
	return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}
