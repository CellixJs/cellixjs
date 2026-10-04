import { beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import type { EncodeVideoPayload } from './index.ts';

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
			provisionQueues: ['community-creation', 'encode-video', 'end-user-update'],
		});
	}, 10000);

	it('exposes a typed sender for the encode-video queue', async () => {
		const { ServiceQueueStorage } = await import('./index.ts');
		const service = new ServiceQueueStorage({ connectionString: 'UseDevelopmentStorage=true' });

		expect(typeof service.sendMessageToEncodeVideoQueue).toBe('function');
	});
});

describe('ServiceVideoWorkerQueueStorage', () => {
	const validPayload = {
		videoId: 'video-123',
		source: { containerName: 'uploads', blobName: 'raw/video-123.mov' },
		destination: { containerName: 'videos', prefix: 'video-123/' },
	};

	it('types the payload with resolved source and destination fields', () => {
		expectTypeOf<EncodeVideoPayload>().toEqualTypeOf<{
			videoId: string;
			source: { containerName: string; blobName: string };
			destination: { containerName: string; prefix: string };
		}>();
	});

	it('registers only the encode-video queue, as inbound', async () => {
		const { ServiceVideoWorkerQueueStorage } = await import('./index.ts');
		const service = new ServiceVideoWorkerQueueStorage({ connectionString: 'UseDevelopmentStorage=true' });
		const serviceWithOptions = service as unknown as { options: { provisionQueues?: string[] } };

		expect(serviceWithOptions.options.provisionQueues).toEqual(['encode-video']);
		expect(typeof service.processNextFromEncodeVideoQueue).toBe('function');
		expect('sendMessageToCommunityCreationQueue' in service).toBe(false);
	});

	it('accepts a valid encode-video payload', async () => {
		const { ServiceVideoWorkerQueueStorage } = await import('./index.ts');
		const service = new ServiceVideoWorkerQueueStorage({ connectionString: 'UseDevelopmentStorage=true' });

		await expect(service.receiveFromEncodeVideoQueue(validPayload, { id: 'm1' })).resolves.toMatchObject({ payload: validPayload });
	});

	it.each([
		['a missing videoId', { source: validPayload.source, destination: validPayload.destination }],
		['an empty blob name', { ...validPayload, source: { containerName: 'uploads', blobName: '' } }],
		['an invalid container name', { ...validPayload, destination: { containerName: 'Videos_Bad', prefix: 'x/' } }],
		['an unexpected property', { ...validPayload, priority: 'high' }],
	])('rejects a payload with %s', async (_case, payload) => {
		const { ServiceVideoWorkerQueueStorage } = await import('./index.ts');
		const service = new ServiceVideoWorkerQueueStorage({ connectionString: 'UseDevelopmentStorage=true' });

		await expect(service.receiveFromEncodeVideoQueue(payload, { id: 'm1' })).rejects.toThrow('Invalid payload for queue "encode-video"');
	});
});
