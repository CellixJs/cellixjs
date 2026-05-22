import type { ApplicationServices } from '@ocom/application-services';

/**
 * GraphQL context available to all resolvers.
 */
export interface GraphContext {
	applicationServices: ApplicationServices;
	// Queue producer/consumer are optional runtime-provided typed objects. We keep the GraphQL package
	// free of a hard dependency on the OCOM queue registry types by using a lightweight structural type.
	queueProducer?: Record<string, (...args: unknown[]) => Promise<unknown>>;
	queueConsumer?: Record<string, (...args: unknown[]) => Promise<unknown>>;
}
