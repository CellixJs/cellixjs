import { describe, expect, it, vi } from 'vitest';
import * as RateLimiting from './index.ts';
import { createRateLimitKey, type RateLimitCounterDecision, type RateLimitCounterRequest, ServiceRateLimiting } from './index.ts';

class TestRateLimitingService extends ServiceRateLimiting {
	public readonly consumeCounter = vi.fn<(request: RateLimitCounterRequest) => Promise<RateLimitCounterDecision>>();
	public readonly startBackend = vi.fn(async () => undefined);
	public readonly stopBackend = vi.fn(async () => undefined);

	protected override onStartUp(): Promise<void> {
		return this.startBackend();
	}

	protected override onShutDown(): Promise<void> {
		return this.stopBackend();
	}
}

describe('ServiceRateLimiting', () => {
	const policy = { feature: 'record.create', criteria: { actorType: 'user' }, limit: 2, windowMs: 60_000 } as const;

	it('owns lifecycle and allows unconfigured features without touching the backend', async () => {
		const service = new TestRateLimitingService([]);
		const request = { feature: 'record.read', subject: { id: 'user-1' } };

		await expect(service.consume(request)).rejects.toThrow('not started');
		await service.startUp();
		expect(await service.consume(request)).toEqual({
			allowed: true,
			feature: 'record.read',
			limit: null,
			remaining: null,
			resetAt: null,
			retryAfterMs: null,
		});
		expect(service.consumeCounter).not.toHaveBeenCalled();
		await service.shutDown();
		expect(service.startBackend).toHaveBeenCalledOnce();
		expect(service.stopBackend).toHaveBeenCalledOnce();
	});

	it('passes a generic fixed-window counter request to the implementation', async () => {
		const service = new TestRateLimitingService([policy]);
		const now = new Date('2026-08-04T14:30:00.000Z');
		const request = {
			feature: 'record.create',
			subject: { scope: 'tenant-1', id: 'user/1', attributes: { actorType: 'user' } },
			now,
		};
		service.consumeCounter.mockResolvedValue({ allowed: true, remaining: 1, resetAt: new Date('2026-08-04T14:31:00.000Z') });

		await service.startUp();
		const decision = await service.consume(request);

		expect(service.consumeCounter).toHaveBeenCalledWith({
			key: createRateLimitKey(request, now.getTime()),
			limit: 2,
			windowMs: 60_000,
			cost: 1,
			now,
		});
		expect(createRateLimitKey(request, now.getTime())).toBe('rate-limit:tenant-1:user%2F1:record.create:1785853800000');
		expect(decision).toMatchObject({ allowed: true, feature: 'record.create', remaining: 1 });
		expect(decision).not.toHaveProperty('accountType');
	});

	it('owns policy validation and most-specific resolution as one internal concern', async () => {
		expect(RateLimiting).not.toHaveProperty('resolveRateLimitPolicy');
		const service = new TestRateLimitingService([
			{ feature: 'upload', limit: 5, windowMs: 60_000 },
			{ feature: 'upload', criteria: { plan: 'trial' }, limit: 3, windowMs: 60_000 },
			{ feature: 'upload', criteria: { plan: 'trial', region: 'east' }, limit: 2, windowMs: 60_000 },
		]);
		service.consumeCounter.mockResolvedValue({ allowed: true, remaining: 1, resetAt: new Date('2026-08-04T14:31:00.000Z') });
		await service.startUp();

		await service.consume({ feature: 'upload', subject: { id: 'subject-1', attributes: { plan: 'trial', region: 'east' } }, now: new Date('2026-08-04T14:30:00.000Z') });

		expect(service.consumeCounter).toHaveBeenCalledWith(expect.objectContaining({ limit: 2 }));
	});

	it('returns retry information when the backend denies a request', async () => {
		const service = new TestRateLimitingService([policy]);
		service.consumeCounter.mockResolvedValue({ allowed: false, remaining: 0, resetAt: new Date('2026-08-04T14:31:00.000Z') });
		await service.startUp();

		const decision = await service.consume({
			feature: 'record.create',
			subject: { id: 'user-1', attributes: { actorType: 'user' } },
			now: new Date('2026-08-04T14:30:00.000Z'),
		});

		expect(decision).toMatchObject({ allowed: false, retryAfterMs: 60_000 });
	});

	it('rejects invalid or ambiguous policy configuration', async () => {
		expect(() => new TestRateLimitingService([policy, { ...policy, limit: 3 }])).toThrow('Duplicate rate-limit policy selector');
		expect(() => new TestRateLimitingService([{ ...policy, cost: 0 }])).toThrow('cost must be an integer between 1 and 2');

		const service = new TestRateLimitingService([
			{ feature: 'record.create', criteria: { actorType: 'staff' }, limit: 2, windowMs: 60_000 },
			{ feature: 'record.create', criteria: { role: 'admin' }, limit: 3, windowMs: 60_000 },
		]);
		await service.startUp();
		await expect(service.consume({ feature: 'record.create', subject: { id: 'staff-1', attributes: { actorType: 'staff', role: 'admin' } } })).rejects.toThrow('Ambiguous rate-limit policies');
	});
});
