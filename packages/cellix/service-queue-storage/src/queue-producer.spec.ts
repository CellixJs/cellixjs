import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createQueueProducer } from './queue-producer.js';

type MinimalQueueService = { sendMessage(queue: string, message: unknown, opts?: Record<string, unknown>): Promise<void> };

describe('createQueueProducer', () => {
	it('generates send method names from keys', () => {
		const EmailSchema = z.object({ to: z.string().email(), subject: z.string() });
		const definitions = {
			emailNotifications: { queueName: 'email-notifications', schema: EmailSchema },
		} as const;

		const mockService = { sendMessage: vi.fn().mockResolvedValue(undefined) } as unknown as MinimalQueueService;

		const ctx = createQueueProducer(mockService, definitions) as unknown as { sendEmailNotifications: (p: { to: string; subject: string }) => Promise<void> };

		expect(typeof ctx.sendEmailNotifications).toBe('function');
	});

	it('validates payload and throws on invalid', async () => {
		const EmailSchema = z.object({ to: z.string().email(), subject: z.string() });
		const definitions = {
			emailNotifications: { queueName: 'email-notifications', schema: EmailSchema },
		} as const;

		const mockService = { sendMessage: vi.fn().mockResolvedValue(undefined) } as unknown as MinimalQueueService;

		const ctx = createQueueProducer(mockService, definitions) as unknown as { sendEmailNotifications: (p: { to: string; subject: string }) => Promise<void> };

		await expect(ctx.sendEmailNotifications({ to: 'not-an-email', subject: 'hi' })).rejects.toBeTruthy();
	});

	it('calls service.sendMessage with queueName and validated payload', async () => {
		const EmailSchema = z.object({ to: z.string().email(), subject: z.string() });
		const definitions = {
			emailNotifications: { queueName: 'email-notifications', schema: EmailSchema, loggingTags: { domain: 'notifications' } },
		} as const;

		const mockService = { sendMessage: vi.fn().mockResolvedValue(undefined) } as unknown as MinimalQueueService;

		const ctx = createQueueProducer(mockService, definitions) as unknown as { sendEmailNotifications: (p: { to: string; subject: string }) => Promise<void> };

		const payload = { to: 'user@example.com', subject: 'hello' };
		await ctx.sendEmailNotifications(payload);

		expect(mockService.sendMessage).toHaveBeenCalledTimes(1);
		expect(mockService.sendMessage).toHaveBeenCalledWith('email-notifications', payload, { loggingTags: { domain: 'notifications' } });
	});
});
