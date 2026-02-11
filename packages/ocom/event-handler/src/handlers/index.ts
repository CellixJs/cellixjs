import type { DomainDataSource } from "@ocom/domain";
import type { ServiceQueueStorage } from "@ocom/service-queue-storage";
import { RegisterDomainEventHandlers } from "./domain/index.ts";
import { RegisterIntegrationEventHandlers } from "./integration/index.ts";

export const RegisterEventHandlers = (
	domainDataSource: DomainDataSource,
	queueService?: ServiceQueueStorage,
) => {
	RegisterDomainEventHandlers(domainDataSource);
	RegisterIntegrationEventHandlers(domainDataSource, queueService);
};