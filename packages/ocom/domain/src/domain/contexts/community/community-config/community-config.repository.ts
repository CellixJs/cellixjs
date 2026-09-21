import type { Repository } from '@cellix/domain-seedwork/repository';
import type { CommunityConfig, CommunityConfigProps } from './community-config.ts';

export interface CommunityConfigRepository<props extends CommunityConfigProps> extends Repository<CommunityConfig<props>> {
	getNewInstance(subscriptionTier: string, pricePerMember: number, currency: string, maxMembers: number, maxAdmins: number, effectiveDate: Date): Promise<CommunityConfig<props>>;
	getById(id: string): Promise<CommunityConfig<props>>;
}
