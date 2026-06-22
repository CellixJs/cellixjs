import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { QueueMap, QueueStorageConfig } from './interfaces.ts';
import { InternalQueueStorageService, type QueueServiceLifecycle, type QueueServiceLogging } from './internal-queue-storage-service.ts';
import { createQueueConsumer, type QueueConsumerContext } from './queue-consumer.ts';
import { createQueueProducer, type QueueProducerContext } from './queue-producer.ts';
import type { QueuePayloadValidator } from './validation.ts';

type QueueServiceDefaults = Pick<QueueStorageConfig, 'logging' | 'provisionQueues'>;
export type QueueServiceConstructorOptions = { accountName: string } | { connectionString: string };

// Setup Ajv once for the module lifecycle
const AjvClass = Ajv as unknown as new (opts?: Record<string, unknown>) => {
	compile(schema: object): QueuePayloadValidator;
	getSchema(schemaId: string): QueuePayloadValidator | undefined;
};
const ajv = new AjvClass({ allErrors: true });
const addFormatsAny = addFormats as unknown as { default?: (a: unknown) => void } | ((a: unknown) => void);
if (typeof addFormatsAny === 'function') {
	addFormatsAny(ajv);
} else if (addFormatsAny && typeof addFormatsAny.default === 'function') {
	addFormatsAny.default?.(ajv);
}

/**
 * Public service shape produced by {@link registerQueues}.
 *
 * Consumers typically use this through an application-specific alias, for example
 * `type ServiceQueueStorage = RegisteredQueueService<typeof outbound, typeof inbound>`.
 *
 * @typeParam O - Outbound queue definition map passed to `registerQueues()`.
 * @typeParam I - Inbound queue definition map passed to `registerQueues()`.
 *
 * @example
 * ```ts
 * const outbound = { communityCreation: communityCreationQueue };
 * const inbound = { importRequests: importRequestsQueue };
 *
 * type ServiceQueueStorage = RegisteredQueueService<typeof outbound, typeof inbound>;
 * ```
 */
export type RegisteredQueueService<O extends QueueMap, I extends QueueMap> = QueueServiceLifecycle & QueueServiceLogging & QueueProducerContext<O> & QueueConsumerContext<I>;
export type RegisteredQueueRegistry<O extends QueueMap, I extends QueueMap> = {
	producer: QueueProducerContext<O>;
	consumer: QueueConsumerContext<I>;
	Service: new (options: QueueStorageConfig) => RegisteredQueueService<O, I>;
};
export type QueueRegistryProducer<TRegistry> = TRegistry extends { producer: infer TProducer } ? TProducer : never;
export type QueueRegistryConsumer<TRegistry> = TRegistry extends { consumer: infer TConsumer } ? TConsumer : never;
export type QueueRegistryOperations<TRegistry> = QueueRegistryProducer<TRegistry> & QueueRegistryConsumer<TRegistry>;
export type QueueRegistryService<TRegistry> = TRegistry extends { Service: new (...args: never[]) => infer TService } ? TService : never;

/**
 * Derives the unique physical queue names from registered outbound and inbound definitions.
 *
 * Use this when setting `serviceDefaults.provisionQueues` so consumer packages do not
 * need to hand-maintain a second queue-name list alongside their queue registry.
 *
 * @example
 * ```ts
 * const queues = registerQueues({
 *   outbound: outboundQueues,
 *   inbound: inboundQueues,
 * });
 * ```
 */
export function deriveProvisionQueues<O extends QueueMap, I extends QueueMap>(outbound: O, inbound: I): string[] {
	return [...new Set([...Object.values(outbound), ...Object.values(inbound)].map((definition) => definition.queueName))];
}

/**
 * Narrows the registered `Service` constructor to an application-specific public options type.
 *
 * Consumer packages often want to expose a smaller constructor surface than the full
 * internal `QueueStorageConfig`. This helper preserves the registry-derived instance
 * type while avoiding a repeated `as unknown as new (...) => ...` cast in each package.
 */
export function createRegisteredQueueService<
	TOptions extends QueueStorageConfig = QueueServiceConstructorOptions,
	TRegistry extends { Service: new (options: QueueStorageConfig) => unknown } = { Service: new (options: QueueStorageConfig) => unknown },
>(
	registry: TRegistry,
): new (options: TOptions) => QueueRegistryService<TRegistry> {
	return registry.Service as unknown as new (options: TOptions) => QueueRegistryService<TRegistry>;
}

