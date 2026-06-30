import type { InvocationContext } from '@azure/functions';
import type { ApplicationServices, ApplicationServicesFactory } from '@ocom/application-services';
import type { QueueStorageOperations } from '@ocom/service-queue-storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { communityUpdateQueueHandlerCreator } from './handler.ts';

function makeMockApplicationServicesFactory(updateSettings = vi.fn().mockResolvedValue(undefined)) {
	const appServices = {
		Community: {
			Community: {
				updateSettings,
			},
		},
	} as unknown as ApplicationServices;
	return {
		forSystem: vi.fn().mockResolvedValue(appServices),
		updateSettings,
	};
}

function makeMockQueueService(receiveResult?: object) {
	return {
		receiveFromCommunityUpdateQueue: vi.fn().mockResolvedValue(
			receiveResult ?? {
				id: 'msg-1',
				payload: {
					communityId: 'community-abc',
					name: 'Test Community',
					domain: 'test.example.com',
					whiteLabelDomain: null,
					handle: null,
				},
			},
		),
	} as unknown as QueueStorageOperations;
}

function makeMockInvocationContext(): InvocationContext {
	return {
		error: vi.fn(),
		triggerMetadata: {
			id: 'trigger-id-1',
			popReceipt: 'pop-receipt-1',
			dequeueCount: 1,
		},
	} as unknown as InvocationContext;
}

describe('communityUpdateQueueHandlerCreator', () => {
	let factory: ReturnType<typeof makeMockApplicationServicesFactory>;
	let queueService: QueueStorageOperations;
	let context: InvocationContext;

	beforeEach(() => {
		vi.clearAllMocks();
		factory = makeMockApplicationServicesFactory();
		queueService = makeMockQueueService();
		context = makeMockInvocationContext();
	});

	describe('handler creation', () => {
		it('returns a function (the StorageQueueHandler)', () => {
			const handler = communityUpdateQueueHandlerCreator(factory as unknown as ApplicationServicesFactory, queueService);
			expect(typeof handler).toBe('function');
		});
	});

	describe('handler invocation', () => {
		it('calls receiveFromCommunityUpdateQueue with payload and trigger metadata', async () => {
			const handler = communityUpdateQueueHandlerCreator(factory as unknown as ApplicationServicesFactory, queueService);
			const queueEntry = { communityId: 'community-abc' };

			await handler(queueEntry, context);

			expect(queueService.receiveFromCommunityUpdateQueue).toHaveBeenCalledWith(queueEntry, {
				id: 'trigger-id-1',
				popReceipt: 'pop-receipt-1',
				dequeueCount: 1,
			});
		});

		it('calls updateSettings with the message payload fields', async () => {
			const handler = communityUpdateQueueHandlerCreator(factory as unknown as ApplicationServicesFactory, queueService);

			await handler({ communityId: 'community-abc' }, context);

			expect(factory.updateSettings).toHaveBeenCalledWith({
				id: 'community-abc',
				name: 'Test Community',
				domain: 'test.example.com',
				whiteLabelDomain: null,
				handle: null,
			});
		});

		it('calls forSystem with no arguments (system queue trigger)', async () => {
			const handler = communityUpdateQueueHandlerCreator(factory as unknown as ApplicationServicesFactory, queueService);

			await handler({ communityId: 'community-abc' }, context);

			expect(factory.forSystem).toHaveBeenCalledWith();
		});

		it('defaults triggerMetadata id to empty string when not present', async () => {
			const ctx = {
				error: vi.fn(),
				triggerMetadata: undefined,
			} as unknown as InvocationContext;
			const handler = communityUpdateQueueHandlerCreator(factory as unknown as ApplicationServicesFactory, queueService);

			await handler({ communityId: 'community-abc' }, ctx);

			expect(queueService.receiveFromCommunityUpdateQueue).toHaveBeenCalledWith(expect.anything(), {
				id: '',
				popReceipt: undefined,
				dequeueCount: undefined,
			});
		});
	});

	describe('error handling', () => {
		it('logs an error and returns (does not rethrow) when receiveFromCommunityUpdateQueue throws', async () => {
			vi.mocked(queueService.receiveFromCommunityUpdateQueue).mockRejectedValue(new Error('JSON parse error'));
			const handler = communityUpdateQueueHandlerCreator(factory as unknown as ApplicationServicesFactory, queueService);

			await expect(handler({ bad: 'payload' } as unknown as { communityId: string }, context)).resolves.toBeUndefined();
			expect(context.error).toHaveBeenCalledWith(expect.stringContaining('invalid message payload'));
			expect(factory.forSystem).not.toHaveBeenCalled();
		});

		it('logs an error and returns (does not rethrow) when community is not found', async () => {
			factory = makeMockApplicationServicesFactory(vi.fn().mockRejectedValue(new Error('Community not found')));
			const handler = communityUpdateQueueHandlerCreator(factory as unknown as ApplicationServicesFactory, queueService);

			await expect(handler({ communityId: 'missing-id' }, context)).resolves.toBeUndefined();
			expect(context.error).toHaveBeenCalledWith(expect.stringContaining('community not found'));
		});

		it('rethrows errors from updateSettings that are not "community not found"', async () => {
			factory = makeMockApplicationServicesFactory(vi.fn().mockRejectedValue(new Error('Database connection failed')));
			const handler = communityUpdateQueueHandlerCreator(factory as unknown as ApplicationServicesFactory, queueService);

			await expect(handler({ communityId: 'community-abc' }, context)).rejects.toThrow('Database connection failed');
			expect(context.error).not.toHaveBeenCalled();
		});

		it('rethrows non-Error throwables from updateSettings', async () => {
			factory = makeMockApplicationServicesFactory(vi.fn().mockRejectedValue('unexpected string error'));
			const handler = communityUpdateQueueHandlerCreator(factory as unknown as ApplicationServicesFactory, queueService);

			await expect(handler({ communityId: 'community-abc' }, context)).rejects.toBe('unexpected string error');
		});
	});
});
