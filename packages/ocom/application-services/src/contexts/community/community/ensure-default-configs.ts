import { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

/**
 * Plan configuration an environment falls back to when it has none.
 *
 * Pricing is operator-managed data, but every billing path needs a configuration for
 * the tier it is working with. Without this, a freshly provisioned environment fails
 * every community create with "No community config found for subscription tier pro",
 * because nothing outside the verification seed ever wrote these rows.
 */
const DEFAULT_CONFIGS: ReadonlyArray<{
	subscriptionTier: string;
	pricePerMember: number;
	currency: string;
	maxMembers: number;
	maxAdmins: number;
}> = [
	{ subscriptionTier: Domain.Contexts.Community.Community.ValueObjects.SubscriptionTiers.Pro, pricePerMember: 1000, currency: 'USD', maxMembers: 50, maxAdmins: 2 },
	{ subscriptionTier: Domain.Contexts.Community.Community.ValueObjects.SubscriptionTiers.Enterprise, pricePerMember: 2000, currency: 'USD', maxMembers: 200, maxAdmins: 10 },
];

const EFFECTIVE_FROM = new Date('2020-01-01T00:00:00.000Z');

/** Creates any missing default plan configuration. Safe to call repeatedly. */
export const ensureDefaultConfigs = async (dataSources: DataSources): Promise<void> => {
	const systemPassport = Domain.PassportFactory.forSystem({ isSystemAccount: true });

	for (const config of DEFAULT_CONFIGS) {
		const existing = await dataSources.readonlyDataSource.Community.CommunityConfig.CommunityConfigReadRepo.getLatestEffective(config.subscriptionTier);
		if (existing) {
			continue;
		}
		await dataSources.domainDataSource.Community.CommunityConfig.CommunityConfigUnitOfWork.withTransaction(systemPassport, async (repo) => {
			const newConfig = await repo.getNewInstance(config.subscriptionTier, config.pricePerMember, config.currency, config.maxMembers, config.maxAdmins, EFFECTIVE_FROM);
			await repo.save(newConfig);
		});
	}
};
