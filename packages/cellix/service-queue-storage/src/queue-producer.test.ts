import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { describe, expect, vi } from 'vitest';
import { registerQueues } from './index.ts';

type SentMessage = { queue: string; messageText: string };
type MockPeekedMessage = { messageId: string; messageText: string; dequeueCount?: number };

let sentMessages: SentMessage[] = [];
let peekedMessageItems: MockPeekedMessage[] = [];

vi.mock('@azure/storage-queue', () => ({
	QueueServiceClient: {
		fromConnectionString: vi.fn(() => ({
			getQueueClient: vi.fn((queue: string) => ({
				sendMessage: vi.fn((messageText: string) => {
					sentMessages.push({ queue, messageText });
					return Promise.resolve({ messageId: 'mid' });
				}),
				createIfNotExists: vi.fn(async () => ({ succeeded: true })),
				receiveMessages: vi.fn(async () => ({ receivedMessageItems: [] })),
				peekMessages: vi.fn(async () => ({ peekedMessageItems })),
				deleteMessage: vi.fn(async () => ({})),
			})),
		})),
	},
}));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/queue-producer.feature'));

const test = { for: describeFeature };

function createOutboundRegistry() {
	return registerQueues({
		outbound: {
			emailNotifications: {
				queueName: 'email-notifications',
				schema: {
					$schema: 'http://json-schema.org/draft-07/schema#',
					type: 'object',
					properties: { to: { type: 'string', format: 'email' }, subject: { type: 'string' } },
					required: ['to', 'subject'],
					additionalProperties: false,
				},
			},
		},
		inbound: {},
	});
}

function createPeekRegistry() {
	return registerQueues({
		outbound: {
			emailNotifications: {
				queueName: 'email-notifications',
				schema: { type: 'object', properties: { to: { type: 'string' }, subject: { type: 'string' } }, required: ['to', 'subject'] },
			},
		},
		inbound: {},
	});
}

type OutboundRegistry = ReturnType<typeof createOutboundRegistry>;
type PeekRegistry = ReturnType<typeof createPeekRegistry>;
type OutboundService = InstanceType<OutboundRegistry['Service']>;
type PeekService = InstanceType<PeekRegistry['Service']>;

describe('registerQueues', () => {
	test.for(feature, ({ Scenario, BeforeEachScenario }) => {
		let registry: OutboundRegistry | PeekRegistry;
		let svc: OutboundService | PeekService;
		let threwGlobal = false;

		BeforeEachScenario(() => {
			vi.clearAllMocks();
			sentMessages = [];
			peekedMessageItems = [];
		});

		Scenario('Successfully sending a valid message to an outbound queue', ({ Given, When, Then, And }) => {
			Given('a queue registry with a "emailNotifications" outbound queue', () => {
				registry = createOutboundRegistry();
			});

			And('a service instance is created from the registry', async () => {
				svc = new registry.Service({ connectionString: 'UseDevelopmentStorage=true' });
				await svc.startUp();
			});

			When('I call sendMessageToEmailNotificationsQueue with a valid payload', async () => {
				await svc.sendMessageToEmailNotificationsQueue({ to: 'user@example.com', subject: 'hello' });
			});

			Then('the message is sent to the "email-notifications" queue', () => {
				expect(sentMessages).toHaveLength(1);
				expect(sentMessages[0]?.queue).toBe('email-notifications');
				expect(JSON.parse(Buffer.from(sentMessages[0]?.messageText ?? '', 'base64').toString('utf-8'))).toEqual({
					to: 'user@example.com',
					subject: 'hello',
				});
			});
		});

		Scenario('Sending an invalid payload is rejected with a validation error', ({ Given, When, Then, And }) => {
			Given('a queue registry with a "emailNotifications" outbound queue', () => {
				registry = createOutboundRegistry();
			});

			And('a service instance is created from the registry', async () => {
				svc = new registry.Service({ connectionString: 'UseDevelopmentStorage=true' });
				await svc.startUp();
			});

			When('I call sendMessageToEmailNotificationsQueue with an invalid payload', async () => {
				let threw = false;
				try {
					await svc.sendMessageToEmailNotificationsQueue({ to: 'not-an-email', subject: 'hi' });
				} catch (_e) {
					threw = true;
				}
				threwGlobal = threw;
			});

			Then('a validation error is thrown describing the schema violation', () => {
				expect(threwGlobal).toBe(true);
			});
		});

		Scenario('Peeking at messages in an outbound queue', ({ Given, When, Then, And }) => {
			let result: unknown;

			Given('a queue registry with a "emailNotifications" outbound queue', () => {
				registry = createPeekRegistry();
			});

			And('a service instance is created from the registry', async () => {
				svc = new registry.Service({ connectionString: 'UseDevelopmentStorage=true' });
				peekedMessageItems = [
					{
						messageId: 'msg-1',
						messageText: Buffer.from(JSON.stringify({ to: 'user@example.com', subject: 'hello' })).toString('base64'),
						dequeueCount: 0,
					},
				];
				await svc.startUp();
			});

			When('I call peekAtEmailNotificationsQueue', async () => {
				result = await svc.peekAtEmailNotificationsQueue();
			});

			Then('a list of typed messages is returned', () => {
				expect(Array.isArray(result)).toBe(true);
				expect((result as unknown[]).length).toBe(1);
			});
		});
	});
});
