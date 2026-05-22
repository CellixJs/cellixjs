import type { InboundQueueSchema } from '@cellix/service-queue-storage';
import { z } from 'zod';

export const importRequestsQueue = {
	queueName: 'import-requests',
	schema: z.object({
		importId: z.string().uuid(),
		requestedBy: z.string(),
		fileUrl: z.string().url(),
	}),
	loggingTags: { domain: 'imports', type: 'request' },
} satisfies InboundQueueSchema;

export type ImportRequest = z.infer<typeof importRequestsQueue.schema>;
