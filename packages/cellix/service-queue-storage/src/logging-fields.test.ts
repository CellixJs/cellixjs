import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { describe, expect, vi } from 'vitest';
import { $payload, type IQueueMessageLogger, type LoggingFieldSpec, registerQueues, resolveLoggingFields } from './index.js';

type MockReceivedMessage = {
	messageId: string;
	popReceipt?: string;
	messageText: string;
	dequeueCount?: number;
};

let receivedMessageItems: MockReceivedMessage[] = [];

vi.mock('@azure/storage-queue', () => {
	return {
		QueueServiceClient: {
			fromConnectionString: vi.fn(() => ({
				getQueueClient: vi.fn(() => ({
					sendMessage: vi.fn(async () => ({ messageId: 'msg-123' })),
					createIfNotExists: vi.fn(async () => ({ succeeded: true })),
					receiveMessages: vi.fn(async () => ({ receivedMessageItems })),
					peekMessages: vi.fn(async () => ({ peekedMessageItems: [] })),
					deleteMessage: vi.fn(async () => ({})),
				})),
			})),
		},
	};
});

function createInboundRegistry() {
	return registerQueues({
		outbound: {},
		inbound: {
			importRequests: {
				queueName: 'import-requests',
				schema: { type: 'object', properties: { requestId: { type: 'string' }, externalId: { type: 'string' } }, required: ['requestId'] },
				loggingTags: { externalId: $payload.externalId },
			},
		},
	});
}

function createOutboundRegistry() {
	return registerQueues({
		outbound: {
			externalUpdates: {
				queueName: 'external-updates',
				schema: { type: 'object', properties: { externalId: { type: 'string' }, data: { type: 'string' } }, required: ['externalId'] },
				loggingTags: { domain: 'external', externalId: $payload.externalId },
			},
		},
		inbound: {},
	});
}

type InboundRegistry = ReturnType<typeof createInboundRegistry>;
type OutboundRegistry = ReturnType<typeof createOutboundRegistry>;
type InboundService = InstanceType<InboundRegistry['Service']>;
type OutboundService = InstanceType<OutboundRegistry['Service']>;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/logging-fields.feature'));

const test = { for: describeFeature };

