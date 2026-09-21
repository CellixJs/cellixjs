import { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureDefaultConfigs } from './ensure-default-configs.ts';

describe('ensureDefaultConfigs', () => {
	let getLatestEffective: ReturnType<typeof vi.fn>;
	let save: ReturnType<typeof vi.fn>;
	let getNewInstance: ReturnType<typeof vi.fn>;
	let dataSources: DataSources;

	beforeEach(() => {
		vi.spyOn(Domain.PassportFactory, 'forSystem').mockReturnValue({} as Domain.Passport);
		getLatestEffective = vi.fn();
		save = vi.fn();
		getNewInstance = vi.fn(async () => ({}) as never);
		dataSources = {
			readonlyDataSource: {
				Community: {
					CommunityConfig: { CommunityConfigReadRepo: { getLatestEffective } },
				},
			},
			domainDataSource: {
				Community: {
					CommunityConfig: {
						CommunityConfigUnitOfWork: {
							withTransaction: async (_passport: unknown, handler: (repo: unknown) => Promise<void>) => {
								await handler({ getNewInstance, save });
							},
						},
					},
				},
			},
		} as unknown as DataSources;
	});

	it('creates the default Pro and Enterprise plans when an environment has none', async () => {
		getLatestEffective.mockResolvedValue(null);

		await ensureDefaultConfigs(dataSources);

		expect(getNewInstance).toHaveBeenCalledTimes(2);
		expect(getNewInstance).toHaveBeenCalledWith('pro', 1000, 'USD', 50, 2, expect.any(Date));
		expect(getNewInstance).toHaveBeenCalledWith('enterprise', 2000, 'USD', 200, 10, expect.any(Date));
		expect(save).toHaveBeenCalledTimes(2);
	});

	it('leaves operator-managed configuration alone', async () => {
		getLatestEffective.mockResolvedValue({ subscriptionTier: 'pro' });

		await ensureDefaultConfigs(dataSources);

		expect(getNewInstance).not.toHaveBeenCalled();
		expect(save).not.toHaveBeenCalled();
	});
});
