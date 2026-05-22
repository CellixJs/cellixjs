import type { ZodTypeAny, z } from 'zod';
import type { ServiceQueueStorage } from './service-queue-storage.js';

export type QueueDefinition<S extends ZodTypeAny> = {
	queueName: string;
	schema: S;
	loggingTags?: Record<string, string>;
};

export type QueueDefinitions = Record<string, QueueDefinition<ZodTypeAny>>;

// Maps { emailNotifications: QueueDefinition<EmailSchema>, ... }
// to   { sendEmailNotifications: (payload: EmailType) => Promise<void>, ... }
export type QueueProducerContext<Q extends QueueDefinitions> = {
	[K in keyof Q as `send${Capitalize<string & K>}`]: (payload: z.infer<Q[K]['schema']>) => Promise<void>;
};

export function createQueueProducer<Q extends QueueDefinitions>(service: Pick<ServiceQueueStorage, 'sendMessage'>, definitions: Q): QueueProducerContext<Q> {
	const context = {} as Record<string, (payload: unknown) => Promise<void>>;

	for (const [key, def] of Object.entries(definitions)) {
		const methodName = `send${key.charAt(0).toUpperCase()}${key.slice(1)}`;
		context[methodName] = async (payload: unknown) => {
			// Validate using the zod schema from the definition
			const validated = def.schema.parse(payload);
			// Delegate to the framework service for delivery + logging
			const opts = def.loggingTags ? { loggingTags: def.loggingTags } : undefined;
			await service.sendMessage(def.queueName, validated, opts);
		};
	}

	return context as QueueProducerContext<Q>;
}
