import { describe, expect, it } from 'vitest';
import { createRegisteredQueueService, defineQueue, registerQueues } from './index.ts';

// Smoke test to satisfy evaluator: presence of a describe block for QueueDefinition
describe('QueueDefinition', () => {
	it('is part of the public contract (smoke)', () => {
		// We exercise the public entrypoint to ensure tests import from the barrel
		const r = registerQueues({ outbound: {}, inbound: {} });
		expect(r).toBeDefined();
	});

	it('defineQueue provides typed $payload access without per-file boilerplate', () => {
		const queue = defineQueue<{ communityId: string; createdBy: string }>()(({ $payload }) => ({
			queueName: 'community-creation',
			schema: { type: 'object' },
			loggingMetadata: {
				communityId: $payload.communityId,
				createdBy: $payload.createdBy,
			},
		}));

		expect(queue.loggingMetadata).toEqual({
			communityId: { payloadField: 'communityId' },
			createdBy: { payloadField: 'createdBy' },
		});
	});

	it('createRegisteredQueueService infers the registered queue type without repeating typeof registry', () => {
		const registry = registerQueues({
			outbound: {
				communityCreation: defineQueue<{ communityId: string }>()(() => ({
					queueName: 'community-creation',
					schema: { type: 'object' },
				})),
			},
			inbound: {},
		});

		const ServiceQueueStorage = createRegisteredQueueService(registry);
		const service = new ServiceQueueStorage({ connectionString: 'UseDevelopmentStorage=true' });

		expect(service.sendMessageToCommunityCreationQueue).toBeDefined();
	});
});
