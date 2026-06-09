import { BlobQueueMessageLogger } from '@cellix/service-queue-storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceQueueStorage } from './service.ts';

describe('ServiceQueueStorage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('enables blob-backed logging after construction', () => {
		const service = new ServiceQueueStorage({ connectionString: 'UseDevelopmentStorage=true' });
		const uploadText = vi.fn().mockResolvedValue({});
		const baseEnableLogging = vi.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(service)), 'enableLogging');

		service.enableLogging({ uploadText });

		expect(baseEnableLogging).toHaveBeenCalledOnce();
		expect(baseEnableLogging.mock.calls[0]?.[0]).toBeInstanceOf(BlobQueueMessageLogger);
		expect(baseEnableLogging.mock.calls[0]?.[1]).toEqual({
			enabled: true,
			container: 'queue-logs',
		});
	});
});
