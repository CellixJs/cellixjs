import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { DataSources } from '@ocom/persistence';
import { expect, vi } from 'vitest';
import { updateSettings } from './update-settings.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/update-settings.feature'));

function setup(community: Record<string, unknown> | null) {
	const repo = { get: vi.fn().mockResolvedValue(community), save: vi.fn(async (c: unknown) => c) };
	const dataSources = {
		domainDataSource: {
			Community: {
				Community: {
					CommunityUnitOfWork: {
						withScopedTransaction: vi.fn(async (fn: (r: typeof repo) => Promise<void>) => {
							await fn(repo);
						}),
					},
				},
			},
		},
	} as unknown as DataSources;
	return { dataSources, repo };
}

const makeCommunity = () => ({ id: 'community-1', name: 'Original', settings: { ipAddress: undefined as string | undefined } });

test.for(feature, ({ Scenario }) => {
	Scenario('Updating settings with a client IP', ({ Given, When, Then, And }) => {
		let community: ReturnType<typeof makeCommunity>;
		let ctx: ReturnType<typeof setup>;
		Given('an existing community "community-1"', () => {
			community = makeCommunity();
			ctx = setup(community);
		});
		When('I update the settings for "community-1" with name "Renamed" and client IP "198.51.100.20"', async () => {
			await updateSettings(ctx.dataSources, '198.51.100.20')({ id: 'community-1', name: 'Renamed' });
		});
		Then('the community name should be "Renamed"', () => {
			expect(community.name).toBe('Renamed');
		});
		And('the community settings ipAddress should be set to "198.51.100.20"', () => {
			expect(community.settings.ipAddress).toBe('198.51.100.20');
		});
		And('the community should be saved', () => {
			expect(ctx.repo.save).toHaveBeenCalledWith(community);
		});
	});

	Scenario('Updating settings without a client IP', ({ Given, When, Then }) => {
		let community: ReturnType<typeof makeCommunity>;
		let ctx: ReturnType<typeof setup>;
		Given('an existing community "community-1"', () => {
			community = makeCommunity();
			ctx = setup(community);
		});
		When('I update the settings for "community-1" with name "Renamed" and no client IP', async () => {
			await updateSettings(ctx.dataSources)({ id: 'community-1', name: 'Renamed' });
		});
		Then('the community settings ipAddress should not be set', () => {
			expect(community.settings.ipAddress).toBeUndefined();
		});
	});

	Scenario('Updating a community that does not exist', ({ Given, When, Then }) => {
		let ctx: ReturnType<typeof setup>;
		let update: () => Promise<unknown>;
		Given('no community "missing"', () => {
			ctx = setup(null);
		});
		When('I update the settings for "missing"', () => {
			update = () => updateSettings(ctx.dataSources, '198.51.100.20')({ id: 'missing' });
		});
		Then('an error should be thrown indicating the community was not found', async () => {
			await expect(update()).rejects.toThrow('Community not found for id missing');
		});
	});
});