/**
 * Registers outbound and inbound queue definitions and returns a typed registry.
 *
 * The registry exposes:
 * - `producer` / `consumer` — typed stubs used for type inference in consumer packages
 * - `Service` — a base class that provides lifecycle methods plus the queue
 *   bindings already wired in the constructor. Consumer packages extend `Service` to
 *   create an application-specific queue storage service without any manual binding step.
 *
 * AJV validators for all queue schemas are compiled once at registration time and
 * reused across all `Service` instances.
 *
 * @typeParam O - Outbound queue definition map for messages produced by the application.
 * @typeParam I - Inbound queue definition map for messages consumed by the application.
 * @param config - Object containing `outbound` and `inbound` queue definition maps,
 * plus optional `serviceDefaults` that are merged into every created `Service`
 * instance. Registered queue names are provisioned by default for local
 * development startup. Use `serviceDefaults.provisionQueues` only when you want
 * to override that default subset.
 * @returns A queue registry with typed stubs and a bound `Service` base class.
 *
 * @remarks
 * The returned `producer` and `consumer` objects are type stubs, not live queue
 * clients. They exist so consumer packages can export stable TypeScript aliases
 * without instantiating a service. The actual queue methods are attached to the
 * returned `Service` base class.
 *
 * @example
 * ```typescript
 * // In @ocom/service-queue-storage:
 * const queues = registerQueues({
 *   outbound: { communityCreation: communityCreationDef },
 *   inbound:  { importRequests: importRequestsDef },
 *   serviceDefaults: { logging: { enabled: true, container: 'queue-logs' } },
 * })
 *
 * const partialProvision = registerQueues({
 *   outbound: { communityCreation: communityCreationDef },
 *   inbound:  { importRequests: importRequestsDef },
 *   serviceDefaults: { provisionQueues: ['community-creation'] },
 * })
 *
 * export const ServiceQueueStorage = createRegisteredQueueService(queues)
 * export type ServiceQueueStorage = InstanceType<typeof ServiceQueueStorage>
 * export type QueueStorageOperations = QueueRegistryOperations<typeof queues>
 * ```
 */
export function registerQueues<O extends QueueMap, I extends QueueMap>(config: {
	outbound: O;
	inbound: I;
	serviceDefaults?: QueueServiceDefaults;
}) {
	// Compile validators once at registration time
	const outboundValidators: Record<string, QueuePayloadValidator> = {};
	for (const [k, v] of Object.entries(config.outbound)) {
		const def = v as unknown as { schema: object };
		outboundValidators[k] = compileQueueValidator(def.schema);
	}

	const inboundValidators: Record<string, QueuePayloadValidator> = {};
	for (const [k, v] of Object.entries(config.inbound)) {
		const def = v as unknown as { schema: object };
		inboundValidators[k] = compileQueueValidator(def.schema);
	}

	// Typed stubs — used by consumer packages for type inference only
	const makeProducerStub = <T extends QueueMap>(defs: T): QueueProducerContext<T> => {
		const out: Record<string, unknown> = {};
		for (const key of Object.keys(defs)) {
			const cap = capitalizeQueueKey(key);
			out[`sendMessageTo${cap}Queue`] = () => Promise.reject(new Error('Queue producer not bound to a registered queue service'));
			out[`peekAt${cap}Queue`] = (_maxMessages?: number) => Promise.resolve([]);
		}
		return out as QueueProducerContext<T>;
	};

	const makeConsumerStub = <T extends QueueMap>(defs: T): QueueConsumerContext<T> => {
		const out: Record<string, unknown> = {};
		for (const key of Object.keys(defs)) {
			const cap = capitalizeQueueKey(key);
			out[`receiveFrom${cap}Queue`] = () => Promise.resolve(undefined);
			out[`peekAt${cap}Queue`] = (_maxMessages?: number) => Promise.resolve([]);
		}
		return out as QueueConsumerContext<T>;
	};

	const producer = makeProducerStub(config.outbound);
	const consumer = makeConsumerStub(config.inbound);
	const defaultProvisionQueues = config.serviceDefaults?.provisionQueues ?? deriveProvisionQueues(config.outbound, config.inbound);

	/**
	 * Base class returned by `registerQueues`. Extends the internal queue transport with
	 * the application's typed producer and consumer methods already assigned.
	 * Consumer packages extend this class rather than calling any bind step manually.
	 */
	class BoundServiceQueueStorage extends InternalQueueStorageService {
		constructor(options: QueueStorageConfig) {
			const mergedOptions: QueueStorageConfig = {
				...config.serviceDefaults,
				provisionQueues: defaultProvisionQueues,
				...options,
				...(options.logging !== undefined
					? { logging: options.logging }
						: config.serviceDefaults?.logging !== undefined
							? { logging: config.serviceDefaults.logging }
							: {}),
				...(options.provisionQueues !== undefined
					? { provisionQueues: options.provisionQueues }
					: config.serviceDefaults?.provisionQueues !== undefined
						? { provisionQueues: config.serviceDefaults.provisionQueues }
						: {}),
			};
			super(mergedOptions);
			Object.assign(this, createQueueProducer(this, config.outbound, outboundValidators));
			Object.assign(this, createQueueConsumer(this, config.inbound, inboundValidators));
		}
	}

	return {
		producer,
		consumer,
		Service: BoundServiceQueueStorage as unknown as new (options: QueueStorageConfig) => RegisteredQueueService<O, I>,
	} as const satisfies RegisteredQueueRegistry<O, I>;
}

function capitalizeQueueKey(key: string): string {
	return `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
}

function compileQueueValidator(schema: object): QueuePayloadValidator {
	const schemaId = extractSchemaId(schema);
	if (schemaId) {
		const existing = ajv.getSchema(schemaId);
		if (existing) {
			return existing;
		}
	}

	return ajv.compile(schema);
}

function extractSchemaId(schema: object): string | undefined {
	if ('$id' in schema) {
		const schemaId = (schema as { $id?: unknown }).$id;
		return typeof schemaId === 'string' && schemaId.length > 0 ? schemaId : undefined;
	}

	return undefined;
}
