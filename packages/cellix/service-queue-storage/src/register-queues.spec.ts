import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { registerQueues } from './register-queues.js';
import type { ServiceQueueStorage } from './service-queue-storage.js';

describe('registerQueues', () => {
	it('produces send method names and binds to service', async () => {
		const EmailSchema = z.object({ to: z.string().email(), subject: z.string() });
		const definitions = {
			outbound: {
				emailNotifications: { queueName: 'email-notifications', schema: EmailSchema },
			},
			inbound: {},
		} as const;

		const registry = registerQueues(definitions);
		expect('sendEmailNotifications' in registry.producer).toBe(true);

		// mock service
		const mockService = { sendMessage: vi.fn().mockResolvedValue(undefined), receiveMessages: vi.fn(), deleteMessage: vi.fn() } as unknown as ServiceQueueStorage;
		const bound = registry._bind(mockService);

		const ctx = bound.producer as unknown as Record<string, (p: unknown) => Promise<void>>;
		await ctx.sendEmailNotifications({ to: 'user@example.com', subject: 'hello' });

		const calls = (mockService.sendMessage as unknown as { mock?: { calls?: unknown[] } }).mock?.calls ?? [];
		expect(calls.length).toBe(1);
		expect(calls[0] && (calls[0] as unknown[])[0]).toBe('email-notifications');
	});

	it('validates payload on send and throws on invalid payload', async () => {
		const EmailSchema = z.object({ to: z.string().email(), subject: z.string() });
		const definitions = {
			outbound: {
				emailNotifications: { queueName: 'email-notifications', schema: EmailSchema },
			},
			inbound: {},
		} as const;

		const registry = registerQueues(definitions);
		const mockService = { sendMessage: vi.fn().mockResolvedValue(undefined), receiveMessages: vi.fn(), deleteMessage: vi.fn() } as unknown as ServiceQueueStorage;
		const bound = registry._bind(mockService);
		const ctx = bound.producer as unknown as Record<string, (p: unknown) => Promise<void>>;

		await expect(ctx.sendEmailNotifications({ to: 'not-an-email', subject: 'hi' })).rejects.toBeTruthy();
	});
});
