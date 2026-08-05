import {
	createRateLimitingService,
	type RateLimitPolicy,
	type RateLimitRequest,
	type RateLimitStore,
	type RateLimitStoreDecision,
	type RateLimitStoreRequest,
	type RateLimitingService,
	type RateLimitingServiceImplementation,
} from '@cagematch/rate-limiting';

export interface MongoRateLimitDocument {
	_id: string;
	count: number;
	expiresAt: Date;
}

/** The small MongoDB surface needed by the counter, kept driver-version neutral. */
export interface MongoRateLimitCollection {
	createIndex(index: { expiresAt: 1 }, options: { expireAfterSeconds: 0; name: string }): Promise<unknown>;
	findOneAndUpdate(filter: unknown, update: unknown, options?: unknown): Promise<MongoRateLimitDocument | null>;
}

export interface MongoRateLimitStoreOptions {
	readonly ttlIndexName?: string;
}

/** Minimal database surface used to create the contender-owned collection. */
export interface MongoRateLimitDatabase {
	collection(name: string): unknown;
}

export interface MongoRateLimitingOptions extends MongoRateLimitStoreOptions {
	readonly collectionName?: string;
}

type MongoCollectionProvider = MongoRateLimitCollection | (() => MongoRateLimitCollection | Promise<MongoRateLimitCollection>);
type MongoDatabaseProvider = MongoRateLimitDatabase | (() => MongoRateLimitDatabase | Promise<MongoRateLimitDatabase>);

/** Atomic MongoDB fixed-window counter with TTL cleanup. */
export class MongoRateLimitStore implements RateLimitStore {
	private readonly collectionProvider: MongoCollectionProvider;
	private readonly options: MongoRateLimitStoreOptions;
	private collectionInternal: MongoRateLimitCollection | undefined;
	private collectionReady: Promise<MongoRateLimitCollection> | undefined;

	constructor(collectionProvider: MongoCollectionProvider, options: MongoRateLimitStoreOptions = {}) {
		this.collectionProvider = collectionProvider;
		this.options = options;
	}

	public async startUp(): Promise<void> {
		// A provider is intentionally resolved lazily. Cellix starts infrastructure
		// services in parallel, so a provider backed by ServiceMongoose may not be
		// ready during this service's startUp call.
		if (typeof this.collectionProvider !== 'function') {
			await this.ensureCollection();
		}
	}

	public shutDown(): Promise<void> {
		this.collectionInternal = undefined;
		this.collectionReady = undefined;
		return Promise.resolve();
	}

	public async consume(request: RateLimitStoreRequest): Promise<RateLimitStoreDecision> {
		const collection = await this.ensureCollection();
		const resetAt = new Date(Math.floor(request.now.getTime() / request.windowMs) * request.windowMs + request.windowMs);
		const filter = { _id: request.key, count: { $lte: request.limit - request.cost } };
		const update = {
			$inc: { count: request.cost },
			$setOnInsert: { expiresAt: resetAt },
		};

		let document: MongoRateLimitDocument | null;
		try {
			document = await collection.findOneAndUpdate(filter, update, { upsert: true, returnDocument: 'after' });
		} catch (error) {
			if (!isDuplicateKeyError(error)) {
				throw error;
			}
			// A concurrent first write can win the upsert race. Retrying without
			// upsert makes the operation converge on the existing counter.
			document = await collection.findOneAndUpdate(filter, update, { returnDocument: 'after' });
		}

		if (!document) {
			return { allowed: false, remaining: 0, resetAt };
		}

		return { allowed: true, remaining: Math.max(0, request.limit - document.count), resetAt };
	}

	private async ensureCollection(): Promise<MongoRateLimitCollection> {
		if (this.collectionInternal) {
			return this.collectionInternal;
		}
		this.collectionReady ??= this.initializeCollection();
		return await this.collectionReady;
	}

	private async initializeCollection(): Promise<MongoRateLimitCollection> {
		const collection = await resolveCollection(this.collectionProvider);
		await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: this.options.ttlIndexName ?? 'cagematch-rate-limit-expires-at' });
		this.collectionInternal = collection;
		return collection;
	}
}

/** MongoDB contender implementing the shared rate-limiting lifecycle contract. */
export class ServiceMongoRateLimiting implements RateLimitingServiceImplementation {
	private readonly store: MongoRateLimitStore;
	private readonly policies: readonly RateLimitPolicy[];
	private serviceInternal: RateLimitingService | undefined;
	private serviceStarted = false;

	constructor(databaseProvider: MongoDatabaseProvider, policies: readonly RateLimitPolicy[], options: MongoRateLimitingOptions = {}) {
		const collectionName = options.collectionName ?? 'cagematch-rate-limits';
		const storeOptions: MongoRateLimitStoreOptions = options.ttlIndexName === undefined ? {} : { ttlIndexName: options.ttlIndexName };
		const collectionProvider: MongoCollectionProvider =
			typeof databaseProvider === 'function' ? async () => (await databaseProvider()).collection(collectionName) as MongoRateLimitCollection : (databaseProvider.collection(collectionName) as MongoRateLimitCollection);
		this.store = new MongoRateLimitStore(collectionProvider, storeOptions);
		this.policies = policies;
	}

	public async startUp(): Promise<void> {
		await this.store.startUp();
		this.serviceInternal = createRateLimitingService(this.store, this.policies);
		this.serviceStarted = true;
	}

	public async shutDown(): Promise<void> {
		this.serviceStarted = false;
		this.serviceInternal = undefined;
		await this.store.shutDown();
	}

	public async consume(request: RateLimitRequest) {
		if (!this.serviceStarted) {
			throw new Error('ServiceMongoRateLimiting is not started');
		}
		const service = this.serviceInternal;
		if (!service) {
			throw new Error('ServiceMongoRateLimiting is not initialized');
		}
		return await service.consume(request);
	}
}

async function resolveCollection(provider: MongoCollectionProvider): Promise<MongoRateLimitCollection> {
	return typeof provider === 'function' ? await provider() : provider;
}

function isDuplicateKeyError(error: unknown): error is { code: 11000 } {
	return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}
