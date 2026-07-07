import type { InvocationContext } from '@azure/functions';
import type { ApplicationServices, ApplicationServicesFactory } from '@ocom/application-services';
import { CommunityNotFoundError } from '@ocom/application-services';
import type { CommunityUpdatePayload, QueueStorageOperations } from '@ocom/service-queue-storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { communityUpdateQueueHandlerCreator } from './handler.ts';

function makeQueueEntry(overrides?: Partial<CommunityUpdatePayload['eventPayload']>): CommunityUpdatePayload {
	return {
		eventTimestamp: '2023-03-21T02:53:27.872Z',
		eventUuid: 'x-event-id-001',
		apiName: 'api-name-001',
		eventPayload: {
			communityId: 'community-abc',
			...overrides,
		},
	};
}

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
				payload: makeQueueEntry({
					name: 'Test Community',
					domain: 'test.example.com',
					whiteLabelDomain: null,
					handle: null,
				}),
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
			const queueEntry = makeQueueEntry();

			await handler(queueEntry, context);

			expect(queueService.receiveFromCommunityUpdateQueue).toHaveBeenCalledWith(queueEntry, {
				id: 'trigger-id-1',
				popReceipt: 'pop-receipt-1',
				dequeueCount: 1,
			});
		});

		it('calls updateSettings with the message payload fields', async () => {
			const handler = communityUpdateQueueHandlerCreator(factory as unknown as ApplicationServicesFactory, queueService);

			await handler(makeQueueEntry(), context);

			expect(factory.updateSettings).toHaveBeenCalledWith({
				id: 'community-abc',
				name: 'Test Community',
				domain: 'test.example.com',
				whiteLabelDomain: null,
				handle: null,
			});
		});

		it('calls forSystem scoped to only the community-settings permission it needs', async () => {
			const handler = communityUpdateQueueHandlerCreator(factory as unknown as ApplicationServicesFactory, queueService);

			await handler(makeQueueEntry(), context);

			expect(factory.forSystem).toHaveBeenCalledWith({ canManageCommunitySettings: true });
		});

		it('defaults triggerMetadata id to empty string when not present', async () => {
			const ctx = {
				error: vi.fn(),
				triggerMetadata: undefined,
			} as unknown as InvocationContext;
			const handler = communityUpdateQueueHandlerCreator(factory as unknown as ApplicationServicesFactory, queueService);

			await handler(makeQueueEntry(), ctx);

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

			await expect(handler({ bad: 'payload' } as unknown as CommunityUpdatePayload, context)).resolves.toBeUndefined();
			expect(context.error).toHaveBeenCalledWith(expect.stringContaining('invalid message payload'), expect.any(Error));
			expect(factory.forSystem).not.toHaveBeenCalled();
		});

		it('logs an error and returns (does not rethrow) when community is not found', async () => {
			factory = makeMockApplicationServicesFactory(vi.fn().mockRejectedValue(new CommunityNotFoundError('missing-id')));
			const handler = communityUpdateQueueHandlerCreator(factory as unknown as ApplicationServicesFactory, queueService);

			await expect(handler(makeQueueEntry({ communityId: 'missing-id' }), context)).resolves.toBeUndefined();
			expect(context.error).toHaveBeenCalledWith(expect.stringContaining('community not found'), expect.any(CommunityNotFoundError));
		});

		it('rethrows errors from updateSettings that are not "community not found"', async () => {
			factory = makeMockApplicationServicesFactory(vi.fn().mockRejectedValue(new Error('Database connection failed')));
			const handler = communityUpdateQueueHandlerCreator(factory as unknown as ApplicationServicesFactory, queueService);

			await expect(handler(makeQueueEntry(), context)).rejects.toThrow('Database connection failed');
			expect(context.error).not.toHaveBeenCalled();
		});

		it('rethrows non-Error throwables from updateSettings', async () => {
			factory = makeMockApplicationServicesFactory(vi.fn().mockRejectedValue('unexpected string error'));
			const handler = communityUpdateQueueHandlerCreator(factory as unknown as ApplicationServicesFactory, queueService);

			await expect(handler(makeQueueEntry(), context)).rejects.toBe('unexpected string error');
		});
	});
});
