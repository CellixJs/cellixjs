import type { ZodType } from 'zod';

export function defineQueueMessage<T>(schema: ZodType<T>) {
	return {
		encode(payload: T): string {
			schema.parse(payload);
			return JSON.stringify(payload);
		},
		decode(raw: string): T {
			const parsed = JSON.parse(raw);
			return schema.parse(parsed);
		},
	};
}
