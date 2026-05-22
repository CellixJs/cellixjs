import type { OutboundQueueSchema } from '@cellix/service-queue-storage';
import { z } from 'zod';

export const communityCreationQueue = {
	queueName: 'community-creation',
	schema: z.object({
		communityId: z.string(),
		name: z.string(),
		createdBy: z.string(),
	}),
	loggingTags: { domain: 'community', type: 'creation' },
} satisfies OutboundQueueSchema;

export type CommunityCreationMessage = z.infer<typeof communityCreationQueue.schema>;
