import type { DomainDataSource } from '@ocom/domain';

/**
 * Integration event handlers.
 *
 * Community provisioning deliberately does not live here: the community create
 * application service must provision the owner member before it raises the first
 * subscription charge, so it owns that step synchronously. Handling CommunityCreated
 * here as well raced with it and produced duplicate roles and members.
 */
export const RegisterIntegrationEventHandlers = (_domainDataSource: DomainDataSource): void => {
	// no integration event handlers are registered at present
};
