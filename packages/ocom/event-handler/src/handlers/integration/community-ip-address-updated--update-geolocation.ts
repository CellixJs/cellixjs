import type { GeolocationService } from '@cellix/service-geolocation-base';
import { Domain, type DomainDataSource } from '@ocom/domain';

const { EventBusInstance, CommunityIpAddressUpdatedEvent } = Domain.Events;

/**
 * Resolves the geolocation for a community's new IP address and stores it on the community settings.
 * `domainDataSource` must use the system passport; failures are logged and do not propagate.
 */
export default (domainDataSource: DomainDataSource, geolocationService: GeolocationService) => {
	EventBusInstance.register(CommunityIpAddressUpdatedEvent, async (payload) => {
		const { communityId, ipAddress } = payload;
		try {
			const location = await geolocationService.lookup(ipAddress);
			if (!location) {
				return;
			}
			await domainDataSource.Community.Community.CommunityUnitOfWork.withScopedTransaction(async (repo) => {
				const community = await repo.get(communityId);
				// Skip stale events when the IP changed again before this lookup finished.
				if (!community || community.settings.ipAddress !== ipAddress) {
					return;
				}
				community.settings.applyGeolocation({ countryCode: location.countryCode, countryName: location.countryName });
				await repo.save(community);
			});
		} catch (error) {
			console.error(`[geolocation] failed to update community ${communityId}:`, error);
		}
	});
};
