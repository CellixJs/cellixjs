import type { GeolocationService } from '@cellix/service-geolocation-base';
import type { DomainDataSource } from '@ocom/domain';
import RegisterCommunityCreatedProvisionMemberAndDefaultRoleHandler from './community-created--provision-member-and-default-role.ts';
import RegisterCommunityIpAddressUpdatedUpdateGeolocationHandler from './community-ip-address-updated--update-geolocation.ts';

export interface IntegrationEventHandlerServices {
	geolocationService: GeolocationService;
}

export const RegisterIntegrationEventHandlers = (domainDataSource: DomainDataSource, services: IntegrationEventHandlerServices): void => {
	RegisterCommunityCreatedProvisionMemberAndDefaultRoleHandler(domainDataSource);
	RegisterCommunityIpAddressUpdatedUpdateGeolocationHandler(domainDataSource, services.geolocationService);
};
