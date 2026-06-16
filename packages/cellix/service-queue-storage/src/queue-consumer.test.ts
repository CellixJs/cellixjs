import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { describe, expect, vi } from 'vitest';
import { registerQueues } from './index.ts';

type MockReceivedMessage = {
	messageId: string;
	popReceipt?: string;
	messageText: string;
	dequeueCount?: number;
};

let receivedMessageItems: MockReceivedMessage[] = [];

vi.mock('@azure/storage-queue', () => ({
	QueueServiceClient: {
		fromConnectionString: vi.fn(() => ({
			getQueueClient: vi.fn(() => ({
				sendMessage: vi.fn(async () => ({ messageId: 'mid' })),
				createIfNotExists: vi.fn(async () => ({ succeeded: true })),
				receiveMessages: vi.fn(async () => ({ receivedMessageItems })),
				peekMessages: vi.fn(async () => ({ peekedMessageItems: [] })),
				deleteMessage: vi.fn(async () => ({})),
			})),
		})),
	},
}));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/queue-consumer.feature'));

const test = { for: describeFeature };

function createInboundRegistry() {
	return registerQueues({
		outbound: {},
		inbound: {
			importRequests: {
				queueName: 'import-requests',
				schema: { type: 'object', properties: { requestId: { type: 'string' } }, required: ['requestId'] },
			},
		},
	});
}

type InboundRegistry = ReturnType<typeof createInboundRegistry>;
type InboundService = InstanceType<InboundRegistry['Service']>;

describe('registerQueues', () => {
	test.for(feature, ({ Scenario, BeforeEachScenario }) => {
		let registry: InboundRegistry;
		let svc: InboundService;
		let result: unknown;

		BeforeEachScenario(() => {
			vi.clearAllMocks();
			receivedMessageItems = [];
		});

		Scenario('Successfully receiving messages from an inbound queue', ({ Given, When, Then, And }) => {
			Given('a queue registry with a "importRequests" inbound queue', () => {
				registry = createInboundRegistry();
			});

			And('a service instance is created from the registry', async () => {
				svc = new registry.Service({ connectionString: 'UseDevelopmentStorage=true' });
				receivedMessageItems = [
					{
						messageId: 'msg-1',
						messageText: Buffer.from(JSON.stringify({ requestId: 'r1' })).toString('base64'),
						dequeueCount: 1,
					},
				];
				await svc.startUp();
			});

			When('I call receiveFromImportRequestsQueue', async () => {
				result = await (svc as unknown as { receiveFromImportRequestsQueue: () => Promise<unknown> }).receiveFromImportRequestsQueue();
			});

			Then('a single typed message is returned', () => {
				expect(result).toBeDefined();
				expect((result as { id: string; payload: { requestId: string } }).id).toBe('msg-1');
				expect((result as { id: string; payload: { requestId: string } }).payload.requestId).toBe('r1');
			});
		});

		Scenario('Processing a trigger-delivered inbound queue message', ({ Given, When, Then, And }) => {
			Given('a queue registry with a "importRequests" inbound queue', () => {
				registry = createInboundRegistry();
			});

			And('a service instance is created from the registry', async () => {
				svc = new registry.Service({ connectionString: 'UseDevelopmentStorage=true' });
				await svc.startUp();
			});

			When('I call receiveFromImportRequestsQueue with a trigger-delivered message', async () => {
				result = await (svc as unknown as { receiveFromImportRequestsQueue: (message: { payload: { requestId: string }; id?: string; dequeueCount?: number }) => Promise<unknown> }).receiveFromImportRequestsQueue({
					id: 'trigger-msg-1',
					dequeueCount: 2,
					payload: { requestId: 'trigger-r1' },
				});
			});

			Then('the trigger-delivered message is validated and returned as a typed message', () => {
				expect(result).toBeDefined();
				expect((result as { id: string; dequeueCount?: number; payload: { requestId: string } }).id).toBe('trigger-msg-1');
				expect((result as { id: string; dequeueCount?: number; payload: { requestId: string } }).dequeueCount).toBe(2);
				expect((result as { id: string; payload: { requestId: string } }).payload.requestId).toBe('trigger-r1');
			});
		});
	});
});
