import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('ServiceQueueStorage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('uses registration defaults so consumer wrappers do not need to reimplement queue policy', async () => {
		const { ServiceQueueStorage } = await import('./index.ts');
		const service = new ServiceQueueStorage({ connectionString: 'UseDevelopmentStorage=true' });
		const serviceWithOptions = service as unknown as {
			options: {
				provisionQueues?: string[];
			};
		};

		expect(serviceWithOptions.options).toMatchObject({
			provisionQueues: ['community-creation', 'end-user-update', 'community-update'],
		});
	}, 10000);
});
