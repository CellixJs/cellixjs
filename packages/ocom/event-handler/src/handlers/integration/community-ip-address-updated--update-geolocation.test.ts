import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { GeolocationService } from '@cellix/service-geolocation-base';
import { Domain, type DomainDataSource } from '@ocom/domain';
import { expect, vi } from 'vitest';
import RegisterHandler from './community-ip-address-updated--update-geolocation.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/community-ip-address-updated--update-geolocation.feature'));

type Handler = (payload: { communityId: string; ipAddress: string }) => Promise<void>;

function setup(storedIpAddress: string, geolocationService: GeolocationService | undefined) {
	let handler: Handler | undefined;
	vi.spyOn(Domain.Events.EventBusInstance, 'register').mockImplementation((_event, fn) => {
		handler = fn as unknown as Handler;
	});
	const applyGeolocation = vi.fn();
	const community = { settings: { ipAddress: storedIpAddress, applyGeolocation } };
	const repo = { get: vi.fn().mockResolvedValue(community), save: vi.fn() };
	const withScopedTransaction = vi.fn(async (fn: (r: typeof repo) => Promise<void>) => {
		await fn(repo);
	});
	const domainDataSource = { Community: { Community: { CommunityUnitOfWork: { withScopedTransaction } } } } as unknown as DomainDataSource;
	RegisterHandler(domainDataSource, geolocationService);
	if (!handler) {
		throw new Error('handler was not registered');
	}
	return { handler, applyGeolocation, repo, withScopedTransaction };
}

const canadaService = (): GeolocationService => ({
	provider: 'ipinfo-lite',
	lookup: vi.fn().mockResolvedValue({ provider: 'ipinfo-lite', countryCode: 'CA', countryName: 'Canada' }),
});

test.for(feature, ({ Scenario }) => {
	Scenario('Storing the resolved geolocation on the community settings', ({ Given, And, When, Then }) => {
		let ctx: ReturnType<typeof setup>;
		let service: GeolocationService;
		Given('a community whose settings ipAddress is "198.51.100.20"', () => {
			// stored IP is set in setup below
		});
		And('a geolocation service that resolves "198.51.100.20" to Canada', () => {
			service = canadaService();
			ctx = setup('198.51.100.20', service);
		});
		When('a CommunityIpAddressUpdatedEvent for that community and ipAddress is handled', async () => {
			await ctx.handler({ communityId: 'community-1', ipAddress: '198.51.100.20' });
		});
		Then('the community settings should receive the geolocation from the provider', () => {
			expect(service.lookup).toHaveBeenCalledWith('198.51.100.20');
			expect(ctx.repo.get).toHaveBeenCalledWith('community-1');
			expect(ctx.applyGeolocation).toHaveBeenCalledWith({ countryCode: 'CA', countryName: 'Canada' });
		});
		And('the community should be saved', () => {
			expect(ctx.repo.save).toHaveBeenCalled();
		});
	});

	Scenario('Ignoring a stale event', ({ Given, And, When, Then }) => {
		let ctx: ReturnType<typeof setup>;
		Given('a community whose settings ipAddress is "203.0.113.10"', () => {
			// stored IP is set in setup below
		});
		And('a geolocation service that resolves "198.51.100.20" to Canada', () => {
			ctx = setup('203.0.113.10', canadaService());
		});
		When('a CommunityIpAddressUpdatedEvent for that community and ipAddress "198.51.100.20" is handled', async () => {
			await ctx.handler({ communityId: 'community-1', ipAddress: '198.51.100.20' });
		});
		Then('the community should not be saved', () => {
			expect(ctx.applyGeolocation).not.toHaveBeenCalled();
			expect(ctx.repo.save).not.toHaveBeenCalled();
		});
	});

	Scenario('Geolocation not configured', ({ Given, When, Then }) => {
		let ctx: ReturnType<typeof setup>;
		Given('no geolocation service', () => {
			ctx = setup('198.51.100.20', undefined);
		});
		When('a CommunityIpAddressUpdatedEvent is handled', async () => {
			await ctx.handler({ communityId: 'community-1', ipAddress: '198.51.100.20' });
		});
		Then('no unit of work should be started', () => {
			expect(ctx.withScopedTransaction).not.toHaveBeenCalled();
		});
	});

	Scenario('Provider failure', ({ Given, When, Then }) => {
		let ctx: ReturnType<typeof setup>;
		let consoleError: ReturnType<typeof vi.spyOn>;
		Given('a geolocation service that fails', () => {
			consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
			ctx = setup('198.51.100.20', { provider: 'ipinfo-lite', lookup: vi.fn().mockRejectedValue(new Error('status 429')) });
		});
		When('a CommunityIpAddressUpdatedEvent is handled', async () => {
			await ctx.handler({ communityId: 'community-1', ipAddress: '198.51.100.20' });
		});
		Then('the error should be logged and not thrown', () => {
			expect(consoleError).toHaveBeenCalled();
			expect(ctx.withScopedTransaction).not.toHaveBeenCalled();
		});
	});
});