describe('Logging field resolution', () => {
	test.for(feature, ({ Scenario }) => {
		Scenario('Hardcoded string value is used as-is', ({ Given, When, Then }) => {
			let spec: Record<string, LoggingFieldSpec>;
			let resolved: Record<string, string> | undefined;

			Given('a loggingTags spec with a hardcoded value "community" for key "domain"', () => {
				spec = { domain: 'community' };
			});
			When('the spec is resolved against any payload', () => {
				resolved = resolveLoggingFields(spec, { anything: true });
			});
			Then('the resolved tags contain domain="community"', () => {
				expect(resolved).toEqual({ domain: 'community' });
			});
		});

		Scenario('Payload field reference extracts a field from the message payload', ({ Given, When, Then }) => {
			let spec: Record<string, LoggingFieldSpec>;
			let resolved: Record<string, string> | undefined;

			Given('a loggingTags spec with a payloadField reference "externalId" for key "externalId"', () => {
				spec = { externalId: { payloadField: 'externalId' } };
			});
			When('the spec is resolved against a payload with externalId="ext-abc"', () => {
				resolved = resolveLoggingFields(spec, { externalId: 'ext-abc' });
			});
			Then('the resolved tags contain externalId="ext-abc"', () => {
				expect(resolved).toEqual({ externalId: 'ext-abc' });
			});
		});

		Scenario('$payload proxy extracts a field from the message payload', ({ Given, When, Then }) => {
			let spec: Record<string, LoggingFieldSpec>;
			let resolved: Record<string, string> | undefined;

			Given('a loggingTags spec using $payload.externalId for key "externalId"', () => {
				spec = { externalId: $payload.externalId };
			});
			When('the spec is resolved against a payload with externalId="ext-xyz"', () => {
				resolved = resolveLoggingFields(spec, { externalId: 'ext-xyz' });
			});
			Then('the resolved tags contain externalId="ext-xyz"', () => {
				expect(resolved).toEqual({ externalId: 'ext-xyz' });
			});
		});

		Scenario('Missing payload field is omitted from the result', ({ Given, When, Then }) => {
			let spec: Record<string, LoggingFieldSpec>;
			let resolved: Record<string, string> | undefined;

			Given('a loggingTags spec with a payloadField reference "externalId" for key "externalId"', () => {
				spec = { externalId: { payloadField: 'externalId' } };
			});
			When('the spec is resolved against a payload without that field', () => {
				resolved = resolveLoggingFields(spec, { otherId: '123' });
			});
			Then('the resolved tags do not contain the key "externalId"', () => {
				expect(resolved).toBeUndefined();
			});
		});

		Scenario('Consumer logs received messages with resolved metadata and tags', ({ Given, And, When, Then }) => {
			let registry: InboundRegistry;
			let svc: InboundService;
			let logSpy: ReturnType<typeof vi.fn>;

			Given('a queue registry with an "importRequests" inbound queue with loggingTags for "externalId"', () => {
				registry = createInboundRegistry();
			});

			And('a logger is configured on the service', () => {
				logSpy = vi.fn().mockResolvedValue({ container: 'c', blobName: 'b' });
				const mockLogger: IQueueMessageLogger = { logMessage: logSpy as IQueueMessageLogger['logMessage'] };
				svc = new registry.Service({ connectionString: 'UseDevelopmentStorage=true', logger: mockLogger });
			});

			When('a message with externalId="ext-xyz" is received from the queue', async () => {
				receivedMessageItems = [
					{
						messageId: 'msg-1',
						messageText: Buffer.from(JSON.stringify({ requestId: 'r1', externalId: 'ext-xyz' })).toString('base64'),
						dequeueCount: 1,
					},
				];
				await svc.startUp();
				await svc.receiveFromImportRequestsQueue();
			});

			Then('the logger is called with tags containing externalId="ext-xyz"', () => {
				expect(logSpy).toHaveBeenCalledOnce();
				const envelope = logSpy.mock.calls[0][0];
				expect(envelope.direction).toBe('inbound');
				expect(envelope.tags).toEqual({ externalId: 'ext-xyz', queueName: 'import-requests' });
			});
		});

		Scenario('Producer sends messages with resolved metadata and tags using $payload', ({ Given, And, When, Then }) => {
			let registry: OutboundRegistry;
			let svc: OutboundService;
			let logSpy: ReturnType<typeof vi.fn>;

			Given('a queue registry with an outbound queue using $payload.externalId in loggingTags', () => {
				registry = createOutboundRegistry();
			});

			And('a logger is configured on the service', async () => {
				logSpy = vi.fn().mockResolvedValue({ container: 'c', blobName: 'b' });
				const mockLogger: IQueueMessageLogger = { logMessage: logSpy as IQueueMessageLogger['logMessage'] };
				svc = new registry.Service({ connectionString: 'UseDevelopmentStorage=true', logging: { enabled: true, container: 'logs' }, logger: mockLogger });
				await svc.startUp();
			});

			When('a message with externalId="ext-abc" is sent to the queue', async () => {
				await svc.sendMessageToExternalUpdatesQueue({ externalId: 'ext-abc', data: 'test' });
			});

			Then('the logger is called with tags containing externalId="ext-abc"', () => {
				expect(logSpy).toHaveBeenCalledOnce();
				const envelope = logSpy.mock.calls[0][0];
				expect(envelope.direction).toBe('outbound');
				expect(envelope.tags).toEqual({ domain: 'external', externalId: 'ext-abc', queueName: 'external-updates' });
			});
		});
	});
});
