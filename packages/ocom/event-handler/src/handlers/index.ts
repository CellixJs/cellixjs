import type { DomainDataSource } from '@ocom/domain';
import { RegisterDomainEventHandlers } from './domain/index.ts';
import { type IntegrationEventHandlerServices, RegisterIntegrationEventHandlers } from './integration/index.ts';

export type { IntegrationEventHandlerServices } from './integration/index.ts';

export const RegisterEventHandlers = (domainDataSource: DomainDataSource, services: IntegrationEventHandlerServices) => {
	RegisterDomainEventHandlers(domainDataSource);
	RegisterIntegrationEventHandlers(domainDataSource, services);
};
