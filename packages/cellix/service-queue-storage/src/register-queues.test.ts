import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { describe, expect, vi } from 'vitest';
import { registerQueues } from './index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/register-queues.feature'));

const test = { for: describeFeature };

function createRegistry() {
	return registerQueues({ outbound: { emailNotifications: { queueName: 'email-notifications', schema: { type: 'object' } } }, inbound: {} });
}

type QueueRegistry = ReturnType<typeof createRegistry>;

describe('registerQueues', () => {
	test.for(feature, ({ Scenario, BeforeEachScenario }) => {
		BeforeEachScenario(() => {
			vi.clearAllMocks();
			return undefined;
		});

		Scenario('Registry provides stubbed producer and consumer methods', ({ Given, Then, And }) => {
			let registry: unknown;
			Given('a queue registry with outbound and inbound queues', () => {
				registry = registerQueues({ outbound: { a: { queueName: 'q-a', schema: {} } }, inbound: { b: { queueName: 'q-b', schema: {} } } });
			});

			Then('the producer contains stub sendMessageTo<QueueName>Queue methods', () => {
				expect((registry as { producer: Record<string, unknown> }).producer.sendMessageToAQueue).toBeDefined();
			});
			And('the producer contains stub peekAt<QueueName>Queue methods', () => {
				expect((registry as { producer: Record<string, unknown> }).producer.peekAtAQueue).toBeDefined();
			});
			And('the consumer contains stub receiveFrom<QueueName>Queue and peekAt<QueueName>Queue methods', () => {
				expect((registry as { consumer: Record<string, unknown> }).consumer.receiveFromBQueue).toBeDefined();
				expect((registry as { consumer: Record<string, unknown> }).consumer.peekAtBQueue).toBeDefined();
			});
		});

		Scenario('Service created from the registry has typed queue methods', ({ Given, When, Then }) => {
			let registry: QueueRegistry;
			let service: unknown;
			Given('a queue registry with an "emailNotifications" outbound queue', () => {
				registry = createRegistry();
			});
			When('a service instance is created from the registry', () => {
				service = new registry.Service({ connectionString: 'UseDevelopmentStorage=true' });
			});
			Then('the service exposes sendMessageToEmailNotificationsQueue', () => {
				expect((service as Record<string, unknown>).sendMessageToEmailNotificationsQueue).toBeDefined();
			});
		});
	});
});
