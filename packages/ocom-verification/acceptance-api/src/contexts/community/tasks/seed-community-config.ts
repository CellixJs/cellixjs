import { type CommunityConfigSeedDocument, generateObjectId, upsertCommunityConfigs } from '@ocom-verification/verification-shared/test-data';
import { type Actor, Task } from '@serenity-js/core';
import { mongoDbName, testMongoServer } from '../../../servers/test-mongo-server.ts';

export class SeedCommunityConfig extends Task {
	static forPlan(plan: 'pro' | 'enterprise', effectiveDate: string, pricePerMember: number) {
		return new SeedCommunityConfig(plan, effectiveDate, pricePerMember);
	}

	private constructor(
		private readonly plan: 'pro' | 'enterprise',
		private readonly effectiveDate: string,
		private readonly pricePerMember: number,
	) {
		super(`seeds a ${plan} plan configuration effective on ${effectiveDate}`);
	}

	async performAs(_actor: Actor): Promise<void> {
		const defaults = this.plan === 'pro' ? { maxMembers: 50, maxAdmins: 2 } : { maxMembers: 200, maxAdmins: 10 };
		const now = new Date();
		const document: CommunityConfigSeedDocument = {
			_id: generateObjectId(),
			subscriptionTier: this.plan,
			subscription: {
				pricePerMember: this.pricePerMember,
				currency: 'USD',
			},
			limits: defaults,
			effectiveDate: new Date(`${this.effectiveDate}T00:00:00.000Z`),
			schemaVersion: '1.0.0',
			createdAt: now,
			updatedAt: now,
		};

		await upsertCommunityConfigs({ connectionString: testMongoServer.getConnectionString(), dbName: mongoDbName }, [document]);
	}

	override toString = () => `seeds a ${this.plan} plan configuration effective on ${this.effectiveDate}`;
}
