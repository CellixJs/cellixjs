import type { DomainDataSource } from "@ocom/api-domain";
import { RegisterDomainEventHandlers } from "./domain/index.ts";
import { RegisterIntegrationEventHandlers } from "./integration/index.ts";

export const RegisterEventHandlers = (
    domainDataSource: DomainDataSource
) => {
    RegisterDomainEventHandlers(domainDataSource);
    RegisterIntegrationEventHandlers(domainDataSource);
}