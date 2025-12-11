// Keep public surface mongoose-free to avoid Schema type cycles in consumers
import type { ServiceBase } from '@cellix/api-services-spec';

type MongooseLike = {
	models: Record<string, unknown>;
	model: (name: string, schema?: unknown, collection?: unknown, options?: unknown) => unknown;
	disconnect: () => Promise<void>;
	set?: (...args: unknown[]) => unknown;
};

export type ServiceMongooseOptions = {
	debug?: boolean;
	[key: string]: unknown;
};

export interface MongooseContextFactoryLike {
	readonly service: MongooseLike;
}

export class ServiceMongoose
	implements ServiceBase<MongooseContextFactoryLike>, MongooseContextFactoryLike
{
	private readonly uri: string;
	private readonly options: ServiceMongooseOptions;
	private serviceInternal: MongooseLike | undefined;

	constructor(uri: string, options?: ServiceMongooseOptions) {
		if (!uri || uri.trim() === '') {
			throw new Error('MongoDB uri is required');
		}
		this.uri = uri;
		this.options = options ?? {};
	}

	public async startUp() {
		const { debug, ...options } = this.options;
		type MongooseModule = typeof import('mongoose');
		const mongooseModule = (await import('mongoose')) as MongooseModule;
		const mongoose = mongooseModule.default ?? mongooseModule;
		this.serviceInternal = (await mongoose.connect(this.uri, options)) as unknown as MongooseLike;
		if (debug && this.serviceInternal?.set) {
			this.serviceInternal.set('debug', true);
		}
		return this;
	}

	public async shutDown() {
		if (!this.serviceInternal) {
			throw new Error('ServiceMongoose is not started - shutdown cannot proceed');
		}
		await this.serviceInternal.disconnect();
		console.log('ServiceMongoose stopped');
	}

	public get service(): MongooseLike {
		if (!this.serviceInternal) {
			throw new Error('ServiceMongoose is not started - cannot access service');
		}
		return this.serviceInternal;
	}
}
