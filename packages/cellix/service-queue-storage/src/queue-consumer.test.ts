import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { describe, expect, it, vi } from 'vitest';
import { registerQueues } from './index.ts';

type MockPeekedMessage = {
	messageId: string;
	messageText: string;
	dequeueCount?: number;
};

let peekedMessageItems: MockPeekedMessage[] = [];

vi.mock('@azure/storage-queue', () => ({
	QueueServiceClient: {
		fromConnectionString: vi.fn(() => ({
			getQueueClient: vi.fn(() => ({
				sendMessage: vi.fn(async () => ({ messageId: 'mid' })),
				createIfNotExists: vi.fn(async () => ({ succeeded: true })),
				peekMessages: vi.fn(async () => ({ peekedMessageItems })),
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
			peekedMessageItems = [];
		});

		Scenario('Successfully receiving messages from an inbound queue', ({ Given, When, Then, And }) => {
			Given('a queue registry with a "importRequests" inbound queue', () => {
				registry = createInboundRegistry();
			});

			And('a service instance is created from the registry', async () => {
				svc = new registry.Service({ connectionString: 'UseDevelopmentStorage=true' });
				await svc.startUp();
			});

			When('I call receiveFromImportRequestsQueue', async () => {
				result = await (svc as unknown as {
					receiveFromImportRequestsQueue: (payload: unknown, metadata?: { id?: string; popReceipt?: string; dequeueCount?: number }) => Promise<unknown>;
				}).receiveFromImportRequestsQueue({ requestId: 'r1' }, { id: 'msg-1', dequeueCount: 1 });
			});

			Then('a single typed message is returned', () => {
				expect(result).toBeDefined();
				expect((result as { id: string; payload: { requestId: string } }).id).toBe('msg-1');
				expect((result as { id: string; payload: { requestId: string } }).payload.requestId).toBe('r1');
			});
		});
	});

	it('validates an already-received inbound payload and returns typed trigger metadata', async () => {
		const registry = createInboundRegistry();
		const svc = new registry.Service({ connectionString: 'UseDevelopmentStorage=true' });
		await svc.startUp();

		await expect(
			(
				svc as unknown as {
					receiveFromImportRequestsQueue: (
						payload: unknown,
						metadata?: { id?: string; popReceipt?: string; dequeueCount?: number },
					) => Promise<unknown>;
				}
			).receiveFromImportRequestsQueue({ requestId: 'r1' }, { id: 'msg-1', popReceipt: 'receipt-1', dequeueCount: 1 }),
		).resolves.toEqual({
			id: 'msg-1',
			popReceipt: 'receipt-1',
			payload: { requestId: 'r1' },
			dequeueCount: 1,
		});
	});

	it('includes Ajv field errors when receive validation fails', async () => {
		const registry = createInboundRegistry();
		const svc = new registry.Service({ connectionString: 'UseDevelopmentStorage=true' });
		await svc.startUp();

		await expect(
			(
				svc as unknown as {
					receiveFromImportRequestsQueue: (
						payload: unknown,
						metadata?: { id?: string; popReceipt?: string; dequeueCount?: number },
					) => Promise<unknown>;
				}
			).receiveFromImportRequestsQueue({}, { id: 'msg-invalid', dequeueCount: 1 }),
		).rejects.toThrow('Invalid payload for queue "import-requests": / is missing required property "requestId"');
	});

	it('allows peeking invalid inbound payloads without throwing', async () => {
		const registry = createInboundRegistry();
		const svc = new registry.Service({ connectionString: 'UseDevelopmentStorage=true' });
		peekedMessageItems = [
			{
				messageId: 'msg-invalid',
				messageText: Buffer.from(JSON.stringify({ unexpected: true })).toString('base64'),
				dequeueCount: 0,
			},
		];
		await svc.startUp();

		await expect((svc as unknown as { peekAtImportRequestsQueue: () => Promise<unknown> }).peekAtImportRequestsQueue()).resolves.toEqual([
			{
				id: 'msg-invalid',
				payload: { unexpected: true },
				dequeueCount: 0,
			},
		]);
	});
});
