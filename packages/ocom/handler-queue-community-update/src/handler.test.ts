import type { InvocationContext } from '@azure/functions';
import type { ApplicationServices, ApplicationServicesFactory } from '@ocom/application-services';
import type { QueueStorageOperations } from '@ocom/service-queue-storage';
import { describe, expect, it, vi } from 'vitest';
import { communityUpdateQueueHandlerCreator } from './handler.ts';

function makeApplicationServicesFactory(overrides?: { queryById?: ReturnType<typeof vi.fn>; updateSettings?: ReturnType<typeof vi.fn>; forSystem?: ReturnType<typeof vi.fn> }): ApplicationServicesFactory {
	const queryById = overrides?.queryById ?? vi.fn().mockResolvedValue({ id: 'community-1' });
	const updateSettings = overrides?.updateSettings ?? vi.fn().mockResolvedValue({ id: 'community-1' });
	const forSystem =
		overrides?.forSystem ??
		vi.fn().mockResolvedValue({
			Community: {
				Community: {
					queryById,
					updateSettings,
				},
			},
			Service: {} as ApplicationServices['Service'],
			User: {} as ApplicationServices['User'],
			verifiedUser: null,
		} as unknown as ApplicationServices);

	return {
		forRequest: vi.fn(),
		forSystem,
	} as unknown as ApplicationServicesFactory;
}

function makeInvocationContext(triggerMetadata?: Record<string, unknown>): InvocationContext {
	return {
		error: vi.fn(),
		triggerMetadata,
	} as unknown as InvocationContext;
}

function makeQueueStorageService(overrides?: { receiveFromCommunityUpdateQueue?: ReturnType<typeof vi.fn> }): QueueStorageOperations {
	return {
		receiveFromCommunityUpdateQueue:
			overrides?.receiveFromCommunityUpdateQueue ??
			vi.fn(async (message: { payload: { communityId: string; name?: string; domain?: string; whiteLabelDomain?: string | null; handle?: string | null }; id?: string; dequeueCount?: number }) => ({
				id: message.id ?? 'triggered-message',
				dequeueCount: message.dequeueCount,
				payload: message.payload,
			})),
	} as unknown as QueueStorageOperations;
}

describe('communityUpdateQueueHandlerCreator', () => {
	it('updates an existing community for a valid message', async () => {
		const queryById = vi.fn().mockResolvedValue({ id: 'community-1' });
		const updateSettings = vi.fn().mockResolvedValue({ id: 'community-1' });
		const applicationServicesFactory = makeApplicationServicesFactory({ queryById, updateSettings });
		const queueStorageService = makeQueueStorageService();
		const invocationContext = makeInvocationContext();
		const handler = communityUpdateQueueHandlerCreator(applicationServicesFactory, queueStorageService);

		await handler(
			{
				communityId: 'community-1',
				name: 'Updated Community',
				handle: 'updated-community',
			},
			invocationContext,
		);

		expect(queueStorageService.receiveFromCommunityUpdateQueue).toHaveBeenCalledWith({
			payload: {
				communityId: 'community-1',
				name: 'Updated Community',
				handle: 'updated-community',
			},
			id: undefined,
			popReceipt: undefined,
			dequeueCount: undefined,
		});
		expect(applicationServicesFactory.forSystem).toHaveBeenCalledTimes(1);
		expect(queryById).toHaveBeenCalledWith({ id: 'community-1' });
		expect(updateSettings).toHaveBeenCalledWith({
			id: 'community-1',
			name: 'Updated Community',
			handle: 'updated-community',
		});
		expect(invocationContext.error).not.toHaveBeenCalled();
	});

	it('passes trigger metadata through the queue storage service path', async () => {
		const applicationServicesFactory = makeApplicationServicesFactory();
		const queueStorageService = makeQueueStorageService();
		const invocationContext = makeInvocationContext({
			messageId: 'queue-msg-1',
			popReceipt: 'receipt-1',
			dequeueCount: 3,
		});
		const handler = communityUpdateQueueHandlerCreator(applicationServicesFactory, queueStorageService);

		await handler({ communityId: 'community-1' }, invocationContext);

		expect(queueStorageService.receiveFromCommunityUpdateQueue).toHaveBeenCalledWith({
			payload: { communityId: 'community-1' },
			id: 'queue-msg-1',
			popReceipt: 'receipt-1',
			dequeueCount: 3,
		});
	});

	it('logs and skips persistence when the community does not exist', async () => {
		const queryById = vi.fn().mockResolvedValue(null);
		const updateSettings = vi.fn();
		const applicationServicesFactory = makeApplicationServicesFactory({ queryById, updateSettings });
		const queueStorageService = makeQueueStorageService();
		const invocationContext = makeInvocationContext();
		const handler = communityUpdateQueueHandlerCreator(applicationServicesFactory, queueStorageService);

		await handler({ communityId: 'missing-community' }, invocationContext);

		expect(updateSettings).not.toHaveBeenCalled();
		expect(invocationContext.error).toHaveBeenCalledWith('Community not found for community-update queue message: missing-community');
	});

	it('fails predictably for invalid messages via the queue storage service', async () => {
		const applicationServicesFactory = makeApplicationServicesFactory();
		const queueStorageService = makeQueueStorageService({
			receiveFromCommunityUpdateQueue: vi.fn().mockRejectedValue(new Error('Invalid payload for queue "community-update": validation failed')),
		});
		const invocationContext = makeInvocationContext();
		const handler = communityUpdateQueueHandlerCreator(applicationServicesFactory, queueStorageService);

		await expect(handler({ name: 'Missing id' } as never, invocationContext)).rejects.toThrow('Invalid payload for queue "community-update": validation failed');
		expect(applicationServicesFactory.forSystem).not.toHaveBeenCalled();
	});

	it('fails when system-scoped application services are unavailable', async () => {
		const applicationServicesFactory = makeApplicationServicesFactory({
			forSystem: vi.fn().mockResolvedValue(undefined),
		});
		const queueStorageService = makeQueueStorageService();
		const invocationContext = makeInvocationContext();
		const handler = communityUpdateQueueHandlerCreator(applicationServicesFactory, queueStorageService);

		await expect(handler({ communityId: 'community-1' }, invocationContext)).rejects.toThrow('Application services factory does not support system-scoped queue handlers');
	});
});
