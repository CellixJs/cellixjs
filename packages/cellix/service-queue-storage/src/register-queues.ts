import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { QueueMap, QueueStorageConfig } from './interfaces.ts';
import { InternalQueueStorageService, type QueueServiceLifecycle, type QueueServiceLogging } from './internal-queue-storage-service.ts';
import { createQueueConsumer, type QueueConsumerContext } from './queue-consumer.ts';
import { createQueueProducer, type QueueProducerContext } from './queue-producer.ts';

// Setup Ajv once for the module lifecycle
const AjvClass = Ajv as unknown as new (opts?: Record<string, unknown>) => { compile(schema: object): (data: unknown) => boolean };
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
 * @param config - Object containing `outbound` and `inbound` queue definition maps.
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
 *   inbound:  { importRequests: importRequestsDef }
 * })
 *
 * class ServiceQueueStorage extends queues.Service {
 *   constructor(options: AppOptions) {
 *     super({ connectionString: options.connectionString, ... })
 *   }
 * }
 *
 * export type AppQueueProducerContext = typeof queues.producer
 * export type AppQueueConsumerContext = typeof queues.consumer
 * ```
 */
export function registerQueues<O extends QueueMap, I extends QueueMap>(config: { outbound: O; inbound: I }) {
	// Compile validators once at registration time
	const outboundValidators: Record<string, (d: unknown) => boolean> = {};
	for (const [k, v] of Object.entries(config.outbound)) {
		const def = v as unknown as { schema: object };
		outboundValidators[k] = ajv.compile(def.schema);
	}

	const inboundValidators: Record<string, (d: unknown) => boolean> = {};
	for (const [k, v] of Object.entries(config.inbound)) {
		const def = v as unknown as { schema: object };
		inboundValidators[k] = ajv.compile(def.schema);
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

	/**
	 * Base class returned by `registerQueues`. Extends the internal queue transport with
	 * the application's typed producer and consumer methods already assigned.
	 * Consumer packages extend this class rather than calling any bind step manually.
	 */
	class BoundServiceQueueStorage extends InternalQueueStorageService {
		constructor(options: QueueStorageConfig) {
			super(options);
			Object.assign(this, createQueueProducer(this, config.outbound, outboundValidators));
			Object.assign(this, createQueueConsumer(this, config.inbound, inboundValidators));
		}
	}

	return {
		producer,
		consumer,
		Service: BoundServiceQueueStorage as unknown as new (options: QueueStorageConfig) => RegisteredQueueService<O, I>,
	} as const;
}

function capitalizeQueueKey(key: string): string {
	return `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
}
